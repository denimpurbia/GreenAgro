# 🌱 GreenAgro — Smarter Farming. Healthier Tomorrow.

> **AI-Powered Regenerative Agricultural Intelligence Platform**  
> **Track 4: AgriN & Regenerative Agricultural Intelligence | BRICS Theme: Cooperation**  
> **Build with AI: Code for Communities — Second Edition**

---

## 🌾 Executive Summary

**GreenAgro** is an India-first AI-powered agricultural intelligence platform designed to help farmers understand their farm conditions, make better decisions, and adopt regenerative agricultural practices.

The platform combines **satellite intelligence, soil information, weather context, crop-image analysis, Gemini AI, regenerative agriculture guidance, and BRICS agricultural knowledge** in one farmer-oriented experience.

### Core Intelligence Loop

```text
SATELLITE + SOIL + WEATHER + CROP IMAGE
                  ↓
             FARM CONTEXT
                  ↓
          AI + DECISION ENGINE
                  ↓
        LOCALIZED FARM ADVISORY
                  ↓
         REGENERATIVE ACTION
                  ↓
           LEARN & IMPROVE
                  ↓
          SHARE KNOWLEDGE
```

**Observe → Understand → Predict → Advise → Regenerate → Learn → Share**

---

## 🎯 Problem Statement

Smallholder and marginal farmers face interconnected challenges:

- Unpredictable weather and climate variability
- Soil degradation and declining soil health
- Crop disease and pest risks
- Fragmented agricultural information
- Lack of localized decision support
- Difficulty interpreting satellite and environmental data
- Limited access to advanced agricultural technology
- Agricultural knowledge spread across disconnected sources

Existing tools often solve only one part of the problem. GreenAgro connects these signals into one contextual intelligence layer.

---

## 💡 Our Solution

GreenAgro provides a unified agricultural intelligence workspace where farmers can understand their farm conditions and receive contextual, farmer-friendly recommendations.

### Main Capabilities

| Module | Purpose |
|---|---|
| 🏠 Farmer Dashboard | Centralized farm overview |
| 🌾 My Farm | Farm profile and field information |
| 🛰️ Satellite Intelligence | Vegetation and NDVI insights |
| 🌱 Soil Health | Soil nutrient and health analysis |
| 🌦️ Weather | Local weather and agricultural alerts |
| 🩺 Disease Doctor | AI-assisted crop disease analysis |
| ♻️ Regenerative Agriculture | Sustainable farming recommendations |
| 🤖 AI Saarthi | Conversational agricultural assistant |
| 🌍 BRICS Knowledge Exchange | Documented agricultural practices |
| ⚙️ Settings | Profile, language and preferences |

### Solution Flow

```text
              ┌──────────────────┐
              │   Satellite Data │
              └────────┬─────────┘
                       │
┌──────────────┐       │       ┌───────────────┐
│ Soil Health  │───────┼───────│ Weather Data  │
└──────────────┘       │       └───────────────┘
                       │
                ┌──────▼──────┐
                │ Farm Context│
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │  Gemini AI  │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │  Advisory   │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │ Regenerative│
                │   Actions   │
                └─────────────┘
```

---

## 🧠 Hybrid AI Architecture

GreenAgro separates deterministic computation from generative reasoning.

### Deterministic Layer

Responsible for:

- Data validation
- Unit normalization
- Score calculation
- Threshold evaluation
- Structured farm context
- Data provenance
- API response validation

### Gemini AI Layer

Responsible for:

- Multimodal reasoning
- Crop-image interpretation
- Agricultural explanation
- Contextual advisory
- Natural-language responses
- Multilingual assistance
- Regenerative practice recommendations

### Architecture

```text
                    FARMER INPUT
                         │
                         ▼
              ┌─────────────────────┐
              │   Farm Information  │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Satellite         Soil          Weather
        Data            Data            Data
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                Crop Image / Text
                         │
                         ▼
              ┌─────────────────────┐
              │    Farm Context     │
              │   Normalization     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Deterministic Logic │
              │ Validation / Scores  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     Gemini AI       │
              │ Multimodal Reasoning│
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Localized Advisory  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Regenerative Action │
              └─────────────────────┘
```

---

## 🛰️ Satellite Intelligence

GreenAgro integrates satellite-based agricultural intelligence through an **Earth Engine provider abstraction** and Sentinel-2/NDVI workflows.

### Satellite Workflow

```text
Farm Boundary
     ↓
Earth Engine
     ↓
Sentinel-2 Imagery
     ↓
Vegetation Index Processing
     ↓
NDVI / Vegetation Insight
     ↓
Farm Context
     ↓
AI Interpretation
```

The application is designed to show a clearly labeled **not-configured** state when Earth Engine credentials are unavailable rather than inventing satellite measurements.

### Provider Architecture

```text
SatelliteService
      │
      ▼
SatelliteProvider
      │
      └── EarthEngineProvider
              │
              └── Sentinel-2 / NDVI
```

---

## 🌦️ Weather Intelligence

GreenAgro uses **Open-Meteo** for weather context.

### Weather Information

- 🌡️ Temperature
- 🌧️ Rain information
- 📅 Forecast information
- ⚠️ Agricultural weather alerts
- 🌱 Weather context for farm decisions

### Weather Flow

```text
Farm Location
      ↓
Open-Meteo
      ↓
Forecast Data
      ↓
Weather Service
      ↓
Farm Context
      ↓
Agricultural Advisory
```

Weather values are treated as external data and are not fabricated by Gemini.

---

## 🌱 Soil Health Intelligence

The Soil Health module supports structured agricultural indicators including:

- Nitrogen
- Phosphorus
- Potassium
- pH
- Organic Carbon

```text
Soil Inputs
    ↓
Validation
    ↓
Normalization
    ↓
Soil Health Analysis
    ↓
Farm Context
    ↓
Gemini Explanation
    ↓
Actionable Recommendation
```

---

## 🩺 Disease Doctor

Disease Doctor provides an AI-assisted crop/leaf image analysis workflow.

```text
Crop / Leaf Image
        ↓
Image Validation
        ↓
Multimodal AI
        ↓
Visual Analysis
        ↓
Possible Disease / Stress
        ↓
Explanation
        ↓
Recommended Next Steps
```

The feature is intended as **decision support**, not a replacement for agricultural experts or laboratory diagnosis.

---

## 🤖 AI Saarthi

**AI Saarthi** is the conversational agricultural assistant inside GreenAgro.

It is designed to use available farm context rather than behaving like an isolated generic chatbot.

### AI Saarthi Can Work With

- Farm information
- Weather context
- Soil information
- Satellite-derived signals
- Crop information
- Disease analysis
- Regenerative practices
- BRICS agricultural knowledge

### Example

```text
Farmer
  ↓
"My wheat leaves are turning yellow. What should I check?"
  ↓
AI Saarthi
  ↓
Uses available farm context
  ↓
Explains possible causes
  ↓
Suggests checks and actions
```

---

## ♻️ Regenerative Agriculture

GreenAgro promotes long-term soil, water and ecosystem health in addition to short-term crop decisions.

### Core Principles

- Minimum soil disturbance
- Maintaining soil cover
- Crop diversification
- Water conservation
- Better nutrient management
- Responsible irrigation
- Soil organic matter improvement
- Sustainable livestock/rangeland management

### Regenerative Loop

```text
Observe
   ↓
Understand
   ↓
Identify Farm Risk
   ↓
Recommend Regenerative Practice
   ↓
Farmer Action
   ↓
Observe Again
```

---

## 🌍 BRICS Knowledge Exchange

The BRICS Knowledge Exchange connects documented agricultural practices from participating countries with a farmer-friendly adaptation layer.

| Country | Practice | Focus |
|---|---|---|
| 🇮🇳 India | Khadin Runoff Farming | Water harvesting and runoff farming |
| 🇧🇷 Brazil | No-Tillage with Cover Crops | Soil conservation and soil quality |
| 🇷🇺 Russia | No-Till Winter Wheat | Conservation tillage and soil moisture |
| 🇨🇳 China | Hani Rice Terraces | Water management and biodiversity |
| 🇿🇦 South Africa | Rotational Grazing | Rangeland and pasture management |

Each record can contain:

- Country and region
- Agricultural practice
- Crop/farming context
- Overview
- How it works
- Verified evidence
- Why it matters
- BRICS relevance
- Adaptation notes
- Source provenance
- Source links
- Image attribution where applicable

### Knowledge Flow

```text
Verified Agricultural Sources
            ↓
      Knowledge Records
            ↓
       MongoDB Atlas
            ↓
   Knowledge Exchange UI
            ↓
   Farmer / Expert Learning
            ↓
      Local Adaptation
```

---

## 📚 BRICS Practices

### 🇮🇳 India — Khadin Runoff Farming

A traditional runoff-farming approach associated with arid regions of Rajasthan. It focuses on capturing and managing runoff water for agriculture under water-limited conditions.

```text
Rainfall
   ↓
Runoff Collection
   ↓
Water Retention
   ↓
Soil Moisture
   ↓
Crop Production
```

### 🇧🇷 Brazil — No-Tillage with Cover Crops

A conservation-agriculture approach combining reduced soil disturbance with crop rotation and cover crops. The knowledge record focuses on soil protection, organic matter management and soil biological conditions.

### 🇷🇺 Russia — No-Till Winter Wheat

The knowledge record focuses on conservation tillage, soil moisture management, winter wheat and resource-efficient agricultural practices in the documented study context.

### 🇨🇳 China — Hani Rice Terraces

The Hani Rice Terraces demonstrate an integrated agricultural landscape connecting forests, villages, terraces, water systems, rice cultivation and biodiversity.

### 🇿🇦 South Africa — Rotational Grazing

Rotational grazing divides grazing areas into managed sections and allows pasture recovery between grazing periods, supporting rangeland and livestock-management goals.

---

## 📱 12 Pixel-Faithful UI Screens

The application uses a green, cream and white agricultural design system with responsive desktop and mobile experiences.

### 1. Landing Page `/`

Hero section, product value proposition, core features and the intelligence loop.

### 2. Login / Sign Up `/login`

Role context, email authentication, Google OAuth and account creation.

### 3. Farmer Dashboard `/app`

Central farm overview with weather, crop health, disease risk, irrigation, soil, vegetation, recommendations and quick actions.

### 4. My Farm `/app/farm`

Farm profile, crop, soil, irrigation, location and interactive field boundary map.

### 5. Satellite View `/app/satellite`

Sentinel-2/Earth Engine integration, NDVI information, vegetation visualization and spatial field context.

### 6. Soil Health `/app/soil`

NPK, pH, Organic Carbon, nutrient information and AI interpretation.

### 7. Weather Forecast `/app/weather`

Temperature, rain, forecast cards and agricultural weather alerts.

### 8. Disease Doctor `/app/disease`

Crop/leaf upload, multimodal analysis, explanation and next-step guidance.

### 9. Regenerative Agriculture `/app/regenerative`

Regenerative practices, soil-health actions, water-management ideas and sustainable farming guidance.

### 10. AI Saarthi `/app/ai`

Conversational agricultural assistance using available farm context.

### 11. Knowledge Exchange `/app/knowledge`

Documented BRICS practices with overview, evidence, relevance, adaptation and provenance.

### 12. Settings `/app/settings`

Full name, phone, location, language, profile photo and notification preferences.

---

## 🏗️ Technical Architecture

```text
                         ┌─────────────────────┐
                         │       FARMER        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ React + TypeScript  │
                         │ Vite + Tailwind     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express Backend   │
                         │    TypeScript API   │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
      │ MongoDB     │       │ Gemini AI   │       │ Open-Meteo  │
      │ Atlas       │       │             │       │ Weather     │
      └─────────────┘       └─────────────┘       └─────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ Earth Engine   │
                           │ Sentinel-2     │
                           └────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- Lucide React
- Recharts

### Backend

- Node.js
- Express.js
- TypeScript
- Mongoose
- JWT Authentication
- Google OAuth

### Database

- MongoDB Atlas
- Mongoose ODM

### AI

- Google Gemini
- Multimodal AI
- Generative AI
- Context-aware agricultural reasoning

### Satellite

- Google Earth Engine
- Sentinel-2
- NDVI

### Weather

- Open-Meteo

### Deployment

- Vercel Frontend
- Vercel Backend
- MongoDB Atlas

---

## 📂 Repository Structure

```text
GreenAgro/
│
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── layouts/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── i18n/
│   │       ├── types/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── routes.tsx
│   │       └── index.css
│   │
│   └── api/
│       └── src/
│           ├── config/
│           ├── controllers/
│           ├── middleware/
│           ├── models/
│           ├── routes/
│           ├── services/
│           │   ├── ai/
│           │   ├── weather/
│           │   ├── satellite/
│           │   ├── soil/
│           │   ├── disease/
│           │   ├── advisory/
│           │   ├── regenerative/
│           │   ├── knowledge/
│           │   └── auth/
│           ├── validators/
│           ├── utils/
│           ├── types/
│           ├── jobs/
│           ├── seed/
│           ├── app.ts
│           └── server.ts
│
├── ml/
│   └── disease/
├── earth-engine/
├── data/
│   └── sample/
├── docs/
├── scripts/
├── tests/
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🔌 API Architecture

```text
Routes
  ↓
Controllers
  ↓
Validators
  ↓
Services
  ↓
Providers / Models
  ↓
External APIs / MongoDB
```

### Major API Areas

```text
/api/auth
/api/farm
/api/weather
/api/satellite
/api/soil
/api/disease
/api/advisory
/api/regenerative
/api/knowledge
```

---

## 🔐 Authentication & Security

### Authentication Options

- Email/password
- Google OAuth
- Phone-ready authentication architecture
- JWT-based application sessions

### Google OAuth Flow

```text
Continue with Google
        ↓
GreenAgro Backend
        ↓
Google Authorization
        ↓
OAuth Callback
        ↓
Verify State
        ↓
Fetch Google Profile
        ↓
Find/Create User
        ↓
Generate GreenAgro JWT
        ↓
Frontend Session
        ↓
Farmer Dashboard
```

Sensitive credentials are stored in environment variables and are not committed to the repository.

---

## 🗄️ MongoDB Atlas

MongoDB Atlas is the primary application database.

Application data can include:

- Users
- Farm information
- Preferences
- Knowledge records
- Agricultural context
- Authentication-related information

Mongoose provides schema validation and model-level data handling.

---

## 📊 Data Provenance

Agricultural intelligence should make its data origin understandable.

External or derived data can carry:

```text
source
provider
retrievedAt
dataset
unit
quality
sourceType
```

### Source Types

```text
live_api
public_dataset
derived
demo
cached
```

This helps distinguish live information, public datasets, derived calculations, cached values and demonstration information.

---

## 🇮🇳 India-First, BRICS-Compatible

GreenAgro is designed around Indian agricultural realities while keeping the architecture extensible for BRICS cooperation.

### India-First Focus

- Localized farm context
- Indian agricultural practices
- Regional weather conditions
- Local language support
- Smallholder-oriented interfaces
- Water and soil conservation
- Farmer-friendly AI interaction

### BRICS Compatibility

```text
India
  │
  ├── Agricultural Practices
  ├── Climate Context
  └── Farmer Needs
  │
  ▼
GreenAgro Knowledge Layer
  │
  ├── Brazil
  ├── Russia
  ├── China
  └── South Africa
```

---

## 🌐 Multilingual & Accessibility

GreenAgro is designed for users with different levels of digital literacy.

The architecture supports:

- Multiple languages
- Farmer-friendly explanations
- Conversational AI
- Simplified agricultural terminology
- Voice-ready interaction architecture
- Mobile-first usage

---

## 📈 Scalability

Provider abstractions allow individual integrations to evolve independently.

```text
Current Weather Provider
        ↓
Weather Service Interface
        ↓
Future Weather Provider
```

```text
Current Satellite Provider
        ↓
Satellite Provider Interface
        ↓
Future Satellite Provider
```

