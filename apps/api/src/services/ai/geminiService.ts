import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';

export interface AdvisoryContext {
  farmName: string;
  crop: string;
  stage?: string;
  soilScore?: number | null;
  ndvi?: number | null;
  weatherToday?: string;
  rainProbability?: string;
  location?: string;
}

export interface DiagnosisResult {
  status: 'success' | 'api_not_configured' | 'error';
  /** The crop species independently identified by the AI from the image. NEVER the user's hint. */
  identifiedCrop?: string;
  /** Status of the crop identification step. */
  cropIdentificationStatus?: 'identified' | 'uncertain' | 'unknown' | 'not_a_crop_leaf';
  diseaseName?: string;
  diagnosis?: string;
  confidence?: string;
  confidenceScore?: number;
  severity?: 'low' | 'medium' | 'high' | 'none';
  symptoms?: string[];
  observedSymptoms?: string[];
  recommendedActions?: string[];
  prevention?: string[];
  disclaimer: string;
  message?: string;
}

export class GeminiService {
  private static currentKey: string = '';
  private static cachedClient: GoogleGenerativeAI | null = null;

  public static getClient(): GoogleGenerativeAI | null {
    const key = config.geminiApiKey.trim();
    if (!key) {
      this.cachedClient = null;
      this.currentKey = '';
      return null;
    }
    if (this.cachedClient && this.currentKey === key) {
      return this.cachedClient;
    }
    this.currentKey = key;
    this.cachedClient = new GoogleGenerativeAI(key);
    return this.cachedClient;
  }

  public static isConfigured(): boolean {
    return !!config.geminiApiKey.trim();
  }

  /**
   * Generate personalized farming advisory using Gemini.
   * Returns a structured "api_not_configured" string response when key is missing.
   */
  public static async generateAdvisory(
    context: AdvisoryContext,
    prompt: string,
    language: 'en' | 'hi' = 'en'
  ): Promise<string> {
    const client = this.getClient();
    if (!client) {
      // API not configured — return honest message, never fake data
      return language === 'hi'
        ? 'माफ़ करें, AI सहायक अभी कॉन्फ़िगर नहीं है। कृपया व्यवस्थापक से संपर्क करें या GEMINI_API_KEY सेट करें।'
        : 'The AI assistant is not configured. Please set the GEMINI_API_KEY environment variable on the server to enable personalized farming guidance.';
    }

    try {
      const model = client.getGenerativeModel({ model: config.geminiModel });

      const soilInfo = context.soilScore != null ? `Soil Health Index: ${context.soilScore}/100` : 'Soil health data not yet entered';
      const ndviInfo = context.ndvi != null ? `Satellite NDVI: ${context.ndvi}` : 'Satellite NDVI not configured';
      const weatherInfo = context.weatherToday ?? 'Weather data unavailable';
      const rainInfo = context.rainProbability ?? 'N/A';
      const locationInfo = context.location ? `Location: ${context.location}` : '';

      const systemPrompt = `You are GreenAgro AI Assistant, an expert AI agricultural assistant specializing in regenerative farming for smallholders. Always identify yourself as "GreenAgro AI Assistant" when introducing yourself, and never refer to yourself as AgriSaarthi, Saarthi, or Agri Sarthi.

Farm Context:
- Farm: ${context.farmName}
- Primary Crop: ${context.crop}${context.stage ? ` (Growth Stage: ${context.stage})` : ''}
- ${soilInfo}
- ${ndviInfo}
- Today's Weather: ${weatherInfo} (Rain probability: ${rainInfo})
${locationInfo ? `- ${locationInfo}` : ''}

CRITICAL LANGUAGE & COMMUNICATION RULES:
1. GreenAgro is designed primarily for Indian farmers. ALWAYS prioritize easy-to-understand Hindi / Hinglish responses by default.
2. If the user asks a question in Hindi, respond in Hindi / Hinglish.
3. If the user asks a question in English, STILL respond in simple Hindi / Hinglish by default, because the primary users are Indian farmers. Do not assume that because the user typed English, they understand or prefer technical English.
4. ONLY respond fully in English when the user EXPLICITLY requests it:
   - "Answer in English"
   - "English mein batao"
   - "Reply in English"
   or an equivalent explicit request.
5. If the user explicitly asks for Hindi, respond in Hindi.
6. Use simple, warm, farmer-friendly language and avoid unnecessary technical jargon.
7. When an agricultural technical term is necessary, explain it briefly and simply in Hindi/Hinglish (e.g. explain NPK as kisan poshak tatva, organic carbon as mitti ki jaivik urvara shakti/gobar ki khaad).
8. Keep all agricultural recommendations practical, low-cost, and actionable for smallholder farmers. Focus on soil health, water conservation, and regenerative practices.
9. Never claim to know unavailable farm, soil, weather, or satellite data. If data is marked as unavailable or not configured, explicitly say you do not have that information.
10. Continue identifying yourself as "GreenAgro AI Assistant". Never use "AgriSaarthi", "Saarthi", or any old project name.
11. Avoid specific toxic chemical dosage recommendations.

FEW-SHOT EXAMPLES FOR LANGUAGE BEHAVIOR:
- User asks in English: "How can I improve nitrogen in my soil?"
  Assistant responds in Hindi/Hinglish: "Aapki mitti mein nitrogen badhane ke liye aap compost ya sadi hui gobar ki khaad ka use kar sakte hain. Saath hi dhaincha ya sanai jaisi hari khaad ugaakar mitti mein dabaane se natural nitrogen tezi se badhta hai..."
- User asks in Hindi: "Mujhe fasal mein paani kab dena chahiye?"
  Assistant responds in simple Hindi/Hinglish: "Fasal mein paani subah jaldi ya shaam ke samay dena sabse behtar hota hai. Agar mitti mein 2-3 inch gehraai tak nami kam ho, tabhi sinchai karein..."
- User explicitly asks for English: "Answer this in English."
  Assistant responds in English: "To improve nitrogen in your soil naturally, you can incorporate well-decomposed compost or farmyard manure..."`;

      const result = await model.generateContent([systemPrompt, prompt]);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      console.error('[GeminiService] generateAdvisory error:', err?.message || err);
      return language === 'hi'
        ? 'AI सेवा अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
        : 'AI service is temporarily unavailable. Please try again shortly.';
    }
  }

