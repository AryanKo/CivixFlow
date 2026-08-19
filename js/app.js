/**
 * AI Traffic Command Center - Main Application Orchestrator & Bootstrap
 * Single authoritative, exception-safe 60 FPS Master Simulation Loop.
 */

import { SimulationEngine } from './simulation/engine.js';
import { AdaptiveSignalAI } from './ai/adaptiveSignalAI.js';
import { CongestionPredictor } from './ai/predictor.js';
import { EmergencyPriorityManager } from './ai/emergencyPreempt.js';
import { CanvasRenderer } from './visualization/canvasRenderer.js';
import { TelemetryCharts } from './visualization/charts.js';
import { UIComponents } from './visualization/uiComponents.js';
import { store } from './state/store.js';

class App {
  constructor() {
    this.engine = null;
    this.ai = null;
    this.predictor = null;
    this.emergencyManager = null;
    this.renderer = null;
    this.charts = null;
    this.ui = null;
    this.lastTime = 0;
  }

  init() {
    console.log('🚀 Initializing AI Traffic Command Center...');

    // 1. Initialize Simulation Engine
    this.engine = new SimulationEngine();

    // 2. Initialize AI Modules
    this.ai = new AdaptiveSignalAI(this.engine.network);
    this.predictor = new CongestionPredictor(this.engine.network);
    this.emergencyManager = new EmergencyPriorityManager(this.engine);

    // 3. Initialize Canvas Renderer
    const canvas = document.getElementById('trafficCanvas');
    if (canvas) {
      this.renderer = new CanvasRenderer(canvas);
      window.addEventListener('resize', () => {
        try { this.renderer.resize(); } catch (e) {}
      });
      try { this.renderer.resize(); } catch (e) {}
    }

    // 4. Initialize Analytics Charts
    this.charts = new TelemetryCharts();

    // 5. Initialize UI Components & Event Bindings
    this.ui = new UIComponents(this.engine);

    // 6. Connect State Store to Charts
    store.on('telemetry-updated', () => {
      try {
        if (this.charts) {
          this.charts.update(store.getState().history);
        }
      } catch (err) {
        console.error('Chart update error:', err);
      }
    });

    // 7. Start the Single Authoritative 60 FPS Master Simulation & Render Loop
    this.startMasterLoop();

    // 8. Initial Lucide Icons Render
    if (window.lucide) {
      try { window.lucide.createIcons(); } catch (e) {}
    }

    // 9. Initial System Online Decision Log
    setTimeout(() => {
      try {
        store.addAIDecision({
          type: 'INITIALIZATION',
          intersectionId: 'int-downtown',
          intersectionName: 'Downtown Central',
          action: 'System Online: AI Adaptive Signal Control Activated',
          confidence: 99.4,
          primaryReason: 'High-density telemetry established for Downtown Central Core. Max-Pressure demand monitoring engaged.',
          tradeOff: 'All 4 approach corridors synchronized to adaptive cycle.',
          impact: 'Baseline latency reduction active (-38% expected delay).',
          rule: 'Autonomous Traffic Orchestrator Core v4.2',
          badgeColor: 'emerald',
        });
      } catch (e) {}
    }, 600);

    console.log('✅ AI Traffic Command Center master loop active.');
  }

  /**
   * The Single Authoritative 60 FPS Master Simulation Loop
   */
  startMasterLoop() {
    this.lastTime = performance.now();

    const masterLoop = (currentTime) => {
      // 1. ALWAYS schedule the next frame FIRST - guaranteed never to drop
      requestAnimationFrame(masterLoop);

      const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      const state = store.getState();

      if (state.isRunning) {
        const dt = rawDt * (state.simulationSpeed || 1.0);

        // 2. Simulation Engine (Signals, Twin Baseline, Vehicles, Sensors, Telemetry)
        try {
          this.engine.update(dt);
        } catch (err) {
          console.error('Simulation engine update error:', err);
        }

        // 3. AI Controller (Max-Pressure, Gap-Out, Extensions)
        try {
          this.ai.update(dt);
        } catch (err) {
          console.error('AI controller update error:', err);
        }

        // 4. Emergency Vehicle Priority Manager
        try {
          this.emergencyManager.update(dt);
        } catch (err) {
          console.error('Emergency manager update error:', err);
        }

        // 5. Congestion Trend Predictor
        try {
          this.predictor.update(dt);
        } catch (err) {
          console.error('Predictor update error:', err);
        }
      }

      // 6. Render Canvas Frame
      if (this.renderer) {
        try {
          const activeNode = this.engine.network.getIntersection(state.activeIntersectionId);
          if (activeNode) {
            this.renderer.render(
              activeNode,
              this.engine.vehicles,
              state.isAiMode,
              state.activeEmergency
            );
          }
        } catch (err) {
          console.error('Canvas render error:', err);
        }
      }
    };

    requestAnimationFrame(masterLoop);
  }
}

// Bootstrap on DOM Loaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.__trafficApp = app;
});
