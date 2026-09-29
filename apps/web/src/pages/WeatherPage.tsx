import React, { useMemo } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Navigation,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

type AnyRecord = Record<string, any>;

const toNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const firstValue = (...values: any[]) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'N/A'
    ) {
      return value;
    }
  }

  return null;
};

const formatNumber = (
  value: any,
  decimals = 0,
  fallback = '--'
): string => {
  const number = toNumber(value);

  if (number === null) return fallback;

  return number.toFixed(decimals);
};

const getWeatherIcon = (condition: string) => {
  const value = condition.toLowerCase();

  if (
    value.includes('rain') ||
    value.includes('drizzle') ||
    value.includes('shower')
  ) {
    return CloudRain;
  }

  if (
    value.includes('cloud') ||
    value.includes('overcast')
  ) {
    return Cloud;
  }

  if (
    value.includes('partly') ||
    value.includes('few clouds')
  ) {
    return CloudSun;
  }

  return Sun;
};

const getWindDirection = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    const directions = [
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SW',
      'W',
      'NW',
    ];

    const index = Math.round(value / 45) % 8;

    return `${directions[index]} (${value}°)`;
  }

  if (typeof value === 'object') {
    return (
      value.direction ??
      value.label ??
      value.name ??
      value.cardinal ??
      (value.degrees !== undefined
        ? `${value.degrees}°`
        : '--')
    );
  }

  return '--';
};

const getCondition = (weather: AnyRecord): string => {
  return String(
    firstValue(
      weather.condition,
      weather.description,
      weather.weatherDescription,
      weather.summary,
      weather.current?.condition,
      weather.current?.description,
      weather.current?.weather?.[0]?.description,
      weather.weather?.[0]?.description,
      'Current conditions'
    )
  );
};

