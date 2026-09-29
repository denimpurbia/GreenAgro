export interface SatelliteTrendPoint {
  month: string;
  value: number;
}

export interface SatelliteSuccessResult {
  status: 'success';
  ndvi: number;
  vegetationStatus: string;
  trendMonths: SatelliteTrendPoint[];
  explanation: string;
  lastUpdated: string;
  source: string;
  dataset: string;
  provenance: {
    source: string;
    sourceType: 'live';
  };
}

export interface SatelliteUnconfiguredResult {
  status: 'not_configured';
  message: string;
  configurationRequired: string[];
}

export interface SatelliteErrorResult {
  status: 'error';
  message: string;
  code?: string;
}

export type SatelliteResponse =
  | SatelliteSuccessResult
  | SatelliteUnconfiguredResult
  | SatelliteErrorResult;

export interface ISatelliteProvider {
  name: string;
  isConfigured(): boolean;
  fetchNDVI(lat: number, lon: number): Promise<SatelliteResponse>;
}