This supports expansion to more states, crops, languages, datasets and BRICS partners.

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/denimpurbia/GreenAgro.git
cd GreenAgro
```

### 2. Install Frontend Dependencies

```bash
cd apps/web
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../api
npm install
```

### 4. Configure Environment Variables

Use `.env.example` as the reference.

Example frontend:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Example backend:

```env
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
SATELLITE_PROVIDER=earth-engine
EARTH_ENGINE_PROJECT=your_earth_engine_project
EARTH_ENGINE_CREDENTIALS_JSON=your_service_account_json
```

Never commit secrets to GitHub.

---

## 🛰️ Earth Engine Configuration

The satellite service uses:

```env
SATELLITE_PROVIDER=earth-engine
EARTH_ENGINE_PROJECT=your_project_id
EARTH_ENGINE_CREDENTIALS_JSON=your_service_account_json
```

The service-account JSON must remain private.

Do not place credentials inside source code, frontend code, README files, screenshots or public configuration.

---

## ☁️ Production Deployment

GreenAgro uses **two separate Vercel projects**: one for the frontend and one for the backend.

```text
                   USER
                    │
                    ▼
        ┌─────────────────────┐
        │ Vercel Frontend     │
        │ green-agro-ruby     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Vercel Backend      │
        │ greenagro-api       │
        └──────┬───────┬──────┘
               │       │
       ┌───────┘       └──────────┐
       ▼                          ▼
 MongoDB Atlas                Gemini AI
       │
       ├──────────────► Open-Meteo
       │
       └──────────────► Earth Engine
```

### Production Environment

Frontend:

```env
VITE_API_BASE_URL=https://greenagro-api.vercel.app/api
```

Backend should use the production frontend URL and the required MongoDB, Gemini and Earth Engine configuration.

---

## 📱 Responsive Experience

### Desktop

- Persistent sidebar
- Top navigation/header
- Large information cards
- Interactive maps
- Data visualization

### Mobile

- Compact header
- Bottom navigation
- Scroll-friendly cards
- Responsive maps
- Touch-friendly controls
- Floating AI assistant
- Collision-safe content spacing

---

## 🧪 Testing Strategy

The project supports testing across multiple layers:

| Layer | Examples |
|---|---|
| Frontend | Component rendering, forms, responsive layouts, error states |
| API | Authentication, farm APIs, advisory, diagnosis, provider errors |
| Soil | Unit conversion, boundaries and deterministic scoring |
| Weather | Provider mapping, missing data and cache handling |
| Satellite | Geometry validation, dataset mapping, timeout/fallback handling |
| AI | Schema validation, malformed output, safety constraints and retries |
| Disease | File type/size, invalid image, timeout and unsupported cases |
| E2E | Create farm → load context → diagnose → generate advisory |
| Security | Unauthorized access, secret exposure and rate limiting |

### Definition of Done

- A new farmer can reach a working farm dashboard.
- At least one farm can be configured with crop and soil data.
- Weather context is visible.
- Satellite-derived information is visible or a clearly labeled fallback is used.
- A crop image can be analyzed using Google AI.
- A contextual advisory can be generated from structured farm context.
- A regenerative plan can be produced.
- The application can be deployed and the critical path can work without developer intervention.

---

## 🗺️ Future Roadmap

### Phase 1 — Current Platform

- AI agricultural assistant
- Weather intelligence
- Soil intelligence
- Satellite intelligence
- Crop disease analysis
- Regenerative recommendations
- BRICS knowledge exchange
- Farmer dashboard

### Phase 2 — Intelligence Expansion

- More crop-specific models
- More regional datasets
- More local languages
- Voice-first farmer interaction
- Advanced farm history
- Improved recommendation personalization

### Phase 3 — India Scale

- More Indian states
- More crop types
- Agricultural community networks
- Government/public datasets
- Expanded farm-level analytics

### Phase 4 — BRICS Cooperation

- More agricultural practices
- Cross-country knowledge exchange
- Local adaptation frameworks
- Multi-country agricultural intelligence

---

## 🏆 Hackathon Alignment

**Build with AI: Code for Communities — Second Edition**

### Track

**Track 4 — AgriN & Regenerative Agricultural Intelligence**

### BRICS Theme

**Cooperation**

| Hackathon Requirement | GreenAgro Implementation |
|---|---|
| AI / GenAI | Gemini-powered agricultural intelligence |
| Real-world problem | Farmer decision support |
| India-scale relevance | India-first agricultural workflows |
| Multimodal AI | Crop/leaf image analysis |
| Contextual intelligence | Weather, satellite and farm context |
| Regenerative agriculture | Regenerative recommendations |
| BRICS cooperation | Agricultural Knowledge Exchange |
| Working prototype | Full web application |
| Cloud / modern infrastructure | Vercel + MongoDB Atlas + Google AI + Earth Engine |

---

## 🔄 End-to-End Product Flow

```text
                    FARMER
                      │
                      ▼
                ┌───────────┐
                │  My Farm  │
                └─────┬─────┘
                      │
       ┌──────────────┼──────────────┐
       │              │              │
       ▼              ▼              ▼
   Satellite        Soil         Weather
       │              │              │
       └──────────────┼──────────────┘
                      │
                      ▼
                Farm Context
                      │
                      ▼
                 Gemini AI
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
       Advisory    Disease     AI Saarthi
                    Analysis
          │
          ▼
   Regenerative Action
          │
          ▼
      Better Farm
       Decisions