export const WeatherPage: React.FC = () => {
  const app = useApp() as AnyRecord;

  const farm = app.farm;

  /*
   * Different versions of the AppContext may expose weather
   * under different property names. We safely check all common
   * names without crashing the page.
   */
  const weather = firstValue(
    app.weather,
    app.weatherData,
    app.currentWeather,
    app.weatherContext,
    app.weatherResponse
  ) as AnyRecord | null;

  const isLoading =
    Boolean(app.isWeatherLoading) ||
    Boolean(app.weatherLoading) ||
    Boolean(app.loadingWeather);

  const refreshWeather =
    app.refreshWeather ??
    app.fetchWeather ??
    app.loadWeather ??
    app.getWeather;

  const locationName =
    firstValue(
      farm?.locationName,
      farm?.location,
      farm?.district,
      'Your Farm'
    ) ?? 'Your Farm';

  const latitude = toNumber(
    firstValue(
      farm?.latitude,
      weather?.latitude,
      weather?.location?.latitude
    )
  );

  const longitude = toNumber(
    firstValue(
      farm?.longitude,
      weather?.longitude,
      weather?.location?.longitude
    )
  );

  const temperature = firstValue(
    weather?.temperature,
    weather?.temperatureC,
    weather?.temp,
    weather?.current?.temperature,
    weather?.current?.temperatureC,
    weather?.current?.temp
  );

  const feelsLike = firstValue(
    weather?.feelsLike,
    weather?.feels_like,
    weather?.apparentTemperature,
    weather?.current?.feelsLike,
    weather?.current?.feels_like
  );

  const humidity = firstValue(
    weather?.humidity,
    weather?.humidityPct,
    weather?.relativeHumidity,
    weather?.current?.humidity,
    weather?.current?.humidityPct
  );

  const windSpeed = firstValue(
    weather?.windSpeed,
    weather?.wind_speed,
    weather?.wind?.speed,
    weather?.current?.windSpeed,
    weather?.current?.wind_speed
  );

  const windDirectionRaw = firstValue(
    weather?.windDirection,
    weather?.wind_direction,
    weather?.wind?.direction,
    weather?.current?.windDirection,
    weather?.current?.wind_direction
  );

  const windDirection = getWindDirection(windDirectionRaw);

  const precipitation = firstValue(
    weather?.precipitation,
    weather?.rainfall,
    weather?.rain,
    weather?.precipitationMm,
    weather?.rainfallMm,
    weather?.current?.precipitation
  );

  const pressure = firstValue(
    weather?.pressure,
    weather?.pressureHpa,
    weather?.current?.pressure
  );

  const visibility = firstValue(
    weather?.visibility,
    weather?.visibilityKm,
    weather?.current?.visibility
  );

  const uvIndex = firstValue(
    weather?.uvIndex,
    weather?.uv_index,
    weather?.current?.uvIndex
  );

  const condition = getCondition(weather || {});

  const WeatherIcon = useMemo(
    () => getWeatherIcon(condition),
    [condition]
  );

  const forecast = useMemo(() => {
    const data =
      weather?.forecast ??
      weather?.daily ??
      weather?.forecastDays ??
      [];

    if (!Array.isArray(data)) return [];

    return data.slice(0, 7);
  }, [weather]);

  const handleRefresh = async () => {
    if (typeof refreshWeather !== 'function') return;

    try {
      if (latitude !== null && longitude !== null) {
        await refreshWeather(latitude, longitude);
      } else {
        await refreshWeather();
      }
    } catch (error) {
      console.error('[Weather] Refresh failed:', error);
    }
  };

  const hasWeatherData =
    weather !== null &&
    weather !== undefined &&
    (
      temperature !== null ||
      humidity !== null ||
      windSpeed !== null ||
      condition !== 'Current conditions'
    );

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CloudSun className="w-7 h-7 text-[#156637]" />

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
              Farm Weather
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#156637]" />

            <span>{locationName}</span>

            {latitude !== null && longitude !== null && (
              <>
                <span>•</span>

                <span>
                  {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                </span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white text-sm font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              isLoading ? 'animate-spin' : ''
            }`}
          />

          {isLoading ? 'Updating...' : 'Refresh Weather'}
        </button>
      </div>

      {/* NO WEATHER DATA */}
      {!hasWeatherData && (
        <div className="bg-white rounded-3xl border border-[#e8ece8] shadow-card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f2f6f2] flex items-center justify-center mb-4">
            <CloudSun className="w-8 h-8 text-[#156637]" />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Weather data unavailable
          </h2>

          <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
            We could not load current weather information for your farm.
            Make sure your farm has valid coordinates and try refreshing.
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#156637] text-white text-sm font-semibold hover:bg-[#104e2a]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {/* CURRENT WEATHER */}
      {hasWeatherData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* MAIN WEATHER */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#f3faf5] to-white rounded-3xl border border-[#dcebdd] shadow-card p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Current Weather
                  </p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#dcebdd] flex items-center justify-center shadow-sm">
                      <WeatherIcon className="w-9 h-9 text-[#156637]" />
                    </div>

                    <div>
                      <div className="flex items-start">
                        <span className="text-5xl sm:text-6xl font-extrabold text-[#0f291e]">
                          {formatNumber(temperature, 1)}
                        </span>

                        <span className="text-2xl font-bold text-gray-500 mt-1">
                          °C
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-gray-700 capitalize mt-1">
                        {condition}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-4 min-w-[150px]">
                  <p className="text-xs text-gray-500">
                    Feels Like
                  </p>

                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {formatNumber(feelsLike, 1)}°C
                  </p>
                </div>
              </div>
            </div>

            {/* FARM LOCATION */}
            <div className="bg-white rounded-3xl border border-[#e8ece8] shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#156637]" />

                <h2 className="font-bold text-gray-900">
                  Farm Location
                </h2>
              </div>

              <p className="text-sm font-semibold text-gray-800">
                {locationName}
              </p>

              {latitude !== null && longitude !== null ? (
                <p className="text-xs text-gray-500 mt-2">
                  {latitude.toFixed(6)}° N,{' '}
                  {longitude.toFixed(6)}° E
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-2">
                  Farm coordinates unavailable
                </p>
              )}

              {farm?.primaryCrop && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Primary Crop
                  </p>

                  <p className="text-sm font-bold text-gray-900 mt-1 capitalize">
                    {farm.primaryCrop}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* WEATHER DETAILS */}
          <div>
            <h2 className="text-lg font-bold text-[#0f291e] mb-3">
              Current Conditions
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* HUMIDITY */}
              <div className="bg-white rounded-2xl border border-[#e8ece8] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>

                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Humidity
                  </span>
                </div>

                <p className="text-2xl font-extrabold text-gray-900 mt-3">
                  {formatNumber(humidity)}%
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Relative humidity
                </p>
              </div>

              {/* WIND */}
              <div className="bg-white rounded-2xl border border-[#e8ece8] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Wind className="w-5 h-5 text-[#156637]" />
                  </div>

                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Wind
                  </span>
                </div>

                <p className="text-2xl font-extrabold text-gray-900 mt-3">
                  {formatNumber(windSpeed, 1)}
                  <span className="text-sm font-semibold text-gray-500 ml-1">
                    km/h
                  </span>
                </p>

                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {windDirection}
                </p>
              </div>

              {/* RAIN */}
              <div className="bg-white rounded-2xl border border-[#e8ece8] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
                    <Umbrella className="w-5 h-5 text-cyan-600" />
                  </div>

                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Rain
                  </span>
                </div>

                <p className="text-2xl font-extrabold text-gray-900 mt-3">
                  {formatNumber(precipitation, 1)}
                  <span className="text-sm font-semibold text-gray-500 ml-1">
                    mm
                  </span>
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Recent precipitation
                </p>
              </div>

              {/* PRESSURE */}
              <div className="bg-white rounded-2xl border border-[#e8ece8] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-purple-600" />
                  </div>

                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Pressure
                  </span>
                </div>

                <p className="text-2xl font-extrabold text-gray-900 mt-3">
                  {formatNumber(pressure)}
                  <span className="text-sm font-semibold text-gray-500 ml-1">
                    hPa
                  </span>
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Atmospheric pressure
                </p>
              </div>
            </div>
          </div>

          {/* EXTRA METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-[#e8ece8] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-orange-500" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Temperature
                </p>

                <p className="font-bold text-gray-900">
                  {formatNumber(temperature, 1)}°C
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8ece8] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-indigo-500" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Visibility
                </p>

                <p className="font-bold text-gray-900">
                  {formatNumber(visibility, 1)} km
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8ece8] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Sun className="w-5 h-5 text-yellow-500" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  UV Index
                </p>

                <p className="font-bold text-gray-900">
                  {formatNumber(uvIndex, 1)}
                </p>
              </div>
            </div>
          </div>

          {/* FARM WEATHER ADVISORY */}
          <div className="bg-[#f4faf5] border border-[#d8eadb] rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#156637]" />
              </div>

              <div>
                <h2 className="font-bold text-[#0f291e]">
                  Farm Weather Note
                </h2>

                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Current weather conditions are being shown for
                  your configured farm location. Use the latest
                  rainfall, temperature, humidity and wind
                  information when planning irrigation and field
                  activities.
                </p>
              </div>
            </div>
          </div>

          {/* FORECAST */}
          {forecast.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0f291e]">
                    Weather Forecast
                  </h2>

                  <p className="text-xs text-gray-500">
                    Forecast returned by the configured weather provider
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {forecast.map(
                  (day: AnyRecord, index: number) => {
                    const dayCondition = String(
                      firstValue(
                        day.condition,
                        day.description,
                        day.weather?.[0]?.description,
                        'Forecast'
                      )
                    );

                    const DayIcon =
                      getWeatherIcon(dayCondition);

                    const dayTemp = firstValue(
                      day.temperature,
                      day.temperatureC,
                      day.temp,
                      day.tempMax,
                      day.maxTemperature,
                      day.high
                    );

                    const dayMin = firstValue(
                      day.tempMin,
                      day.minTemperature,
                      day.low
                    );

                    const dayRain = firstValue(
                      day.rainProbability,
                      day.precipitationProbability,
                      day.precipProbability
                    );

                    const date = firstValue(
                      day.date,
                      day.datetime,
                      day.time
                    );

                    let dayLabel = `Day ${index + 1}`;

                    if (date) {
                      const parsedDate = new Date(date);

                      if (!Number.isNaN(parsedDate.getTime())) {
                        dayLabel = parsedDate.toLocaleDateString(
                          'en-IN',
                          {
                            weekday: 'short',
                          }
                        );
                      }
                    }

                    return (
                      <div
                        key={`${date ?? index}`}
                        className="bg-white rounded-2xl border border-[#e8ece8] p-4 shadow-sm"
                      >
                        <p className="text-xs font-bold text-gray-700">
                          {dayLabel}
                        </p>

                        <DayIcon className="w-7 h-7 text-[#156637] mt-3" />

                        <p className="text-xl font-extrabold text-gray-900 mt-3">
                          {formatNumber(dayTemp, 0)}°
                        </p>

                        {dayMin !== null && (
                          <p className="text-xs text-gray-500 mt-1">
                            Low {formatNumber(dayMin, 0)}°
                          </p>
                        )}

                        <p className="text-[10px] text-gray-500 mt-2 capitalize line-clamp-2">
                          {dayCondition}
                        </p>

                        {dayRain !== null && (
                          <div className="flex items-center gap-1 mt-3 text-[10px] text-blue-600 font-semibold">
                            <Droplets className="w-3 h-3" />

                            {formatNumber(dayRain)}% rain
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherPage;