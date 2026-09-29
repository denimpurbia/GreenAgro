export type UserRole = 'farmer' | 'expert' | 'government';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  location: string;
  language: 'en' | 'hi';
  avatarUrl?: string;
  preferences: {
    weatherAlerts: boolean;
    diseaseAlerts: boolean;
    weeklyReports: boolean;
    marketUpdates: boolean;
  };
}

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  locationName: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  areaAcres: number;
  primaryCrop: string;
  cropVariety?: string;
  sowingDate: string;
  growthStage: string;
  soilType: string;
  irrigationMethod: string;
  boundary?: [number, number][];
}

export interface WeatherDay {
  date: string;
  dayName: string;
  temp: number;
  condition: string;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  icon: 'sun' | 'sun-cloud' | 'cloud-rain' | 'cloud';
}

export interface WeatherData {
  location: string;
  updatedAt: string;
  current: {
    temp: number;
    feelsLike?: number;
    humidity: number;
    rainProbability: number;
    windSpeed: number;
    condition: string;
  };
  forecast: WeatherDay[];
  aiAlert: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  };
  provenance: {
    source: string;
    sourceType: 'live' | 'live_api' | 'demo' | 'cached';
  };
}

export interface SatelliteObservation {
  ndvi: number | null;
  status: 'Healthy' | 'Moderate' | 'Stressed' | 'not_configured' | 'error';
  trendMonths: {
    month: string;
    value: number;
  }[];
  explanation: string;
  lastUpdated: string;
  source: string;
  dataset: string;
  provenance: {
    source: string;
    sourceType: 'live' | 'live_api' | 'demo' | 'cached' | 'not_configured';
  };
  configMessage?: string; // shown in UI when not configured
}

export interface SoilNutrientStatus {
  name: string;
  value: number;
  unit: string;
  status: 'Low' | 'Medium' | 'Good' | 'Optimal';
  color: 'red' | 'amber' | 'green';
}

export interface SoilAnalysisResult {
  score: number;
  rating: 'Poor' | 'Moderate' | 'Good' | 'Excellent';
  nutrients: SoilNutrientStatus[];
  aiInsight: string;
  limitingFactor: string;
  recommendations: string[];
}

export interface DiseaseDiagnosisResult {
  /** AI-verified crop identity from the image — NEVER the user's selected crop hint. */
  identifiedCrop?: string;
  cropIdentificationStatus?: 'identified' | 'uncertain' | 'unknown' | 'not_a_crop_leaf';
  diseaseName: string;
  confidence: 'High Confidence' | 'Moderate Confidence' | 'Low Confidence';
  confidenceScore: number;
  severity: 'low' | 'medium' | 'high' | 'none';
  observedSymptoms: string[];
  recommendedActions: string[];
  disclaimer: string;
  analyzedAt: string;
  imageUrl?: string;
}

export interface RegenerativePillar {
  name: string;
  score: number;
  weight: number;
}

export interface RegenerativeRecommendation {
  id: string;
  title: string;
  category: 'soil' | 'water' | 'crop' | 'resilience';
  description: string;
  expectedBenefit: string;
  timeHorizon: string;
}

export interface RegenerativePlanData {
  overallScore: number;
  ratingLabel: string;
  pillars: RegenerativePillar[];
  keyRecommendations: RegenerativeRecommendation[];
}

export interface KnowledgeProvenance {
  sourceType: string;
  organization: string;
  title: string;
  year?: number;
  url: string;
  retrievedAt: string;
}

export interface KnowledgePractice {
  id: string;
  title: string;
  country: 'India' | 'Brazil' | 'Russia' | 'China' | 'South Africa';
  region: string;
  crop: string;
  climateZone?: string;
  practiceType: string;
  description: string;
  practiceDetails: string;
  evidenceType:
    | 'FAO'
    | 'FAO GIAHS'
    | 'FAO AGRIS'
    | 'Government'
    | 'Peer-Reviewed Research'
    | 'Research Institution';
  sourceOrganization: string;
  sourceTitle: string;
  sourceYear?: number;
  sourceUrl: string;
  imageUrl: string;
  imageSource?: string;
  imageLicense?: string;
  imageAttribution?: string;
  researchEvidence?: string[];
  expectedBenefit?: string;
  adaptationNotes?: string;
  bricsRelevance?: string;
  provenance?: KnowledgeProvenance;
  tags: string[];
  views: number;
  likes: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: 'en' | 'hi';
}
