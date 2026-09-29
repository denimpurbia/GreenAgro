import type { WeatherData } from '../types';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || '/api';

export interface FetchWeatherParams {
  lat: number;
  lon: number;
  locationName?: string;
}

export interface WeatherResult {
  status: 'success' | 'error';
  data?: WeatherData;
  message: string;
}

/**
 * Safely read JSON from API response.
 */
async function safeReadJson(response: Response): Promise<any> {
  const text = await response.text();

  if (!text || !text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(
      '[Weather] Invalid JSON response:',
      text.slice(0, 500)
    );

    return null;
  }
}

/**
 * Fetch REAL weather data from GreenAgro backend.
 *
 * Backend -> Open-Meteo -> Real weather data
 */
export async function fetchWeather(
  params: FetchWeatherParams
): Promise<WeatherResult> {
  const {
    lat,
    lon,
    locationName = 'Your Location',
  } = params;

  // Validate coordinates
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return {
      status: 'error',
      message: 'Invalid farm coordinates.',
    };
  }

  /**
   * IMPORTANT:
   * Backend expects `location`, NOT `locationName`.
   */
  const url =
    `${API_BASE}/weather` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lon)}` +
    `&location=${encodeURIComponent(locationName)}`;

  console.log('[Weather] Fetching REAL weather:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    const data = await safeReadJson(response);

    console.log('[Weather] HTTP:', response.status);
    console.log('[Weather] REAL API Response:', data);

    // API error
    if (!response.ok) {
      return {
        status: 'error',
        message:
          data?.message ||
          data?.error ||
          `Weather service returned HTTP ${response.status}.`,
      };
    }

    // Empty response
    if (!data) {
      return {
        status: 'error',
        message:
          'Weather service returned an empty response.',
      };
    }

    /**
     * Backend currently returns:
     *
     * {
     *   status: "success",
     *   location: "...",
     *   current: {...},
     *   forecast: [...]
     * }
     *
     * So use the complete backend response directly.
     */
    if (
      data.status === 'success' &&
      data.current &&
      data.forecast
    ) {
      return {
        status: 'success',
        data: data as WeatherData,
        message: 'Real weather loaded successfully.',
      };
    }

    // Fallback if backend wraps weather inside data
    if (
      data.status === 'success' &&
      data.data
    ) {
      return {
        status: 'success',
        data: data.data as WeatherData,
        message: 'Real weather loaded successfully.',
      };
    }

    return {
      status: 'error',
      message:
        data.message ||
        data.error ||
        'Weather data is unavailable.',
    };
  } catch (error) {
    console.error(
      '[Weather] Request failed:',
      error
    );

    return {
      status: 'error',
      message:
        'Unable to connect to the real weather service.',
    };
  }
}