/**
 * Dynamic Geolocation and Reverse Geocoding Service for GreenAgro
 * Provides real-time user location detection and formatting ("City, State, Country").
 */

export interface LocationResult {
  city?: string;
  state?: string;
  country?: string;
  formattedLocation: string; // e.g. "Udaipur, Rajasthan, India" or "Moscow, Russia"
  latitude?: number;
  longitude?: number;
  timeZone?: string;
  status: 'idle' | 'detecting' | 'success' | 'denied' | 'unavailable' | 'timeout' | 'error';
  errorMessage?: string;
}

const CACHE_KEY = 'greenagro_geo_location_cache_v1';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes cache

interface CachedLocation {
  result: LocationResult;
  timestamp: number;
}

/**
 * Cleanly format City, State, Country avoiding duplicates or empty values.
 * Examples:
 * - "Udaipur, Rajasthan, India"
 * - "New Delhi, Delhi, India"
 * - "Moscow, Russia" (when state is empty or duplicate of city)
 */
export function formatLocationString(city?: string, state?: string, country?: string): string {
  const parts: string[] = [];

  const cleanCity = city?.trim();
  const cleanState = state?.trim();
  const cleanCountry = country?.trim();

  if (cleanCity) {
    parts.push(cleanCity);
  }

  // Only include state if it's different from city
  if (cleanState && (!cleanCity || cleanState.toLowerCase() !== cleanCity.toLowerCase())) {
    parts.push(cleanState);
  }

  if (cleanCountry) {
    parts.push(cleanCountry);
  }

  return parts.join(', ') || 'Location unavailable';
}

/**
 * Safely parse JSON response from external geocoding providers
 */
async function safeReadJson(response: Response): Promise<any> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Fetch reverse geocoding details from BigDataCloud (Client API - free, CORS enabled, no key required).
 */
async function reverseGeocodeBigDataCloud(lat: number, lon: number): Promise<{
  city?: string;
  state?: string;
  country?: string;
  timeZone?: string;
} | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await safeReadJson(response);
    if (!data) {
      return null;
    }
    const city = data.locality || data.city || '';
    const state = data.principalSubdivision || '';
    const country = data.countryName || '';

    let timeZone: string | undefined;
    if (Array.isArray(data.localityInfo?.informative)) {
      const tzItem = data.localityInfo.informative.find(
        (item: { description?: string; name?: string }) => item.description === 'time zone'
      );
      if (tzItem?.name) {
        timeZone = tzItem.name;
      }
    }

    if (!city && !state && !country) {
      return null;
    }

    return { city, state, country, timeZone };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Fallback reverse geocoding using OpenStreetMap Nominatim.
 */
async function reverseGeocodeNominatim(lat: number, lon: number): Promise<{
  city?: string;
  state?: string;
  country?: string;
} | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await safeReadJson(response);
    if (!data) {
      return null;
    }
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.suburb || address.county || '';
    const state = address.state || address.province || '';
    const country = address.country || '';

    if (!city && !state && !country) {
      return null;
    }

    return { city, state, country };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Get cached location if valid
 */
export function getCachedLocation(): LocationResult | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: CachedLocation = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS && parsed.result?.status === 'success') {
      return parsed.result;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Cache successfully resolved location
 */
function setCachedLocation(result: LocationResult): void {
  try {
    const entry: CachedLocation = {
      result,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

/**
 * Clear cached location
 */
export function clearCachedLocation(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Main function to request user's real geolocation and reverse geocode it.
 * Never returns fake location data.
 */
export async function getLiveLocation(forceRefresh = false): Promise<LocationResult> {
  if (!forceRefresh) {
    const cached = getCachedLocation();
    if (cached) {
      return cached;
    }
  }

  // Check browser Geolocation API support
  if (typeof window === 'undefined' || !navigator || !('geolocation' in navigator)) {
    return {
      formattedLocation: 'Location unavailable',
      status: 'unavailable',
      errorMessage: 'Geolocation is not supported by your browser',
    };
  }

  return new Promise<LocationResult>((resolve) => {
    // Geolocation options: 10s timeout, reasonable accuracy without excessive delay
    const geoOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Attempt Primary reverse geocoder (BigDataCloud)
          let geoData = await reverseGeocodeBigDataCloud(latitude, longitude);

          // If failed, attempt Fallback reverse geocoder (Nominatim)
          if (!geoData) {
            geoData = await reverseGeocodeNominatim(latitude, longitude);
          }

          if (geoData) {
            const formatted = formatLocationString(geoData.city, geoData.state, geoData.country);
            const result: LocationResult = {
              city: geoData.city,
              state: geoData.state,
              country: geoData.country,
              formattedLocation: formatted,
              latitude,
              longitude,
              timeZone: geoData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              status: 'success',
            };
            setCachedLocation(result);
            resolve(result);
            return;
          }

          // Reverse geocoding failed
          resolve({
            formattedLocation: 'Location unavailable',
            latitude,
            longitude,
            status: 'error',
            errorMessage: 'Unable to resolve address for coordinates',
          });
        } catch {
          resolve({
            formattedLocation: 'Location unavailable',
            latitude,
            longitude,
            status: 'error',
            errorMessage: 'Network error while resolving address',
          });
        }
      },
      (error) => {
        let status: LocationResult['status'] = 'error';
        let message = 'Location unavailable';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = 'denied';
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            status = 'unavailable';
            message = 'Position unavailable';
            break;
          case error.TIMEOUT:
            status = 'timeout';
            message = 'Location request timed out';
            break;
          default:
            status = 'error';
            message = error.message || 'Location unavailable';
            break;
        }

        resolve({
          formattedLocation: 'Location unavailable',
          status,
          errorMessage: message,
        });
      },
      geoOptions
    );
  });
}
