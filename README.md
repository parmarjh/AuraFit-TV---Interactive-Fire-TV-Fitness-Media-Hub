# 🏋️‍♂️ AuraFit TV - Interactive Fire TV Fitness & Media Hub

[![React 19](https://img.shields.io/badge/React-19.0.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![AWS Architecture](https://img.shields.io/badge/AWS-IoT%20%7C%20AppSync%20%7C%20DynamoDB-orange.svg)](https://aws.amazon.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-3.5%20Flash%20Grounding-4285F4.svg)](https://ai.google.dev/)

> **AuraFit TV** is a next-generation interactive fitness and living room media hub designed specifically for the **Amazon Fire TV 10-foot living room experience**. It transforms any standard TV into an intelligent workout studio and connected smart home control center.

---

## 📺 Overview

AuraFit TV bridges the gap between streaming fitness content, wearable biometrics, and living room smart home devices. While users follow on-screen workouts, AuraFit TV continuously syncs with wearable sensors to overlay a live **Heads-Up Display (HUD)**, simultaneously adjusting the room's environment (fans, AC, and lighting) in real-time based on biometric intensity.

```
                     ┌──────────────────────────────────┐
                     │     Amazon Fire TV (10-Foot)     │
                     │  - 4K Video Streaming Player     │
                     │  - Live Biometric Overlay HUD    │
                     │  - Smart Home Control Dashboard  │
                     └────────────────┬─────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│   Wearables & BLE     │ │   Smart Home (IoT)    │ │   Gemini 3.5 Flash    │
│ - Apple Watch / HRM   │ │ - High-Velocity Fan   │ │ - Real-Time Search    │
│ - Live BPM & Calories │ │ - Smart Thermostat    │ │   Grounding           │
│ - Heart Rate Zones    │ │ - Ambient RGB Lights  │ │ - Sports Science AI   │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

## ✨ Key Features

### 1. 🎛️ 10-Foot TV Lean-Back UI & Remote Control
- **True TV Interface**: Tailored for viewing from 10 feet away with high contrast, large typography, and D-Pad focus indicators.
- **Interactive On-Screen Remote**: Includes a simulated Amazon Fire TV voice remote with functional D-Pad navigation, Back, Home, Menu, Play/Pause, and Alexa voice command triggers.
- **Physical Keyboard Hotkeys**: Navigate seamlessly via Arrow keys, `Enter` (Select), `Escape` (Back), and `Space` (Play/Pause).
- **Spatial Audio Feedback**: Realistic tactile audio clicks when navigating items and selecting media.

### 2. 💓 Real-Time Biometric HUD & Workout Player
- **Dynamic Telemetry HUD**: Overlays real-time Heart Rate (BPM), active zone tracking (Warm Up, Fat Burn, Aerobic, Anaerobic, Peak), and continuous calorie burn calculations.
- **15-Minute Historical Biometric Graph**: Visualizes live trendlines using smooth D3 curve rendering.
- **Interval Rep Cadence & Timers**: Synchronized timers for high-intensity intervals, sets, and rest cycles.

### 3. 🏠 Living Room Smart Home & Scene Controller
- **Smart Gym Environment Control**: Directly modulate connected workout equipment from the TV:
  - **High-Velocity Fan**: 3-stage fan control with automatic cooldown triggers.
  - **Smart Thermostat**: Target temperature adjustment with eco-saving modes.
  - **Ambient Backlight**: Dynamic RGB lighting moods (`Amber Glow`, `Hyper Violet`, `Nordic Blue`, `Inferno Red`, `Emerald Zen`).
- **One-Touch Smart Scenes**: Instantly toggle between pre-configured room environments:
  - *Cardio Surge*: Maximum fan cooling, energizing indigo lighting, 68°F climate.
  - *Zen Yoga & Recovery*: Gentle warm illumination, whisper fan, 72°F warmth.
  - *HIIT Inferno*: High-velocity cooling, aggressive red ambient glow, 66°F crisp air.

### 4. ⚡ Intelligent Automation Engine
- **Heart-Rate Driven Feedback Loop**: Rule-based automation that reacts to athlete fatigue and exertion.
  - *Auto-Cool Boost*: When heart rate exceeds 145 BPM, fan speed automatically scales to Level 3.
  - *Recovery Mode*: When heart rate drops below 110 BPM post-workout, restores soothing lights and quiet airflow.
- **Live Event Audit Logs**: Real-time inspection log tracking rule evaluation, conditions, and IoT dispatch actions.

### 5. 🤖 Google Gemini 3.5 Flash with Search Grounding
- **Server-Side AI Assistant**: Query sports medicine literature, recovery protocols, and workout routines backed by real-time Google Search citations.
- **Automated Climate Optimization**: Context-aware AI recommendations that calculate the optimal room temperature, airflow, and hydration schedule based on current heart rate, workout type, and room ambient sensors.

### 6. ☁️ AWS Cloud Infrastructure Blueprint
- Comprehensive architecture specification for production Fire TV deployment:
  - **Amazon Cognito**: RFC 8628 Device Authorization Grant for effortless 6-digit TV activation.
  - **AWS AppSync**: Real-time GraphQL WebSocket subscriptions for sub-20ms biometric synchronization.
  - **Amazon DynamoDB**: Single-table design for user metrics, workout catalog, and time-series telemetry.
  - **AWS IoT Core**: Low-latency MQTT messaging for local smart home hardware.
  - **AWS Elemental MediaLive & CloudFront**: Ultra-low latency HLS (LL-HLS) video delivery.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Lucide Icons |
| **Data & Charts** | D3.js (Heart Rate Curve Rendering), Spatial Sound Synthesizer |
| **Backend** | Node.js, Express, TSX, Vite (Middleware Mode) |
| **AI Integration** | Google GenAI SDK (`@google/genai`) with Gemini 3.5 Flash Search Grounding |
| **Cloud Design** | AWS AppSync, AWS IoT Core, DynamoDB, Cognito, MediaLive, CloudFront |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x, v20.x, or v22.x recommended)
- **npm** (bundled with Node.js)
- *(Optional)* **Gemini API Key**: Required for live AI search grounding features. Obtain one from [Google AI Studio](https://aistudio.google.com/).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/parmarjh/AuraFit-TV---Interactive-Fire-TV-Fitness-Media-Hub.git
   cd AuraFit-TV---Interactive-Fire-TV-Fitness-Media-Hub
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables**:
   Create or edit the `.env` file in the root directory:
   ```env
   # GEMINI_API_KEY: (Optional) For AI sports science and climate optimization
   GEMINI_API_KEY="your-gemini-api-key-here"

   # APP_URL: Base URL of the app
   APP_URL="http://localhost:3000"
   ```

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Navigation & Keyboard Controls

AuraFit TV includes both an **interactive visual remote** and **native keyboard shortcuts** to simulate the Fire TV user experience:

| Key | Fire TV Action | Description |
| :---: | :---: | :--- |
| `↑` `↓` `←` `→` | **D-Pad Directional** | Move focus between cards, widgets, and navigation tabs |
| `Enter` | **Select / OK** | Activate focused card, start workout, or toggle settings |
| `Escape` / `Backspace` | **Back Button** | Close player modals, exit dialogues, return to home |
| `Space` | **Play / Pause** | Toggle video and workout timer playback |
| `H` | **Home** | Navigate directly back to the Home Dashboard |
| `M` | **Toggle Remote** | Show or hide the on-screen Amazon Fire TV remote widget |
| `S` | **Sound Toggle** | Enable or mute spatial interface sound effects |

---

## 📁 Project Structure

```
AuraFit-TV---Interactive-Fire-TV-Fitness-Media-Hub/
├── .env                       # Local environment variables
├── .env.example               # Template environment configuration
├── index.html                 # HTML entry point with 10-foot TV meta tags
├── package.json               # Scripts and dependencies
├── server.ts                  # Express server + Vite middleware + Gemini AI endpoints
├── tsconfig.json              # TypeScript compilation configuration
├── vite.config.ts             # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── App.tsx                # Master Fire TV application & telemetry engine
│   ├── main.tsx               # React application entry point
│   ├── index.css              # Global styles, fonts, and dark theme definitions
│   ├── types.ts               # Complete TypeScript data schemas
│   ├── components/
│   │   ├── TopNavigation.tsx  # TV header with tab selectors, audio & modal triggers
│   │   ├── FireTvRemote.tsx   # Interactive on-screen Fire TV voice remote
│   │   ├── aws/               # AWS Cloud Architecture modal & telemetry simulator
│   │   ├── player/            # Interactive workout player with real-time biometric HUD
│   │   ├── proposal/          # Fire TV Track grant proposal and pitch view
│   │   ├── smarthome/         # Smart scene controller & IoT equipment sliders
│   │   ├── tv/                # TV home dashboard, workout cards, schedule & automations
│   │   └── voice/             # Alexa voice command history and status dialogue
│   ├── data/
│   │   ├── automations.ts     # Default heart-rate automation rules & event logs
│   │   ├── awsArchitecture.ts # AWS service blueprints, cost breakdowns & telemetry schemas
│   │   ├── heartRateData.ts   # Biometric sample data & zone calculation algorithms
│   │   ├── scenes.ts          # Smart gym atmosphere presets (lighting, temp, fans)
│   │   ├── schedule.ts        # Weekly planned fitness itinerary
│   │   ├── voiceHistory.ts    # Recent Alexa voice query transcripts & device intents
│   │   └── workouts.ts        # Full interactive workout catalog (HIIT, Yoga, Strength)
│   └── utils/
│       └── soundEffects.ts    # Web Audio API spatial remote sound synthesizers
```

---

## 🌐 API Endpoints

The integrated Node.js server (`server.ts`) exposes the following endpoints:

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `POST` | `/api/gemini/search-grounding` | Queries Gemini 3.5 Flash with Google Search grounding for sports medicine and exercise science insights. |
| `POST` | `/api/gemini/optimize-automation` | Computes scientific room climate (temperature, fan level, cooldown) recommendations based on live BPM and workout type. |
| `GET` | `/*` | In development, handled by Vite middleware; in production, serves static bundle from `dist/`. |

---

## 📜 Available Scripts

- `npm run dev` - Starts the development server with live reload on port 3000.
- `npm run build` - Builds production-optimized assets into the `dist/` directory.
- `npm run preview` - Previews the production build locally.
- `npm run lint` - Runs TypeScript type checking (`tsc --noEmit`).

---

## 📄 License

This project is licensed under the MIT License - feel free to use and adapt it for your own interactive TV and fitness applications.