```

---

## 🎬 Recommended Demo Flow

1. **Start with the Problem** — Explain fragmented agricultural information.
2. **Open GreenAgro** — Introduce “Smarter Farming. Healthier Tomorrow.”
3. **Show My Farm** — Demonstrate farm profile and field context.
4. **Show Satellite Intelligence** — Demonstrate vegetation/NDVI workflow.
5. **Show Weather** — Demonstrate localized weather information.
6. **Show Soil Health** — Explain structured soil information.
7. **Show Disease Doctor** — Upload a crop/leaf image.
8. **Show AI Saarthi** — Ask a contextual agricultural question.
9. **Show Regenerative Agriculture** — Demonstrate sustainable actions.
10. **Show BRICS Knowledge Exchange** — Open examples from India, Brazil, Russia, China and South Africa.
11. **Close with the Intelligence Loop**.

```text
Observe
   ↓
Understand
   ↓
Predict
   ↓
Advise
   ↓
Regenerate
   ↓
Learn
   ↓
Share
```

---

## 🌍 Why GreenAgro?

> **Agricultural intelligence should not stop at showing data. It should help people understand that data and turn it into meaningful action.**

GreenAgro combines:

**Satellite + Soil + Weather + Crop Vision + AI + Regenerative Agriculture + BRICS Knowledge**

into a single agricultural intelligence experience.

---

## 📊 Current Project Status

The current project includes:

- ✅ Responsive web application
- ✅ Farmer dashboard
- ✅ Farm management interface
- ✅ Weather integration
- ✅ Satellite/Earth Engine integration architecture
- ✅ NDVI workflow
- ✅ Soil health interface
- ✅ AI crop/disease analysis workflow
- ✅ Gemini AI integration
- ✅ AI Saarthi
- ✅ Regenerative agriculture module
- ✅ BRICS Knowledge Exchange
- ✅ MongoDB Atlas integration
- ✅ User profile and preferences
- ✅ Google OAuth
- ✅ JWT authentication
- ✅ Vercel frontend deployment
- ✅ Vercel backend deployment
- ✅ Mobile responsive navigation

External services remain dependent on their corresponding environment configuration and availability.

---

## 🔒 Security Notes

Never commit:

```text
.env
MongoDB credentials
JWT secrets
Gemini API keys
Google OAuth secrets
Earth Engine service-account JSON
Private API credentials
```

If a secret is accidentally exposed, rotate it immediately.

---

## 👥 Team — LakeCity Coders

### Team Members

1. **Denim Purbia**
2. **Trishta Prajapat**
3. **Utkarsh Suthar**
4. **Tanisha Sahu**

The team has participated in multiple hackathons and technology events, including previous hackathon wins and runner-up recognition.

---

## 🌱 GreenAgro Vision

```text
Every Farm
     ↓
Can Understand Its Data
     ↓
Can Access AI Assistance
     ↓
Can Make Better Decisions
     ↓
Can Adopt Sustainable Practices
     ↓
Can Contribute to a Healthier Agricultural Future
```

---

## 📜 License

This project is developed for educational, research and hackathon purposes.

See the `LICENSE` file for the applicable license terms.

---

# 🌾 GreenAgro

## Smarter Farming. Healthier Tomorrow.

**AI × Agriculture × Regenerative Intelligence × BRICS Cooperation**

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
PREDICT
   ↓
ADVISE
   ↓
REGENERATE
   ↓
LEARN
   ↓
SHARE
```

**Built by LakeCity Coders 🇮🇳**
