import { store } from './state/store.js';
import { PHASES } from './simulation/intersection.js';

const socketURL = path => `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`;

export class Backend {
  constructor(engine) {
    this.engine = engine;
    this.snapshot = null;
    this.lastReply = 0;
    this.pending = false;
    this.lastSent = -1;
    this.closed = false;
    this.enabled = false;
    this.bindControls();
    window.addEventListener('pagehide', () => {
      this.closed = true;
      this.sim?.close(); this.hardware?.close();
    });
  }

  connectSimulation() {
    if (this.closed || !this.enabled) return;
    const ws = this.sim = new WebSocket(socketURL('/ws/simulation'));
    ws.onopen = () => { this.pending = false; this.snapshot = null; };
    ws.onmessage = ({data}) => {
      this.pending = false;
      const reply = JSON.parse(data);
      if (reply.brain) {
        this.snapshot = reply.brain;
        this.snapshot.phase = this.sentPhase;
        this.lastReply = performance.now();
        const s = this.snapshot;
        const text = !store.getState().isAiMode ? 'Fixed-timer simulation · ML runs in observation mode' : !s.valid ? 'Waiting for valid simulated counts' : !s.ready ? 'Learning from simulated arrivals and departures · local adaptive controller active' : 'TrafficMind Bayesian planner · simulated traffic';
        document.getElementById('mlStatus').textContent = text;
        const decision = s.decision;
        document.getElementById('mlDecision').textContent = decision ? `${decision.action} · ${decision.why || 'Monte Carlo queue planning'}` : 'Collecting evidence';
        document.getElementById('mlRates').textContent = ['A','B'].map(lane => `${lane}: ${s.rates[lane].arrive.mean.toFixed(1)} arrivals/min · ${s.progress[lane].arrivals} arrivals / ${s.progress[lane].releases} departures learned`).join(' | ');
        if (s.ready && decision?.action === 'SWITCH') {
          store.addAIDecision({type:'ML_PLANNER', action:'TrafficMind recommends SWITCH (simulated)', confidence:Math.round((decision.p_switch_better ?? 0) * 100), primaryReason:decision.why, impact:'Queue-delay estimate from sampled future arrivals and releases.', tradeOff:'Applies after minimum green, amber and all-red clearance.', rule:'Bayesian rate learning + Monte Carlo planner'});
        }
      }
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      this.snapshot = null;
      this.pending = false;
      document.getElementById('mlStatus').textContent = this.enabled ? 'Backend unavailable · local adaptive simulation continues · reconnecting' : 'Frontend preview · local adaptive simulation · backend disconnected';
      if (!this.closed && this.enabled) setTimeout(() => this.connectSimulation(), 2000);
    };
  }

  get controlsSimulation() {
    return Boolean(this.snapshot?.valid && this.snapshot?.ready && performance.now() - this.lastReply < 3000);
  }

  update(time) {
    const node = this.engine.network.getIntersection(store.getState().activeIntersectionId);
    if (!node) return;
    const decision = this.snapshot?.decision;
    if (store.getState().isAiMode && this.controlsSimulation && decision?.action === 'SWITCH' && this.snapshot.phase === node.currentPhase && !node.emergencyState.active && !node.isAmber && !node.isAllRed && node.phaseTimer >= 6 && this.applied !== this.snapshot) {
      node.transitionToNextPhase();
      this.applied = this.snapshot;
    }
    if (!this.enabled || time - this.lastSent < 0.1 || this.pending || this.sim?.readyState !== WebSocket.OPEN) return;
    this.lastSent = time;
    this.sentPhase = node.currentPhase;
    const ns = node.currentPhase === PHASES.NS_GREEN || node.currentPhase === PHASES.NS_LEFT;
    const clearing = node.isAmber || node.isAllRed;
    const group = dirs => {
      const cars = this.engine.vehicles.filter(v => dirs.includes(v.approach) && !v.hasCrossedStopLine);
      return {n: cars.length, ok: 1, w: Math.round(Math.max(0, ...cars.map(v => v.waitTime)) * 1000)};
    };
    this.sim.send(JSON.stringify({ms: Math.round(time * 1000), g: ns ? 'A' : 'B', ph: clearing ? 'CLEARING' : 'GREEN', mode: node.emergencyState.active ? 'EMERGENCY' : 'AUTO', pt: Math.round(node.phaseTimer * 1000), a: group(['N','S']), b: group(['E','W'])}));
    this.pending = true;
  }

  connectHardware() {
    if (this.closed || !this.enabled) return;
    const ws = this.hardware = new WebSocket(socketURL('/ws/hardware'));
    ws.onmessage = ({data}) => {
      const status = JSON.parse(data);
      const label = document.getElementById('hardwareStatus');
      label.textContent = status.fresh ? `Receiving ${status.transport} telemetry · ${status.age_s}s old` : status.connected ? 'Connected · telemetry stale / waiting for packets' : status.error ? `Reconnecting: ${status.error}` : 'Hardware disconnected';
      label.style.color = status.fresh ? '#34d399' : '#fbbf24';
      const p = status.packet;
      document.getElementById('hardwareCounts').textContent = p ? `Last measured: Road A ${p.a.ok ? p.a.n : 'sensor invalid'} cars · Road B ${p.b.ok ? p.b.n : 'sensor invalid'} cars · ${p.g} / ${p.ph} · ${status.invalid_packets} invalid packets` : 'No measurements received';
      const b = status.brain;
      document.getElementById('hardwareBrain').textContent = status.fresh && b?.valid ? `Hardware ML: ${b.decision?.action || 'collecting evidence'} · ${b.ready ? 'ready' : 'learning'} · observation only` : 'Hardware ML waiting for fresh valid telemetry';
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      document.getElementById('hardwareStatus').textContent = 'Backend disconnected · last measurements are stale';
      if (!this.closed && this.enabled) setTimeout(() => this.connectHardware(), 2000);
    };
  }

  bindControls() {
    document.getElementById('backendEnabled').onchange = event => {
      this.enabled = event.target.checked;
      document.getElementById('backendControls').disabled = !this.enabled;
      if (this.enabled) { this.connectSimulation(); this.connectHardware(); }
      else {
        this.sim?.close(); this.hardware?.close();
        this.snapshot = null; this.pending = false;
        document.getElementById('mlStatus').textContent = 'Frontend preview · local adaptive simulation · backend disconnected';
      }
    };
    const form = document.getElementById('connectionForm');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      values.port = Number(values.port); values.baud = Number(values.baud);
      try {
        const response = await fetch('/api/connection', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(values)});
        if (!response.ok) throw new Error(JSON.stringify((await response.json()).detail));
      } catch(error) { document.getElementById('hardwareStatus').textContent = error.message; }
    });
    document.getElementById('disconnectHardware').onclick = async () => {
      try { await fetch('/api/connection', {method:'DELETE'}); }
      catch { document.getElementById('hardwareStatus').textContent = 'Backend unavailable'; }
    };
    document.getElementById('refreshPorts').onclick = async () => {
      try {
        const response = await fetch('/api/ports');
        if (!response.ok) throw new Error('Port scan failed');
        const ports = await response.json();
        const list = document.getElementById('serialPorts');
        list.replaceChildren(...ports.map(p => new Option(p.description, p.port)));
        if (!ports.length) document.getElementById('hardwareStatus').textContent = 'No USB serial ports detected';
      } catch(error) { document.getElementById('hardwareStatus').textContent = error.message; }
    };
  }
}
