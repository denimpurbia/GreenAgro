# AgriN Intelligence Network - System Architecture

```
                     AGRISAARTHI
                          │
             ┌────────────┴────────────┐
             │                         │
          DESKTOP                    MOBILE
             │                         │
      Sidebar + Header        Header + Bottom Nav
             │                         │
             └────────────┬────────────┘
                          │
                   React Frontend
                          │
                     API Services
                          │
                   Node + Express
                          │
               ┌──────────┼───────────┐
               │          │           │
            Farm       Intelligence  Auth
            Service      Services    Service
                          │
            ┌─────────────┼──────────────┐
            │             │              │
          Weather      Satellite       Soil
          Provider     Provider        Engine
            │             │              │
            └─────────────┼──────────────┘
                          │
                     Farm Context
                          │
                    Decision Engine
                          │
                       Gemini
                          │
             ┌────────────┼────────────┐
             │            │            │
          Advisory      Disease    Regenerative
             │            │            │
             └────────────┼────────────┘
                          │
                    MongoDB Atlas
```

## Layer Responsibilities
1. **Presentation Layer (`apps/web`)**:
   - Built with React 18, TypeScript, Tailwind CSS, Lucide icons, and Recharts.
   - Dual interface: Desktop persistent sidebar and mobile bottom navigation with safe areas.
   - Global Floating AI Saarthi button with collision-safe positioning.
2. **Deterministic Processing Layer**:
   - `SoilEngine`: Reproducible mathematical scoring of pH, N, P, K, and organic carbon.
   - `RegenerativeEngine`: 5-pillar composite scoring (0–100).
   - `DecisionEngine`: Assembles standardized `FarmContext`.
3. **AI Cognitive Layer**:
   - `GeminiService`: Interprets structured context to produce localized natural language guidance in Hindi/Hinglish/English.
   - Multi-modal vision diagnosis with uncertainty estimations and disclaimer safeguards.
4. **Provider Abstraction Layer**:
   - Modular interfaces allow zero-cost offline demonstration or switching to live Google Earth Engine, Open-Meteo, and MongoDB Atlas.
