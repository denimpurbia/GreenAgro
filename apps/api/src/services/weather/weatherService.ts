/**
 * GreenAgro Weather Service
 * Fetches real weather data from Open-Meteo (free, no API key required).
 * API docs: https://open-meteo.com/en/docs
 */

export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  condition: string;
  conditionCode: number; // WMO weather code
}

export interface WeatherForecastDay {
  date: string;       // e.g. "23 Sep"
  dayName: string;    // e.g. "Today" | "Wed"
  temp: number;
  tempMin: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  condition: string;
  icon: 'sun' | 'sun-cloud' | 'cloud-rain' | 'cloud';
}

export interface WeatherResult {
  status: 'success';
  location: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  current: WeatherCurrent;
  forecast: WeatherForecastDay[];
  provenance: {
    source: string;
    sourceType: 'live';
    attribution: string;
  };
}

export interface WeatherError {
  status: 'error' | 'unconfigured';
  message: string;
  code?: string;
}

/** Map WMO weather code → human-readable condition string */
function wmoToCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  if (code >= 45 && code <= 48) return 'Foggy';
  return 'Partly Cloudy';
}

/** Map WMO weather code → icon key used by the frontend */
function wmoToIcon(code: number): 'sun' | 'sun-cloud' | 'cloud-rain' | 'cloud' {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'sun-cloud';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'cloud-rain';
  if (code >= 95) return 'cloud-rain';
  return 'cloud';
}

/** Format a date string like "23 Sep" */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

/** Format a date as short weekday "Mon", "Tue", etc. */
function formatDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(dateStr + 'T12:00:00Z');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[d.getUTCDay()];
}

export class WeatherService {
  /**
   * Fetch real weather data for the given coordinates.
   * Uses Open-Meteo — completely free, no API key required.
   */
  public static async fetchWeather(
    lat: number,
    lon: number,
    locationName = 'Your Location'
  ): Promise<WeatherResult | WeatherError> {
    // Validate coordinates
    if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return {
        status: 'error',
        message: 'Invalid coordinates provided.',
        code: 'INVALID_COORDS',
      };
    }

    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'weather_code',
        'precipitation_probability',
      ].join(','),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'weather_code',
        'relative_humidity_2m_max',
      ].join(','),
      forecast_days: '5',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        return {
          status: 'error',
          message: `Open-Meteo returned status ${response.status}`,
          code: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();

      if (!data.current || !data.daily) {
        return {
          status: 'error',
          message: 'Unexpected response structure from weather provider.',
          code: 'PARSE_ERROR',
        };
      }

      const current = data.current;
      const daily = data.daily;

      // Build forecast array (5 days)
      const forecast: WeatherForecastDay[] = (daily.time as string[]).map(
        (dateStr: string, i: number) => ({
          date: formatDate(dateStr),
          dayName: formatDayName(dateStr, i),
          temp: Math.round(daily.temperature_2m_max[i] ?? 0),
          tempMin: Math.round(daily.temperature_2m_min[i] ?? 0),
          humidity: Math.round(daily.relative_humidity_2m_max[i] ?? 0),
          rainProbability: Math.round(daily.precipitation_probability_max[i] ?? 0),
          windSpeed: Math.round(daily.wind_speed_10m_max[i] ?? 0),
          condition: wmoToCondition(daily.weather_code[i] ?? 0),
          icon: wmoToIcon(daily.weather_code[i] ?? 0),
        })
      );

      const weatherCode = current.weather_code ?? 0;
      const rainProb = Math.round(current.precipitation_probability ?? (forecast[0]?.rainProbability ?? 0));

      const now = new Date();
      const updatedAt = now.toLocaleDateString('en-US', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      });

      return {
        status: 'success',
        location: locationName,
        latitude: lat,
        longitude: lon,
        updatedAt,
        current: {
          temp: Math.round(current.temperature_2m ?? 0),
          feelsLike: Math.round(current.apparent_temperature ?? 0),
          humidity: Math.round(current.relative_humidity_2m ?? 0),
          rainProbability: rainProb,
          windSpeed: Math.round(current.wind_speed_10m ?? 0),
          condition: wmoToCondition(weatherCode),
          conditionCode: weatherCode,
        },
        forecast,
        provenance: {
          source: 'Open-Meteo (open-meteo.com)',
          sourceType: 'live',
          attribution: 'Weather data from Open-Meteo under CC BY 4.0',
        },
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { status: 'error', message: 'Weather request timed out.', code: 'TIMEOUT' };
      }
      return {
        status: 'error',
        message: 'Failed to fetch weather data. Check network connectivity.',
        code: 'NETWORK_ERROR',
      };
    }
  }
}
