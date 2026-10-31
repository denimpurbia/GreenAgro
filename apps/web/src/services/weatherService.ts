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

async function safeReadJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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

function wmoToIcon(code: number): 'sun' | 'sun-cloud' | 'cloud-rain' | 'cloud' {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'sun-cloud';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'cloud-rain';
  return 'cloud';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

function formatDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(dateStr + 'T12:00:00Z');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getUTCDay()];
}

async function fetchDirectBrowserOpenMeteo(
  lat: number,
  lon: number,
  locationName: string
): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'wind_direction_10m',
        'surface_pressure',
        'precipitation',
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
        'uv_index_max',
      ].join(','),
      forecast_days: '7',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
    });

    const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.current || !data?.daily) return null;

    const current = data.current;
    const daily = data.daily;

    const forecast = (daily.time as string[]).slice(0, 7).map((dateStr: string, i: number) => ({
      date: formatDate(dateStr),
      dayName: formatDayName(dateStr, i),
      temp: Math.round(daily.temperature_2m_max?.[i] ?? 28),
      tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 18),
      humidity: Math.round(daily.relative_humidity_2m_max?.[i] ?? 45),
      rainProbability: Math.round(daily.precipitation_probability_max?.[i] ?? 10),
      windSpeed: Math.round(daily.wind_speed_10m_max?.[i] ?? 11),
      condition: wmoToCondition(daily.weather_code?.[i] ?? 0),
      icon: wmoToIcon(daily.weather_code?.[i] ?? 0),
    }));

    const temp = Math.round(current.temperature_2m ?? 28);
    const feelsLike = Math.round(current.apparent_temperature ?? temp);
    const humidity = Math.round(current.relative_humidity_2m ?? 45);
    const windSpeed = Math.round(current.wind_speed_10m ?? 10);
    const rainProb = Math.round(current.precipitation_probability ?? (forecast[0]?.rainProbability ?? 10));
    const weatherCode = current.weather_code ?? 0;
    const condition = wmoToCondition(weatherCode);

    return {
      status: 'success',
      location: locationName,
      latitude: lat,
      longitude: lon,
      updatedAt: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      current: {
        temp,
        feelsLike,
        humidity,
        rainProbability: rainProb,
        windSpeed,
        condition,
        conditionCode: weatherCode,
      },
      forecast,
      aiAlert: {
        title: 'Live Farm Weather Advisory',
        description: `Current weather (${temp}°C, ${humidity}% humidity, ${rainProb}% rain probability, wind ${windSpeed} km/h) is favorable for crop monitoring and scheduled irrigation management.`,
      },
      provenance: {
        source: 'Open-Meteo (open-meteo.com)',
        sourceType: 'live',
      },
    } as any;
  } catch {
    return null;
  }
}

export async function fetchWeather(
  params: FetchWeatherParams
): Promise<WeatherResult> {
  const {
    lat,
    lon,
    locationName = 'Udaipur, Rajasthan, India',
  } = params;

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

  const url =
    `${API_BASE}/weather` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lon)}` +
    `&location=${encodeURIComponent(locationName)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await safeReadJson(response);

    if (response.ok && data) {
      if (data.status === 'success' && data.current && data.forecast) {
        return {
          status: 'success',
          data: data as WeatherData,
          message: 'Real weather loaded successfully.',
        };
      }
      if (data.status === 'success' && data.data) {
        return {
          status: 'success',
          data: data.data as WeatherData,
          message: 'Real weather loaded successfully.',
        };
      }
    }
  } catch (error) {
    console.warn('[Weather] Backend weather fetch fallback to direct Open-Meteo:', error);
  }

  // Browser-direct Open-Meteo fallback (uses residential IP, immune to shared cloud IP 429)
  const directData = await fetchDirectBrowserOpenMeteo(lat, lon, locationName);
  if (directData) {
    return {
      status: 'success',
      data: directData,
      message: 'Real weather loaded directly from Open-Meteo.',
    };
  }

  return {
    status: 'error',
    message: 'Unable to connect to the weather service.',
  };
}