  /**
   * Diagnose crop disease from an image using Gemini multimodal vision.
   * Returns structured JSON-parseable response or a proper error state.
   */
  public static async diagnoseCrop(
    imageBase64: string,
    mimeType: string,
    cropName: string,
    language: 'en' | 'hi' = 'en'
  ): Promise<DiagnosisResult> {
    const disclaimer =
      'AI-generated agricultural guidance. For critical crop-treatment decisions, consult a qualified local agricultural extension officer.';

    const client = this.getClient();
    if (!client) {
      return {
        status: 'api_not_configured',
        message:
          'Crop diagnosis is not available. Set GEMINI_API_KEY on the server to enable AI-powered disease detection.',
        disclaimer,
      };
    }

    try {
      const model = client.getGenerativeModel({ model: config.geminiModel });

      // The user may have provided a crop hint, but we must NOT let the model blindly confirm it.
      const cropHint = cropName && cropName.trim().toLowerCase() !== 'unknown'
        ? `The user believes this may be a "${cropName}" leaf, but DO NOT use this as confirmation — verify visually.`
        : 'No crop type has been specified by the user.';

      const prompt = `You are an expert agricultural plant pathologist AI assistant.

CRITICAL RULES — follow these unconditionally:
1. NEVER guess the crop species. Only identify a crop when the image provides CLEAR, UNAMBIGUOUS visual evidence (characteristic leaf shape, texture, venation, or other botanical features). If you are not certain, set "crop" to "Unknown" and "cropConfidence" to 0.
2. NEVER fabricate a disease diagnosis. If the leaf is unclear, unrelated to agriculture, from a random non-agricultural plant, or insufficient for diagnosis, set "diseaseName" to "Unable to reliably diagnose" and "confidenceScore" to 0.
3. When uncertain, say unknown rather than guessing.
4. Separate crop identification confidence ("cropConfidence") from disease diagnosis confidence ("confidenceScore"). A high "confidenceScore" is ONLY allowed when BOTH the crop AND the disease/health status are clearly identifiable from the image.
5. If the crop cannot be identified, "confidenceScore" MUST be 0 and "confidence" MUST be "Low Confidence".

${cropHint}

Analyze the image and respond ONLY with the following EXACT JSON format (no markdown, no backticks, pure JSON):

{
  "crop": "Identified crop species, or 'Unknown' if not clearly identifiable",
  "cropConfidence": 0,
  "diseaseName": "Name of the disease, or 'Healthy' if no disease detected, or 'Unable to reliably diagnose' if uncertain",
  "confidence": "High Confidence | Medium Confidence | Low Confidence",
  "confidenceScore": 0,
  "severity": "low | medium | high | none | unknown",
  "observedSymptoms": ["Only list symptoms that are actually visible in the image"],
  "recommendedActions": ["action 1", "action 2"],
  "prevention": ["prevention tip 1", "prevention tip 2"]
}

If the image is not a clearly identifiable agricultural crop leaf:
- Set "crop" to "Unknown"
- Set "cropConfidence" to 0
- Set "diseaseName" to "Unable to reliably identify the crop or diagnose the leaf from this image."
- Set "confidence" to "Low Confidence"
- Set "confidenceScore" to 0
- Set "severity" to "unknown"
- Set "observedSymptoms" to only what is literally visible (e.g. ["Leaf present but crop species not identifiable"])
- Set "recommendedActions" to ["Please upload a clear, close-up image of the affected agricultural crop leaf for accurate diagnosis."]
- Set "prevention" to []

Language for recommendations: ${language === 'hi' ? 'Hindi / Hinglish' : 'English'}.`;

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/i, '').trim();

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType as any,
            data: cleanBase64,
          },
        },
      ]);

      const responseText = result.response.text().trim();

      // Strip any accidental markdown code fences
      const cleaned = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error('[GeminiService] Failed to parse diagnosis JSON:', cleaned);
        return {
          status: 'error',
          message: 'AI returned an unrecognized response format. Please try again.',
          disclaimer,
        };
      }

      // ─── Stage 1: Crop identification validation ──────────────────────────────
      // Validate the model's crop identification independently of the user's hint.
      // The model's `crop` and `cropConfidence` fields are the ONLY source of truth.
      const rawCrop = String(parsed.crop || '').trim();
      let cropConfidenceRaw = typeof parsed.cropConfidence === 'number' && !isNaN(parsed.cropConfidence)
        ? parsed.cropConfidence
        : Number(parsed.cropConfidence);
      if (isNaN(cropConfidenceRaw) || cropConfidenceRaw < 0) {
        cropConfidenceRaw = 0;
      } else if (cropConfidenceRaw > 100) {
        cropConfidenceRaw = 100;
      }

      // Determine cropIdentificationStatus via strict server-side rules:
      // - not_a_crop_leaf: model explicitly said so, or crop is empty with 0 confidence
      // - unknown:         model returned 'unknown' (case-insensitive) or confidence < 50
      // - uncertain:       confidence >= 50 but < 70  (borderline)
      // - identified:      confidence >= 70 and crop is a non-empty non-unknown string
      const rawCropLower = rawCrop.toLowerCase();
      let identifiedCrop: string;
      let cropIdentificationStatus: DiagnosisResult['cropIdentificationStatus'];

      const isNonPlantOrNonCrop =
        rawCropLower === 'not a crop leaf' ||
        rawCropLower === 'not_a_crop_leaf' ||
        rawCropLower === 'not a plant' ||
        rawCropLower === 'not a leaf' ||
        rawCropLower === 'non-agricultural' ||
        rawCropLower === 'non agricultural' ||
        rawCropLower.includes('not a crop') ||
        rawCropLower.includes('not a plant');

      const isUnknownName =
        rawCropLower === '' ||
        rawCropLower === 'unknown' ||
        rawCropLower.includes('unknown') ||
        rawCropLower.includes('unidentif') ||
        rawCropLower === 'n/a';

      if (isNonPlantOrNonCrop) {
        identifiedCrop = 'Unknown';
        cropIdentificationStatus = 'not_a_crop_leaf';
      } else if (isUnknownName || cropConfidenceRaw < 50) {
        identifiedCrop = 'Unknown';
        cropIdentificationStatus = 'unknown';
      } else if (cropConfidenceRaw < 70) {
        // Borderline confidence: expose the tentative name but mark uncertain
        identifiedCrop = rawCrop;
        cropIdentificationStatus = 'uncertain';
      } else {
        identifiedCrop = rawCrop;
        cropIdentificationStatus = 'identified';
      }

      // ─── Stage 2: Disease diagnosis gate ─────────────────────────────────────
      // Disease diagnosis is ONLY trusted when crop identification succeeded.
      // If the crop is unknown/not_a_crop_leaf/uncertain, override all diagnosis
      // fields with honest abstention values — never inherit the user's cropName.
      const cropIsUnknown =
        cropIdentificationStatus === 'unknown' ||
        cropIdentificationStatus === 'not_a_crop_leaf' ||
        cropIdentificationStatus === 'uncertain';

      let diseaseName: string;
      let diagnosisText: string;
      let confidence: string;
      let confidenceScore: number;
      let severity: DiagnosisResult['severity'];
      let symptomsList: string[];
      let preventionList: string[];
      let recommendedActions: string[];

      if (cropIsUnknown) {
        // Crop could not be reliably identified — gate stops here.
        // Override ALL diagnosis fields with honest uncertainty values.
        const subjectLabel =
          cropIdentificationStatus === 'not_a_crop_leaf'
            ? 'Image not suitable for crop diagnosis'
            : 'Crop identification pending — insufficient visual evidence';
        diseaseName = subjectLabel;
        diagnosisText = `Unable to diagnose: ${subjectLabel}. Please upload a clear, close-up image of the affected agricultural crop leaf.`;
        confidence = 'Low Confidence';
        confidenceScore = 0;
        severity = 'none';
        symptomsList = Array.isArray(parsed.observedSymptoms) && parsed.observedSymptoms.length > 0
          ? parsed.observedSymptoms.slice(0, 3) // keep only literally observed items
          : ['The submitted image did not contain a clearly identifiable agricultural crop leaf.'];
        recommendedActions = [
          'Upload a clear, close-up photograph of the actual crop leaf showing the full leaf surface.',
          'Ensure good lighting and focus so that leaf shape, venation, and surface texture are visible.',
        ];
        preventionList = [];
      } else {
        // ─── Stage 3: Crop identified — proceed with disease diagnosis ────────
        diseaseName = String(parsed.diseaseName || 'Unknown');
        diagnosisText = diseaseName.toLowerCase().includes('healthy')
          ? `AI analysis suggests the ${identifiedCrop} appears healthy.`
          : `AI analysis suggests ${diseaseName} on ${identifiedCrop}.`;
        confidence = String(parsed.confidence || 'Low Confidence');
        confidenceScore = Number(parsed.confidenceScore ?? 0);
        severity = (['low', 'medium', 'high', 'none'].includes(parsed.severity)
          ? parsed.severity
          : 'low') as DiagnosisResult['severity'];
        symptomsList = Array.isArray(parsed.observedSymptoms) ? parsed.observedSymptoms : [];
        recommendedActions = Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [];
        preventionList = Array.isArray(parsed.prevention) ? parsed.prevention : [];
      }

      // Log for audit/debugging (never log image data)
      console.info(
        `[CropDoctor] crop=${identifiedCrop} status=${cropIdentificationStatus} ` +
        `cropConf=${cropConfidenceRaw} diagConf=${confidenceScore} disease=${diseaseName}`
      );

      return {
        status: 'success',
        identifiedCrop,
        cropIdentificationStatus,
        diseaseName,
        diagnosis: diagnosisText,
        confidence,
        confidenceScore,
        severity,
        observedSymptoms: symptomsList,
        symptoms: symptomsList,
        recommendedActions,
        prevention: preventionList,
        disclaimer,
      };
    } catch (err: any) {
      console.error('[GeminiService] diagnoseCrop error:', err?.message || err);
      return {
        status: 'error',
        message: 'Crop diagnosis temporarily unavailable. Please try again shortly.',
        disclaimer,
      };
    }
  }
}
