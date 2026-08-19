# 🚦 AI Traffic Command Center

[![Live Simulation](https://img.shields.io/badge/Live_Simulation-60_FPS-cyan.svg)](#)
[![AI Control](https://img.shields.io/badge/AI_Engine-Max--Pressure_%2B_Webster-emerald.svg)](#)
[![Explainable AI](https://img.shields.io/badge/XAI-Natural_Language_Rationale-indigo.svg)](#)
[![Emergency Preemption](https://img.shields.io/badge/Emergency-IEEE_1570_Corridor-red.svg)](#)

> **Theme**: AI-driven solution for traffic management  
> **Project**: AI Traffic Command Center  
> **A realistic, real-time traffic management dashboard and multi-intersection simulation demonstrating how AI analyzes traffic conditions, predicts bottlenecks, and recommends adaptive signal decisions.**

---

## 🌟 Key Features

1. **Autonomous Adaptive Signal Optimization**:
   - Implements **Max-Pressure Theory** and **Webster's Adaptive Green Timing Model**.
   - Dynamically balances phase extensions, early cut-offs for empty lanes, and corridor queue clearance.
   - Side-by-side benchmarking against legacy fixed-timer signal systems (demonstrating a **$40\% - 60\%$ reduction in average wait times**).

2. **Explainable AI (XAI) Intelligence Feed**:
   - Every AI action generates an interactive, human-readable rationale card detailing:
     - **Primary Driver**: Root cause of the decision (e.g., *Queue reached critical threshold of 19 vehicles*).
     - **Trade-Off Analysis**: Impact on opposing traffic corridors.
     - **Confidence Score**: Quantitative certainty percentage ($85\% - 99\%$).
     - **Impact Estimate**: Estimated delay reduction and idling seconds saved.
     - **Triggered Rule**: Algorithmic policy reference.

3. **Short-Term Congestion Predictor**:
   - Multi-horizon trend forecasting for **$+5\text{ mins}$**, **$+10\text{ mins}$**, and **$+15\text{ mins}$**.
   - Identifies impending arterial bottlenecks and provides proactive mitigation advisories.

4. **Emergency Vehicle Priority & Corridor Preemption**:
   - Interactive dispatch for **Ambulance**, **Fire Engine**, and **Police Interceptor**.
   - Automated optical/radio preemption protocol: pauses opposing traffic, flushes downstream queues, and holds a protected green wave until clear.

5. **High-Fidelity 60 FPS 2D Micro-Simulation**:
   - Physics-based vehicle agents (IDM car-following, braking lights, headlights, emergency strobes, smooth Bezier curve turns).
   - High-definition tarmac rendering with crosswalks, stop lines, signal gantries, countdown timers, and queue heatmaps.

6. **High-Density Downtown Central Intersection**:
   - 4-way balanced high-capacity intersection connecting the Commercial Core, Financial Plaza, and Transit Arterials with 3 dedicated lanes per approach (Left Turn, Straight, Right Turn).

7. **Environmental Analytics**:
   - Live calculations of vehicle fuel and $\text{CO}_2$ emissions prevented through minimized idling delay.

---

## 🚀 Quick Start & How to Run

Because the project is built with modern ES6+ modules and standard web technologies (HTML5, Tailwind CSS, Chart.js, Lucide Icons, Canvas API), **no build step, compilation, or package manager installation is required!**

### Option A: Open directly in your browser
Simply double-click or open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option B: Run with any local static HTTP server
If you prefer running via a local server:
```bash
# Using Python (if available):
python -m http.server 8000

# Using npx (if Node.js is installed):
npx serve .
```
Then navigate to `http://localhost:8000`.

---

## 📁 Repository Structure

```
nxs-promptwars-build/
├── index.html                  # Main Single Page Application dashboard
├── README.md                   # Project documentation & overview
├── assets/
│   └── css/
│       └── style.css           # Cyberpunk dark theme, glassmorphism, animations
├── js/
│   ├── app.js                  # Main bootstrap orchestrator & render loop
│   ├── config.js               # Simulation constants, vehicle specs, presets
│   ├── state/
│   │   └── store.js            # Central reactive store & event bus
│   ├── simulation/
│   │   ├── engine.js           # 60 FPS physics loop & telemetry collection
│   │   ├── vehicle.js          # Vehicle agent class (physics, IDM, turns)
│   │   ├── intersection.js     # Intersection signal state machine & sensors
│   │   └── network.js          # Multi-intersection road network coordinator
│   ├── ai/
│   │   ├── adaptiveSignalAI.js # Max-Pressure & Webster adaptive timing model
│   │   ├── predictor.js        # 5m/10m/15m congestion forecasting
│   │   ├── emergencyPreempt.js # Emergency detection, green wave & corridor lock
│   │   └── explainableAI.js    # Natural-language XAI rationale generator
│   ├── visualization/
│   │   ├── canvasRenderer.js   # 2D Canvas renderer (roads, cars, lights)
│   │   ├── charts.js           # Real-time Chart.js telemetry graphs
│   │   └── uiComponents.js     # UI event handlers, buttons, and toasts
│   └── utils/
│       ├── mathUtils.js        # Geometry, Bezier curves, and interpolation
│       └── audioUtils.js       # Web Audio API alert & siren synthesizer
└── docs/
    └── HACKATHON_PITCH.md      # Judge presentation guide & talking points
```

---

## 🎮 Interactive Demo Controls

- **AI Auto-Pilot Switch**: Toggle between AI Adaptive signal control and Legacy Fixed-Timer baseline to see the dramatic difference in wait times.
- **Scenario Preset Dropdown**: Switch between *Standard Normal Traffic*, *Morning Rush Hour Surge*, *Code Red: Emergency Rush*, *Lane Bottleneck*, and *Storm Weather*.
- **Operator Overrides**: Manually force North-South or East-West green to test manual operator interventions.

---

## 🏆 Hackathon Pitch & Judge Walkthrough
For the complete 3-minute presentation script and judging talking points, see [docs/HACKATHON_PITCH.md](docs/HACKATHON_PITCH.md).