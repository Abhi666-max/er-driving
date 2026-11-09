# ER.DRIVING & RE-SYNTH

> **Autonomous Reverse-Engineering & Code Synthesis Platform**  
> **Re-engineered and Created for Abhijeet kangane**  
> Inspired by the architectural paradigms of `morluto/rea` and `storytold/craft-anything`.

---

## 1. Project Overview

This repository accomplishes two missions:
1. **`er.driving`**: A faithful, high-performance clean-room 3D recreation of the mobile game *Dr. Driving*, rebuilt with:
   - **Different Aesthetic**: Midnight Cyberpunk / Neo-Tokyo street aesthetic with illuminated neon skyscraper silhouettes, asphalt shaders, and customizable chassis paint.
   - **Different Typography**: Geometric high-tech fonts (`Orbitron` and `Rajdhani`).
   - **Custom App Icon**: Modern SVG sports car emblem.
   - **Signature Mechanics**:
     - **360° Rotatable Analog Steering Wheel**: Continuous drag-to-steer with mouse/touch, return-to-center spring dynamics, and keyboard binding (`A`/`D` or Arrow Keys).
     - **Vertical Transmission Shifter**: Real Dr. Driving gearbox (`P` - Park, `R` - Reverse, `N` - Neutral, `D` - Drive).
     - **Pedals**: Metallic Gas (accelerator) and Brake pedals with tactile press states.
     - **Dashboard Gauges**: Real-time analog dial + digital speedometer (km/h), RPM bar, turn signal blinkers, and functional horn.
     - **Dr. Driving Missions**:
       * *VIP Precision Parking*: Pull into parking bay, stop completely, and shift to **P**.
       * *Highway Speed Cruise*: Maintain > 60 km/h for 15 seconds without collision.
       * *Executive Comfort VIP*: Passenger comfort meter tracking lateral G-forces and jerk.
       * *Traffic Rush Weave*: Overtake traffic cars cleanly.
     - **Zero-Dependency Web Audio System**: 100% procedural sound synthesis (RPM-modulated engine combustion, tire screeches, gear shifts, crash crunch, turn signal clicks, horn).
   - **Attribution**: Officially credited to **Abhijeet kangane**.

2. **`resynth`**: The Multi-LLM Reverse-Engineering Engine:
   - Ingestion toolchain for Android APKs (`apk_inspector.py`) and Web URLs (`web_inspector.py`).
   - Unified Multi-Provider Gateway supporting **Gemini 2.5 Pro** (massive context), **Groq Llama 3.3 70B** (sub-second tool calling), and **OpenAI GPT-4o** (code synthesis).

---

## 2. Quick Start: Play `er.driving`

### Prerequisites
- Node.js v18+ (Installed)

### Launch the Game
```powershell
npm run dev
```
Open your browser at `http://localhost:3000`.

### Controls
| Control | Mouse / Touch | Keyboard Shortcut |
| :--- | :--- | :--- |
| **Steering** | Drag circular steering wheel | `A` / `D` or `Left` / `Right` Arrow |
| **Gas (Accelerate)** | Press & hold GAS pedal | `W` or `Up` Arrow |
| **Brake (Decelerate)** | Press & hold BRAKE pedal | `S` or `Down` Arrow |
| **Gear Shift** | Click / Tap P, R, N, D | `P`, `R`, `N`, `D` keys |
| **Horn** | Press HORN center cap | `H` key |
| **Camera View** | Click `CAM` button | `C` key (Chase / Cockpit / Hood) |
| **Audio Toggle** | Click `AUDIO` button | `M` key |

---

## 3. Reverse Engineering Toolchain (`resynth`)

To inspect an APK or website and synthesize custom code:

```powershell
# 1. Inspect an Android APK (identifies engine: Unity Mono, IL2CPP, Godot, Flutter)
python -m resynth.cli inspect path/to/dr_driving.apk

# 2. Inspect a live website (extracts DOM, colors, fonts, API endpoints)
python -m resynth.cli inspect https://example.com

# 3. Synthesize code modifications using the Multi-LLM Gateway
python -m resynth.cli synthesize --prompt "Change car to Cyberpunk hovercar with neon glow" --tier synthesis
```

---

## 4. Credits & Authorship

- **Architecture & Re-Engineering**: **Abhijeet kangane**
- **Inspiration**: `morluto/rea` & `storytold/craft-anything`

