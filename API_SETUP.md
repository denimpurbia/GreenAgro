# GreenAgro — Ridge-to-Lake Platform API & Provider Setup Guide

This guide documents every external API and provider required for the GreenAgro Ridge-to-Lake Intelligence Platform, how to obtain free tier keys, and how the platform behaves if credentials are not yet configured.

---

## 1. Google Gemini AI

- **Purpose**: Personalized regenerative advisory, crop disease diagnosis from photos, market sell/hold explanations, and ecological summaries in Hindi and English.
- **Environment Variable**: `GEMINI_API_KEY`
- **Cost**: Free tier available on Google AI Studio.
- **Where to obtain**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Model**: `gemini-2.5-flash` or `gemini-2.0-flash`
- **Missing behavior**: The platform uses clean fallback explanations and alerts the farmer that Gemini advisory is in deterministic mode.

---

## 2. Google Earth Engine (Satellite & Terrain)

- **Purpose**: Sentinel-2 NDVI/NDMI vegetation indices, Sentinel-2 MNDWI water spread, NDTI turbidity, NDCI algae proxies, and SRTM DEM elevation/slope analysis.
- **Environment Variables**:
  - `SATELLITE_PROVIDER=earth-engine`
  - `EARTH_ENGINE_PROJECT=your-project-id`
  - `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` (Local)
  - `EARTH_ENGINE_CREDENTIALS_JSON={...}` (Vercel Production)
- **Cost**: Free for research, non-commercial and academic usage.
- **Where to obtain**: [https://earthengine.google.com/signup/](https://earthengine.google.com/signup/)
- **Missing behavior**: If Earth Engine credentials are not present, the system serves precomputed historical Sentinel-2 observations and SRTM terrain analysis without crashing.

---

## 3. data.gov.in / Agmarknet (Daily Mandi Prices)

- **Purpose**: Official daily agricultural mandi prices across Rajasthan mandis (Udaipur, Fatehnagar, Salumber, Rajsamand, Dungarpur, Banswara, Chittorgarh, Bhilwara).
- **Environment Variable**: `DATA_GOV_IN_API_KEY`
- **Cost**: 100% Free public API provided by the Government of India.
- **Where to obtain**:
  1. Register at [https://data.gov.in/](https://data.gov.in/)
  2. Navigate to "My Account" → "API Keys"
  3. Create an API Key for "Current Daily Price of Various Commodities from Agmarknet"
- **Missing behavior**: The platform automatically uses the verified regional Mandi database with official MSP reference rates. Stale data (>3 days old) is prominently flagged.

---

## 4. NASA FIRMS (Fire Information for Resource Management System)

- **Purpose**: Near real-time thermal anomaly detection (forest fires and agricultural burning) across the Southern Aravalli range via VIIRS and MODIS satellites.
- **Environment Variable**: `FIRMS_MAP_KEY`
- **Cost**: 100% Free provided by NASA Earthdata.
- **Where to obtain**:
  1. Request a free map key at: [https://firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
  2. A key is emailed to you instantly.
- **Missing behavior**: The Aravalli Guard section displays regional historical fire trends with a clear indicator that live thermal feeds require a configured key.

---

## 5. Cloudinary (Citizen Report Photo Storage — Optional)

- **Purpose**: Secure cloud storage for community report photo evidence with automatic EXIF metadata stripping for reporter privacy.
- **Environment Variable**: `CLOUDINARY_URL` (Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`)
- **Cost**: Free tier includes 25GB managed storage and transformations.
- **Where to obtain**: [https://cloudinary.com/](https://cloudinary.com/)
- **Missing behavior**: Uploaded photos are stored as safe base64 Data URIs directly in MongoDB without requiring external cloud accounts.

---

## 6. Web Push Notifications (VAPID — Optional)

- **Purpose**: Browser push notifications for extreme weather, high erosion risk, and lake drop alerts.
- **Environment Variables**:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
- **Cost**: Free standard Web Push protocol.
- **Where to obtain**: Generate with `npx web-push generate-vapid-keys`.
- **Missing behavior**: In-app Notification Center works completely offline/in-memory with read/unread statuses.

---

## 7. Resend (Email Notifications — Optional)

- **Purpose**: Weekly landscape ecological digests and farmer advisory emails.
- **Environment Variable**: `RESEND_API_KEY`
- **Cost**: Free tier includes 3,000 emails/month.
- **Where to obtain**: [https://resend.com/](https://resend.com/)

---

## 8. Sentry (Error Monitoring — Optional)

- **Purpose**: Application performance and runtime error tracking.
- **Environment Variable**: `SENTRY_DSN`
- **Cost**: Free developer tier (5,000 events/month).
- **Where to obtain**: [https://sentry.io/](https://sentry.io/)

