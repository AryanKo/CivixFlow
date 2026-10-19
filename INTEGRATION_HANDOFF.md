# Handoff: merge the actual backend with the CivixFlow frontend

## User intent and current scope

The user will supply the actual Arduino/mobile-hotspot backend. They explicitly asked this delivery to focus on fixing the frontend and to provide merge instructions. Do not assume the exploratory Python bridge in this workspace is their existing backend. Do not replace firmware or its command protocol based on that bridge.

The frontend preview is complete and runs via `python run.py` using only Python's standard library. All production assets are local. No Arduino firmware or Python ML implementation is part of this update. Inspect the actual backend and its own requirements before integrating.

## First inspect the supplied backend

1. Read its AGENTS.md/README, server routes, Arduino firmware and configuration before editing.
2. Identify the actual transport (USB serial / HTTP / TCP / WebSocket / UDP / MQTT), connection direction, IP/port discovery, hotspot setup, baud rate, packet framing and reconnect behavior. Do not assume TCP port 9000 or baud 115200: those are only editable proposed defaults in the optional panel.
3. Record the actual telemetry schema, timestamps/units, invalid-sensor markers, board reboot handling, emergency mode and signal-clearance states.
4. Identify any existing control/arming commands and ACKs. Preserve the firmware's safety rules and emergency priority. Keep frontend simulation controls isolated from physical commands unless the user requests hardware control.
5. Establish a passing backend test baseline and retain it through the merge.

## Frontend structure and invariants

- `index.html`: original CivixFlow layout plus preview status and collapsed optional backend connection panel.
- `js/app.js`: one requestAnimationFrame loop, setup, renderer and controller orchestration.
- `js/simulation/clock.js`: fixed 1/60 second physics steps; bounded catch-up; time advances with playback speed. Pause and tab changes discard unused elapsed time.
- `js/simulation/engine.js`: spawning, vehicle updates, simulated sensors and metrics. `simTime` is the simulation clock, not wall time.
- `js/simulation/vehicle.js`: continuous motion, car following, stops and turns. Queued vehicles obey red, emergency vehicles follow the preempted signal, Bezier endpoints are applied before exiting.
- `js/visualization/canvasRenderer.js`: world coordinates remain 800x800; DPR-aware rendering; cached roads and vehicle sprites. Interpolation is visual only; actual vehicle positions are restored before the next physics step.
- `js/ai/adaptiveSignalAI.js`: local max-pressure/gap-out fallback, not trained ML.
- `js/backend.js`: proposed backend adapter; disabled until the optional checkbox is enabled. Normal preview makes zero API or WebSocket requests. Adapt this file to the real routes/protocol instead of spreading fetch/WebSocket calls through the simulation.
- `js/state/store.js`: simulation UI event bus. Do not overwrite simulation metrics with measured hardware counts.

Keep expensive model work outside the animation loop. Use a background worker/process on the backend; send compact snapshots. Do not move cars directly on packet receipt. Update targets/data, then animate between visual states. Avoid chart/DOM updates at frame rate; they currently update on telemetry cadence. Preserve one physics loop and one renderer loop rather than adding independent timers that advance vehicle physics.

## Proposed optional adapter contract (change to match real backend)

All endpoints below are **proposals implemented by the frontend adapter, not endpoints in run.py**. Prefer serving frontend and backend from one origin. Replace the preview server with the actual server's static-file route, or proxy API/WebSocket routes in development. If origins differ, explicitly handle API CORS and WebSocket origin validation. Never expose credentials in frontend source.

| Endpoint | Proposed behavior |
| --- | --- |
| WS `/ws/simulation` | One isolated brain per browser. Receive simulated telemetry at up to 10 Hz; respond once per received message (backpressure ACK), with an ML snapshot about once per simulated second. |
| WS `/ws/hardware` | Stream measured connection status and shadow-brain snapshots, around 4 Hz. Never substitute simulated telemetry on failure. |
| GET `/api/ports` | `[{"port":"COM3","description":"USB Serial"}]` |
| POST `/api/connection` | JSON `{transport,host,port,serial_port,baud}`; validate and initiate the actual existing transport. |
| DELETE `/api/connection` | Disconnect and release device resources. |

Simulation telemetry currently sent by the adapter:

