# AgriN Intelligence Network & AgriSaarthi

> **AI-Powered Regenerative Agricultural Intelligence Platform**  
> *Track 4: AgriN & Regenerative Agricultural Intelligence | BRICS Theme: Cooperation*  
> *Build with AI: Code for Communities (Second Edition)*

---

## 🌟 Executive Summary & Vision

Smallholder and marginal farmers across India and the Global South (BRICS nations) face compounding climate volatility, depleting soil organic matter, and volatile weather shocks. Existing tools are fragmented: chatbots hallucinate numeric dosages, basic weather apps lack agronomic context, and satellite platforms remain inaccessible to rural users.

**AgriN Intelligence Network (farmer-facing product: AgriSaarthi)** bridges this gap with an end-to-end intelligence loop:
```
SATELLITE DATA (NDVI) + SOIL HEALTH TELEMETRY + MICRO-CLIMATE WEATHER + MULTIMODAL LEAF SCAN
                                       ↓
                           DETERMINISTIC FARM DECISION ENGINE
                                       ↓
                             STRUCTURED FARM CONTEXT
                                       ↓
                          GOOGLE GEMINI MULTILINGUAL ADVISORY
                                       ↓
                           REGENERATIVE ACTION ROADMAP
```

---

## 📸 12 Pixel-Faithful UI Screens

The desktop visual design faithfully matches the agricultural green/cream/white design system specification, while mobile devices (< 768px) automatically adapt to a native app-like experience with fixed bottom navigation and collision-safe floating AI assistant.

1. **Landing Page (`/`)**: Hero section with farmer portrait, "Smarter Farming / Healthier Tomorrow", 6 core feature cards, intelligence loop explanation.
2. **Sign Up / Login (`/login`)**: Role selector (Farmer / Expert / Government), email/phone authentication, Google OAuth & Phone login architecture.
3. **Farmer Dashboard (`/app`)**: 8 live overview cards (Temp, Rain, Crop Health, Disease Risk, Irrigation, Soil, Vegetation, 7-Day), Today's Recommendation action card, quick actions.
4. **My Farm (`/app/farm`)**: Plot profile (2.5 acres, Wheat, Loamy, Drip), coordinates, interactive field boundary polygon map.
5. **Satellite View (`/app/satellite`)**: Copernicus Sentinel-2 NDVI false-color heatmap overlay, 0.78 index, 4-month trend bar chart, vegetation proxy explanation.
6. **Soil Health (`/app/soil`)**: NPK + pH + Organic Carbon inputs, deterministic 74/100 score gauge, nutrient status bars, AI insight box.
7. **Weather Forecast (`/app/weather`)**: Udaipur 5-day forecast cards with temperature and rain probability, AI Farming Alert banner.
8. **Crop Disease Doctor (`/app/disease`)**: Image upload dropzone, Early Blight detection, confidence indicator, symptoms, recommended actions, agronomic disclaimer.
9. **Regenerative Plan (`/app/regenerative`)**: 73/100 score gauge, 5-pillar progress bars (Soil, Water, Diversity, Vegetation, Resilience), 4 actionable recommendations.
10. **AI Saarthi (`/app/assistant`)**: Google Gemini chat assistant in Hindi/Hinglish/English with full FarmContext grounding.
11. **Knowledge Exchange (`/app/knowledge`)**: BRICS cross-border cooperation tabs (All, India, Brazil, Russia, China, South Africa) with likeable practice cards.
12. **Settings & Profile (`/app/settings`)**: Profile info, language toggle (English / हिंदी), alert preferences, account management.

---

## 🏗️ Technical Architecture & Hybrid AI Philosophy

### 1. Deterministic vs. AI Separation
- **Deterministic Systems (Node.js/TypeScript)**: Calculations, unit normalization, threshold comparisons, soil score indexing, regenerative weighting. **AI never invents numbers.**
- **Google AI (Gemini 2.0 / 1.5)**: Multimodal crop vision diagnosis, localized multilingual natural language synthesis, farmer Q&A reasoning grounded in structured `FarmContext`.

### 2. Provider Abstractions (Zero-Cost Ready)
The system runs completely out-of-the-box without paid API keys, while offering instant plug-and-play toggles:
- **Weather**: `DemoWeatherProvider` (offline realistic) ⇄ `OpenMeteoWeatherProvider` (free live API)
- **Satellite**: `DemoSatelliteProvider` (Sentinel-2 NDVI proxy) ⇄ `EarthEngineSatelliteProvider`
- **Crop Disease**: `DemoDiseaseProvider` ⇄ `GeminiMultimodalDiseaseProvider`
- **Database**: In-memory demo store ⇄ MongoDB Atlas

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+ (tested on Node v22)
- npm 9+

### 1. Clone & Install
```bash
git clone https://github.com/your-org/agrin-intelligence-network.git
cd "agrin-intelligence-network"
npm install
```

### 2. Environment Setup
Copy the template configuration:
```bash
cp .env.example .env
```
*(No API keys are required to run the demo. It functions immediately using realistic demo providers!)*

### 3. Run Frontend
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Backend API
In a second terminal:
```bash
npm run dev:api
```
Backend runs at [http://localhost:5000](http://localhost:5000) with health endpoint at `/api/health`.

### 5. Run Database Seed & Engine Tests
```bash
npm run seed
npm run test
```

---

## 🌐 Connecting Live Services (20% Production Transition)

1. **Google Gemini API**: Set `GEMINI_API_KEY=your_key` in `.env`.
2. **Earth Engine**: Set `SATELLITE_PROVIDER=earth-engine` and `EARTH_ENGINE_PROJECT=your_project`.
3. **Live Weather**: Set `WEATHER_PROVIDER=open-meteo` in `.env`.
4. **MongoDB Atlas**: Set `MONGODB_URI=mongodb+srv://...` in `.env` and `USE_IN_MEMORY_DB=false`.

---

## 🏆 Hackathon Compliance & Judging Alignment
- **Problem-Solution Fit (20%)**: Directly solves smallholder climate vulnerability with practical, day-to-day guidance.
- **AI / Technical Execution (25%)**: Google Gemini integrated for reasoning + deterministic agronomic calculation safeguards.
- **Depth & Reach (20%)**: Dual English/Hindi i18n, speech-to-text ready, micro-climates across Indian states.
- **Impact Potential (15%)**: Soil organic carbon accumulation, 22% water conservation via drip scheduling.
- **Deployability (20%)**: Vercel/Cloud Run ready, zero-cost development tier, modular provider architecture.

## 📄 License
Licensed under the Apache License, Version 2.0.