```json
{"ms":12340,"g":"A","ph":"GREEN","mode":"AUTO","pt":2340,"a":{"n":3,"ok":1,"w":0},"b":{"n":2,"ok":1,"w":3400}}
```

`ms`, `pt` and `w` are milliseconds. `ms` is simulation time in this socket, device uptime in physical telemetry. `n` is non-crossed inbound car count, not a detected physical position. The browser maps **Road A = N + S** and **Road B = E + W**. The physical board may have only two one-way lanes; explicitly document this approximation and allow remapping. `ph` is CLEARING during amber/all-red; mode is EMERGENCY during priority preemption. Do not feed invalid sensors into learning.

Simulation response shape:

```json
{"source":"simulated","brain":{"valid":true,"ready":false,"rates":{"A":{"arrive":{"mean":6}},"B":{"arrive":{"mean":6}}},"progress":{"A":{"arrivals":0,"releases":0},"B":{"arrivals":0,"releases":0}},"decision":{"action":"HOLD","why":"Learning traffic","p_switch_better":0.3}}}
```

For messages without an inference result, return `{"accepted":true}`. The adapter allows only one outstanding request; failing to ACK will halt further telemetry. Validate input and bound message sizes. Use the existing Brain output directly if the actual backend already integrates it. `Brain.configure` uses minG/maxG/clr in milliseconds and carMm/lineA/lineB in millimetres; `on_telemetry` expects the schema above; `tick` should run outside the event-loop thread when expensive. Do not share one mutable Brain between hardware and simulated browsers.

Hardware snapshot shape currently read by the connection panel:

```json
{"connected":false,"fresh":false,"age_s":null,"error":null,"transport":null,"packet":null,"brain":null,"invalid_packets":0}
```

`packet` is the measured telemetry packet; `brain` is the corresponding hardware model snapshot. Retain last readings with an explicit stale label on disconnect, and suppress active recommendations until valid/fresh data returns. The preview does not ship a transport implementation in its ZIP.

## ML application and control precedence

The proposed adapter applies SWITCH to the **simulation** only when the model is valid and ready, the user enabled AI mode, the result is less than three wall-clock seconds old, its source phase still matches, emergency is inactive, clearance is inactive, and minimum green has elapsed. It calls the existing transition method so amber/all-red still occur. The actual min/max timings must come from the backend/firmware configuration rather than the current simulation defaults. Discard obsolete recommendations after phase changes.

The local adaptive controller remains active during warm-up or backend loss. Fixed mode retains fixed timers. Manual overrides are simulation-only. Hardware controls require a separate deliberate implementation based on the existing firmware's supported command/ACK protocol; do not reuse frontend emergency buttons as physical commands implicitly.

The existing frontend has heuristic congestion, CO2, safety and approximate baseline widgets. Label them as simulated/estimated; they are not ML validation metrics. If adding real forecasting, use held-out accuracy and show data age rather than hardcoded confidence or improvement claims. The decorative emergency messages inherited from CivixFlow are not proof of standards compliance.

## Verification before calling the merge complete

- `npm ci`, `npm run build`, `npm test`; existing backend tests still pass.
- Preview without a backend runs cars, switches phases, handles every preset, 1x/2x/5x, pause/resume and resize without console errors or external requests.
- Verify actual firmware packet examples through both valid and invalid sensor states, partial reads/framing, device reboot, cable removal, hotspot loss and reconnect. Test real hardware; loopback tests alone are insufficient.
- Hardware readings never enter simulated metrics; simulated cars never train the physical board's model. Each browser has independent simulation state.
- Slow/unavailable inference does not stutter animation; stale recommendations never switch a new phase; ML results do not override emergency/minimum-green/clearance rules.
- Check frontend status names the actual active controller: local fallback, fixed, ML learning, ML ready, hardware stale.
- Test backend adapter enable/disable and page reload/disposal without duplicate sockets/reconnect loops; test backpressure ACKs and socket errors.
- Test Windows launcher from an extracted ZIP on a machine without Node. Re-package after changes and include actual backend requirements/configuration in the final merged distribution only after verifying them.

## Delivery boundaries

This update contains frontend code, static preview servers, bundled assets and this handoff. It excludes the exploratory backend from the TrafficFree workspace. The actual Arduino repository belongs to another contributor and must be obtained separately.
