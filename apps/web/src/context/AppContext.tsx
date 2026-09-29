import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  User,
  Farm,
  WeatherData,
  SatelliteObservation,
  SoilAnalysisResult,
  DiseaseDiagnosisResult,
  RegenerativePlanData,
  KnowledgePractice,
  ChatMessage,
} from '../types';

import {
  authService,
  RegisterData,
  AuthResult,
} from '../services/authService';

import { fetchWeather } from '../services/weatherService';
import { getCachedLocation } from '../services/geolocationService';

import enTranslations from '../i18n/en.json';
import hiTranslations from '../i18n/hi.json';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const safeJson = async (response: Response): Promise<any> => {
  const text = await response.text();

  if (!text || !text.trim()) {
    console.warn(
      `[API] Empty response body (HTTP ${response.status})`
    );
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(
      `[API] Invalid JSON response (HTTP ${response.status}):`,
      text.slice(0, 500),
      error
    );
    return {};
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Null / Unconfigured initial states — NO fake data
// ─────────────────────────────────────────────────────────────────────────────

const NULL_SATELLITE: SatelliteObservation = {
  ndvi: null,
  status: 'not_configured',
  trendMonths: [],
  explanation: '',
  lastUpdated: '',
  source: '',
  dataset: '',
  provenance: {
    source: '',
    sourceType: 'not_configured',
  },
  configMessage:
    'Satellite NDVI data is not configured. Real satellite provider integration required.',
};

// Real satellite observations are safe to cache briefly. This is NOT mock data:
// the cached value was previously returned by Google Earth Engine. The UI shows
// it instantly on reload while a fresh Earth Engine request runs in the background.
const SATELLITE_CACHE_TTL_MS = 5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Context Interface
// ─────────────────────────────────────────────────────────────────────────────

interface AppContextType {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  t: (keyPath: string) => string;

  isAuthenticated: boolean;
  isAuthLoading: boolean;

  currentUser: User | null;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;

  login: (
    user: User,
    token: string,
    rememberMe?: boolean
  ) => void;

  register: (data: RegisterData) => Promise<AuthResult>;

  phoneLogin: (
    phone: string,
    otp?: string
  ) => Promise<AuthResult>;

  googleLogin: () => {
    isConfigured: boolean;
    message?: string;
  };

  logout: () => void;

  isLoginPromptOpen: boolean;
  setIsLoginPromptOpen: (open: boolean) => void;

  farm: Farm | null;
  setFarm: React.Dispatch<React.SetStateAction<Farm | null>>;

  createFarm: (
    farmData: Partial<Farm>
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;

  updateFarmData: (
    farm: Partial<Farm>
  ) => Promise<void>;

  // Weather
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  setWeather: React.Dispatch<
    React.SetStateAction<WeatherData | null>
  >;
  refreshWeather: () => void;

  // Satellite
  satellite: SatelliteObservation;
  setSatellite: React.Dispatch<
    React.SetStateAction<SatelliteObservation>
  >;

  // Soil
  soil: SoilAnalysisResult | null;
  setSoil: React.Dispatch<
    React.SetStateAction<SoilAnalysisResult | null>
  >;

  soilLoading: boolean;

  calculateSoilScore: (params: {
    ph: number;
    n: number;
    p: number;
    k: number;
    oc: number;
  }) => Promise<void>;

  // Disease
  disease: DiseaseDiagnosisResult | null;
  setDisease: React.Dispatch<
    React.SetStateAction<DiseaseDiagnosisResult | null>
  >;

  // Regenerative
  regenerative: RegenerativePlanData | null;
  regenerativeLoading: boolean;
  fetchRegenerative: () => Promise<void>;

  // Knowledge
  practices: KnowledgePractice[];
  practicesLoading: boolean;
  practicesError: string | null;

  likePractice: (id: string) => Promise<void>;

  refreshPractices: (
    country?: string
  ) => Promise<void>;

  // AI Chat
  chatMessages: ChatMessage[];

  sendChatMessage: (
    text: string
  ) => Promise<void>;

  isAiChatOpen: boolean;

  setIsAiChatOpen: (
    open: boolean
  ) => void;

  isAiLoading: boolean;
}

const AppContext =
  createContext<AppContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // ───────────────────────────────────────────────────────────────────────────
  // Language
  // ───────────────────────────────────────────────────────────────────────────

  const [language, setLanguageState] =
    useState<'en' | 'hi'>(() => {
      const saved =
        localStorage.getItem('agrin_lang');

      return saved === 'hi' ? 'hi' : 'en';
    });

  const setLanguage = (
    lang: 'en' | 'hi'
  ) => {
    setLanguageState(lang);
    localStorage.setItem(
      'agrin_lang',
      lang
    );
  };

  const t = (
    path: string
  ): string => {
    const dict =
      language === 'hi'
        ? hiTranslations
        : enTranslations;

    const parts = path.split('.');

    let current: any = dict;

    for (const part of parts) {
      if (
        current &&
        typeof current === 'object' &&
        part in current
      ) {
        current = current[part];
      } else {
        return path;
      }
    }

    return typeof current === 'string'
      ? current
      : path;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Auth
  // ───────────────────────────────────────────────────────────────────────────

  const [isAuthLoading, setIsAuthLoading] =
    useState<boolean>(true);

  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(
      () => authService.isAuthenticated()
    );

  const [user, setUser] =
    useState<User | null>(
      () => authService.getCurrentUser()
    );

  const [isLoginPromptOpen, setIsLoginPromptOpen] =
    useState<boolean>(false);

  const [isAiChatOpen, setIsAiChatOpen] =
    useState<boolean>(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Farm
  // ───────────────────────────────────────────────────────────────────────────

  const [farm, setFarm] =
    useState<Farm | null>(() => {
      if (!authService.isAuthenticated()) {
        return null;
      }

      const saved =
        localStorage.getItem(
          'agrin_farm_data'
        );

      if (saved) {
        try {
          const parsed =
            JSON.parse(saved);

          if (
            parsed &&
            parsed.name
          ) {
            return parsed;
          }
        } catch {
          // ignore
        }
      }

      return null;
    });

  // ───────────────────────────────────────────────────────────────────────────
  // Weather State
  // ───────────────────────────────────────────────────────────────────────────

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  const [weatherError, setWeatherError] =
    useState<string | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // IMPORTANT FIX:
  // Prevent repeated weather requests for exactly same coordinates.
  // This protects against React re-render/effect request loops.
  // ───────────────────────────────────────────────────────────────────────────

  const weatherRequestKeyRef =
    useRef<string | null>(null);

  const weatherInFlightRef =
    useRef(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Satellite request protection
  // ───────────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch User Farm
  // ───────────────────────────────────────────────────────────────────────────

  const fetchUserFarm =
    async (token: string) => {
      try {
        const response =
          await fetch(
            `${API_BASE}/farms/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
                Accept:
                  'application/json',
              },
            }
          );

        if (response.ok) {
          const data =
            await safeJson(response);

          if (
            data.status === 'success' &&
            data.farm
          ) {
            setFarm(data.farm);

            localStorage.setItem(
              'agrin_farm_data',
              JSON.stringify(data.farm)
            );
          } else {
            setFarm(null);

            localStorage.removeItem(
              'agrin_farm_data'
            );
          }
        }
      } catch (err) {
        console.error(
          '[fetchUserFarm error]:',
          err
        );
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Soil / Regenerative forward declarations
  // ───────────────────────────────────────────────────────────────────────────

  const fetchRegenerativeWithSoil =
    async (
      soilScore: number
    ) => {
      setRegenerativeLoading(true);

      try {
        const response =
          await fetch(
            `${API_BASE}/regenerative`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                soilScore,
                irrigationType:
                  farm?.irrigationMethod ||
                  'Flood',
                hasDrip:
                  farm?.irrigationMethod ===
                  'Drip',
                cropRotationCycles: 1,
                ndvi: satellite.ndvi,
                organicPracticeAdopted:
                  false,
              }),
            }
          );

        if (response.ok) {
          const data =
            await safeJson(response);

          if (
            data.status ===
            'success'
          ) {
            setRegenerative({
              overallScore:
                data.overallScore,
              ratingLabel:
                data.ratingLabel,
              pillars:
                data.pillars,
              keyRecommendations:
                data.keyRecommendations,
            });
          }
        }
      } catch (err) {
        console.error(
          '[fetchRegenerative error]:',
          err
        );

        setRegenerative(null);
      } finally {
        setRegenerativeLoading(false);
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Latest Soil
  // ───────────────────────────────────────────────────────────────────────────

  const fetchLatestSoil =
    async (token: string) => {
      try {
        const response =
          await fetch(
            `${API_BASE}/soil/latest`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
                Accept:
                  'application/json',
              },
            }
          );

        if (response.ok) {
          const data =
            await safeJson(response);

          if (
            data.status === 'success' &&
            data.observation
          ) {
            const obs =
              data.observation;

            setSoil({
              score:
                obs.score,
              rating:
                obs.rating,
              nutrients:
                obs.nutrients,
              aiInsight:
                obs.aiInsight,
              limitingFactor:
                obs.limitingFactor,
              recommendations:
                obs.recommendations,
            });

            await fetchRegenerativeWithSoil(
              obs.score
            );
          }
        }
      } catch (err) {
        console.error(
          '[fetchLatestSoil error]:',
          err
        );
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Chat History
  // ───────────────────────────────────────────────────────────────────────────

  const fetchChatHistory =
    async (token: string) => {
      try {
        const response =
          await fetch(
            `${API_BASE}/assistant/history`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
                Accept:
                  'application/json',
              },
            }
          );

        if (response.ok) {
          const data =
            await safeJson(response);

          if (
            data.status ===
              'success' &&
            Array.isArray(
              data.messages
            ) &&
            data.messages.length >
              0
          ) {
            const loaded: ChatMessage[] =
              data.messages.map(
                (m: any) => ({
                  id:
                    m._id ||
                    m.id,

                  sender:
                    m.role ===
                    'user'
                      ? 'user'
                      : 'assistant',

                  text:
                    m.content,

                  timestamp:
                    new Date(
                      m.createdAt
                    ).toLocaleTimeString(
                      [],
                      {
                        hour:
                          '2-digit',
                        minute:
                          '2-digit',
                      }
                    ),

                  language:
                    m.language,
                })
              );

            setChatMessages(
              loaded
            );
          }
        }
      } catch (err) {
        console.error(
          '[fetchChatHistory error]:',
          err
        );
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Auth Session Check — FAST START
  // The saved local session is trusted for the first paint. Network validation
  // and secondary data loading happen in the background, so reload does not
  // wait 5–10 seconds before showing the dashboard.
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const token = authService.getToken();

      if (!token || authService.isTokenExpired(token)) {
        authService.clearSession();

        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
          setFarm(null);
          setIsAuthLoading(false);
        }

        return;
      }

      // IMPORTANT: use locally saved user immediately.
      // Do not make the first render wait for the API.
      const savedUser = authService.getCurrentUser();

      if (isMounted) {
        if (savedUser?.id) {
          setUser(savedUser);
          setIsAuthenticated(true);
        } else {
          // A valid token without a saved user can still be validated below.
          setIsAuthenticated(true);
        }

        // Release the app immediately.
        setIsAuthLoading(false);
      }

      // Everything below is background work. None of it blocks the UI.
      void (async () => {
        try {
          const freshUser = await authService.fetchCurrentUser();

          if (!isMounted) return;

          if (freshUser?.id) {
            setUser(freshUser);
            setIsAuthenticated(true);
          } else if (!savedUser?.id) {
            // Only clear the session when there was no local user to begin with.
            authService.clearSession();
            setIsAuthenticated(false);
            setUser(null);
            setFarm(null);
            return;
          }
        } catch (error) {
          // Keep the locally saved session when the backend is slow/offline.
          // This prevents a refresh from looking like a broken login.
          console.warn(
            '[Auth] Background validation failed; using saved session:',
            error
          );
        }

        if (!isMounted) return;

        // Load independent dashboard data in parallel.
        await Promise.allSettled([
          fetchUserFarm(token),
          fetchLatestSoil(token),
          fetchChatHistory(token),
        ]);
      })();
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Create Farm
  // ───────────────────────────────────────────────────────────────────────────

  const createFarm =
    async (
      farmData: Partial<Farm>
    ): Promise<{
      success: boolean;
      message?: string;
    }> => {
      const token =
        authService.getToken();

      if (!token) {
        return {
          success: false,
          message:
            'Please sign in to create a farm.',
        };
      }

      try {
        const response =
          await fetch(
            `${API_BASE}/farms`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify(
                farmData
              ),
            }
          );

        const data =
          await safeJson(response);

        if (
          response.ok &&
          data.status ===
            'success' &&
          data.farm
        ) {
          setFarm(data.farm);

          localStorage.setItem(
            'agrin_farm_data',
            JSON.stringify(
              data.farm
            )
          );

          return {
            success: true,
          };
        }

        return {
          success: false,
          message:
            data.message ||
            'Failed to create farm.',
        };
      } catch (err: any) {
        return {
          success: false,
          message:
            err?.message ||
            'Network error while creating farm.',
        };
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Update Farm
  // ───────────────────────────────────────────────────────────────────────────

  const updateFarmData =
    async (
      farmUpdates: Partial<Farm>
    ) => {
      if (!farm) return;

      const updated = {
        ...farm,
        ...farmUpdates,
      };

      setFarm(updated);

      localStorage.setItem(
        'agrin_farm_data',
        JSON.stringify(updated)
      );

      const token =
        authService.getToken();

      if (token) {
        try {
          await fetch(
            `${API_BASE}/farms/me`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify(
                farmUpdates
              ),
            }
          );
        } catch {
          // saved locally
        }
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Login
  // ───────────────────────────────────────────────────────────────────────────

  const login = (
    authenticatedUser: User,
    token: string,
    rememberMe = true
  ) => {
    authService.saveSession(
      authenticatedUser,
      token,
      rememberMe
    );

    setUser(
      authenticatedUser
    );

    setIsAuthenticated(true);

    setIsLoginPromptOpen(false);

    fetchUserFarm(token);
    fetchLatestSoil(token);
    fetchChatHistory(token);

    if (
      sessionStorage.getItem(
        'ga_open_chat_after_login'
      ) === 'true'
    ) {
      sessionStorage.removeItem(
        'ga_open_chat_after_login'
      );

      setIsAiChatOpen(true);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Register
  // ───────────────────────────────────────────────────────────────────────────

  const register =
    async (
      data: RegisterData
    ): Promise<AuthResult> => {
      const result =
        await authService.register(
          data
        );

      if (
        result.success &&
        result.user &&
        result.token
      ) {
        login(
          result.user,
          result.token
        );
      }

      return result;
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Phone Login
  // ───────────────────────────────────────────────────────────────────────────

  const phoneLogin =
    async (
      phone: string,
      otp?: string
    ): Promise<AuthResult> => {
      const result =
        await authService.phoneLogin(
          phone,
          otp
        );

      if (
        result.success &&
        result.user &&
        result.token
      ) {
        login(
          result.user,
          result.token
        );
      }

      return result;
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Google Login
  // ───────────────────────────────────────────────────────────────────────────

  const googleLogin =
    (): {
      isConfigured: boolean;
      message?: string;
    } => {
      const config =
        authService.getGoogleConfig();

      if (
        !config.isConfigured
      ) {
        return {
          isConfigured: false,
          message:
            config.message,
        };
      }

      window.location.href =
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&response_type=code&scope=email%20profile`;

      return {
        isConfigured: true,
      };
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Logout
  // ───────────────────────────────────────────────────────────────────────────

  const logout = () => {
    authService.clearSession();

    localStorage.removeItem(
      'agrin_farm_data'
    );

    setUser(null);
    setIsAuthenticated(false);

    setIsAiChatOpen(false);
    setIsLoginPromptOpen(false);

    setFarm(null);
    setWeather(null);
    setSoil(null);
    setDisease(null);
    setRegenerative(null);

    setChatMessages([]);

    // Reset request guards after logout
    weatherRequestKeyRef.current =
      null;

    weatherInFlightRef.current =
      false;

  };

  // ───────────────────────────────────────────────────────────────────────────
  // WEATHER
  // ───────────────────────────────────────────────────────────────────────────

  const loadWeather =
    useCallback(
      async (
        force = false
      ) => {
        let lat =
          farm?.latitude;

        let lon =
          farm?.longitude;

        let locationName =
          farm?.locationName;

        // If farm has no coordinates,
        // check cached geolocation
        if (
          !lat ||
          !lon ||
          (lat === 0 &&
            lon === 0)
        ) {
          const cached =
            getCachedLocation();

          if (
            cached?.status ===
              'success' &&
            cached.latitude &&
            cached.longitude
          ) {
            lat =
              cached.latitude;

            lon =
              cached.longitude;

            locationName =
              cached.formattedLocation;
          }
        }

        const numericLat =
          Number(lat);

        const numericLon =
          Number(lon);

        const hasValidCoords =
          Number.isFinite(
            numericLat
          ) &&
          Number.isFinite(
            numericLon
          ) &&
          (numericLat !== 0 ||
            numericLon !== 0);

        if (
          !hasValidCoords
        ) {
          setWeather(null);
          setWeatherLoading(false);

          setWeatherError(
            'Add your farm location to view local weather.'
          );

          return;
        }

        // Unique request key for current location
        const requestKey =
          `${numericLat.toFixed(
            6
          )},${numericLon.toFixed(
            6
          )}`;

        // ───────────────────────────────────────────────────────────────────
        // IMPORTANT:
        // If exactly same location already has a request/result,
        // do NOT fire another request automatically.
        // refreshWeather() passes force=true.
        // ───────────────────────────────────────────────────────────────────

        if (
          !force &&
          weatherRequestKeyRef.current ===
            requestKey
        ) {
          return;
        }

        if (
          weatherInFlightRef.current &&
          !force
        ) {
          return;
        }

        weatherRequestKeyRef.current =
          requestKey;

        weatherInFlightRef.current =
          true;

        setWeatherLoading(true);
        setWeatherError(null);

        try {
          const result =
            await fetchWeather({
              lat: numericLat,
              lon: numericLon,
              locationName:
                locationName ||
                'Local Region',
            });

          if (
            result.status ===
              'success' &&
            result.data
          ) {
            setWeather(
              result.data
            );

            setWeatherError(
              null
            );
          } else {
            setWeatherError(
              result.message ||
                'Weather data is unavailable.'
            );

            setWeather(null);
          }
        } catch (error: any) {
          console.error(
            '[Weather request error]:',
            error
          );

          setWeather(null);

          setWeatherError(
            error?.message ||
              'Unable to fetch weather data.'
          );
        } finally {
          weatherInFlightRef.current =
            false;

          setWeatherLoading(
            false
          );
        }
      },
      [
        farm?.latitude,
        farm?.longitude,
        farm?.locationName,
      ]
    );

  // ───────────────────────────────────────────────────────────────────────────
  // Manual weather refresh
  // ───────────────────────────────────────────────────────────────────────────

  const refreshWeather =
    useCallback(() => {
      loadWeather(true);
    }, [loadWeather]);

  // ───────────────────────────────────────────────────────────────────────────
  // Weather Effect
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadWeather(false);
  }, [loadWeather]);

  // ───────────────────────────────────────────────────────────────────────────
  // SATELLITE — REAL GOOGLE EARTH ENGINE / SENTINEL-2
  // ───────────────────────────────────────────────────────────────────────────

  const [satellite, setSatellite] =
    useState<SatelliteObservation>(
      NULL_SATELLITE
    );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchSatellite =
      async () => {
        const lat =
          farm?.latitude;

        const lon =
          farm?.longitude;

        // No farm coordinates
        if (
          lat === undefined ||
          lon === undefined ||
          !Number.isFinite(
            Number(lat)
          ) ||
          !Number.isFinite(
            Number(lon)
          ) ||
          (Number(lat) === 0 &&
            Number(lon) === 0)
        ) {
          if (!cancelled) {
            setSatellite(
              NULL_SATELLITE
            );
          }

          return;
        }

        const numericLat =
          Number(lat);

        const numericLon =
          Number(lon);

        // Show the last REAL Earth Engine observation immediately on reload.
        // A fresh request still runs below, so the value is never fabricated.
        const cacheKey =
          `agrin_satellite_${numericLat.toFixed(6)}_${numericLon.toFixed(6)}`;

try {
  const cachedRaw = localStorage.getItem(cacheKey);

  if (cachedRaw && cachedRaw.trim()) {
    let cached: any = null;

    try {
      cached = JSON.parse(cachedRaw);
    } catch (parseError) {
      console.warn(
        '[Satellite] Invalid local cache found. Removing it and continuing with REAL API request.',
        parseError
      );

      localStorage.removeItem(cacheKey);
      cached = null;
    }

    if (
      cached &&
      cached.savedAt &&
      Date.now() - Number(cached.savedAt) <= SATELLITE_CACHE_TTL_MS &&
      cached.data &&
      cached.data.ndvi !== null &&
      cached.data.ndvi !== undefined
    ) {
      setSatellite(
        cached.data as SatelliteObservation
      );

      console.log(
        '[Satellite] Showing cached REAL NDVI immediately:',
        cached.data.ndvi
      );
    }
  }
} catch (error) {
  console.warn(
    '[Satellite] Local cache handling failed. Continuing with REAL API request.',
    error
  );

  localStorage.removeItem(cacheKey);
}

        // Do not block requests by coordinate here.
        // React StrictMode may mount the effect more than once in development.
        // The AbortController below cancels only the stale request from cleanup.

        try {
          console.log(
            `[Satellite] Fetching REAL NDVI for coordinates: ${numericLat}, ${numericLon}`
          );

          const url =
            `${API_BASE}/satellite` +
            `?lat=${encodeURIComponent(
              numericLat
            )}` +
            `&lon=${encodeURIComponent(
              numericLon
            )}`;

          const response =
            await fetch(
              url,
              {
                method: 'GET',
                signal: controller.signal,
                headers: {
                  Accept:
                    'application/json',
                },
              }
            );

          const contentType =
            response.headers.get(
              'content-type'
            ) || '';

          console.log(
            `[Satellite] HTTP ${response.status}, content-type: ${contentType || 'unknown'}`
          );

          if (response.status === 304) {
            console.warn(
              '[Satellite] Server returned 304 Not Modified; keeping current satellite state.'
            );
            return;
          }

          const data =
            await safeJson(response);

          console.log(
            '[Satellite] REAL API response:',
            data
          );

          if (cancelled) {
            return;
          }

          // Provider not configured
          if (
            data.status ===
            'not_configured'
          ) {
            console.warn(
              '[Satellite] Google Earth Engine is not configured.'
            );

            setSatellite({
              ...NULL_SATELLITE,

              configMessage:
                data.message ||
                NULL_SATELLITE.configMessage,
            });

            return;
          }

          // API failure
          if (
            !response.ok ||
            data.status !==
            'success'
          ) {
            console.error(
              '[Satellite] API failed:',
              data.message ||
                data
            );

            setSatellite({
              ...NULL_SATELLITE,

              configMessage:
                data.message ||
                'Satellite service is unavailable.',
            });

            return;
          }

          // Real NDVI
          const realNdvi =
            data.ndvi !==
              undefined &&
            data.ndvi !== null &&
            Number.isFinite(
              Number(data.ndvi)
            )
              ? Number(data.ndvi)
              : null;

          if (
            realNdvi === null
          ) {
            console.error(
              '[Satellite] API returned success but NDVI is missing:',
              data
            );

            setSatellite({
              ...NULL_SATELLITE,

              configMessage:
                'Google Earth Engine returned no valid NDVI value.',
            });

            return;
          }

          console.log(
            `[Satellite] REAL NDVI received from Google Earth Engine: ${realNdvi}`
          );

          setSatellite({
            ndvi: realNdvi,

            status:
              data.vegetationStatus ||
              'Unknown Vegetation',

            trendMonths:
              Array.isArray(
                data.trendMonths
              )
                ? data.trendMonths
                : [],

            explanation:
              data.explanation ||
              '',

            lastUpdated:
              data.lastUpdated ||
              new Date().toISOString(),

            source:
              data.source ||
              'Google Earth Engine',

            dataset:
              data.dataset ||
              'COPERNICUS/S2_SR_HARMONIZED',

            provenance: {
              source:
                data.provenance
                  ?.source ||
                'Google Earth Engine / Sentinel-2',

              sourceType:
                'live',
            },

            configMessage:
              undefined,
          });

          // Persist the REAL response for instant reloads.
          try {
            const freshSatellite: SatelliteObservation = {
              ndvi: realNdvi,
              status: data.vegetationStatus || 'Unknown Vegetation',
              trendMonths: Array.isArray(data.trendMonths) ? data.trendMonths : [],
              explanation: data.explanation || '',
              lastUpdated: data.lastUpdated || new Date().toISOString(),
              source: data.source || 'Google Earth Engine',
              dataset: data.dataset || 'COPERNICUS/S2_SR_HARMONIZED',
              provenance: {
                source: data.provenance?.source || 'Google Earth Engine / Sentinel-2',
                sourceType: 'live',
              },
              configMessage: undefined,
            };

            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                savedAt: Date.now(),
                data: freshSatellite,
              })
            );
          } catch (cacheError) {
            console.warn('[Satellite] Could not cache live observation:', cacheError);
          }
        } catch (error) {
          if (
            cancelled ||
            (error instanceof DOMException &&
              error.name === 'AbortError')
          ) {
            return;
          }

          console.error(
            '[Satellite] Failed to fetch real satellite data:',
            error
          );

          setSatellite({
            ...NULL_SATELLITE,

            configMessage:
              'Unable to fetch live satellite data from Google Earth Engine.',
          });
        }
      };

    fetchSatellite();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    farm?.latitude,
    farm?.longitude,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // SOIL
  // ───────────────────────────────────────────────────────────────────────────

  const [soil, setSoil] =
    useState<SoilAnalysisResult | null>(
      null
    );

  const [soilLoading, setSoilLoading] =
    useState(false);

  const calculateSoilScore =
    async (params: {
      ph: number;
      n: number;
      p: number;
      k: number;
      oc: number;
    }) => {
      setSoilLoading(true);

      const token =
        authService.getToken();

      try {
        const headers: Record<
          string,
          string
        > = {
          'Content-Type':
            'application/json',
        };

        if (token) {
          headers[
            'Authorization'
          ] = `Bearer ${token}`;
        }

        const response =
          await fetch(
            `${API_BASE}/soil`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                ph: params.ph,
                nitrogen:
                  params.n,
                phosphorus:
                  params.p,
                potassium:
                  params.k,
                organicCarbon:
                  params.oc,
                farmId:
                  farm?.id ||
                  undefined,
              }),
            }
          );

        if (!response.ok) {
          const errData =
            await response
              .json()
              .catch(
                () => ({})
              );

          throw new Error(
            errData.message ||
              'Soil calculation failed on server.'
          );
        }

        const data =
          await safeJson(response);

        if (
          data.status ===
          'success'
        ) {
          const result: SoilAnalysisResult =
            {
              score:
                data.score,
              rating:
                data.rating,
              nutrients:
                data.nutrients,
              aiInsight:
                data.aiInsight,
              limitingFactor:
                data.limitingFactor,
              recommendations:
                data.recommendations,
            };

          setSoil(result);

          await fetchRegenerativeWithSoil(
            data.score
          );
        } else {
          throw new Error(
            data.message ||
              'Soil analysis returned an unexpected status.'
          );
        }
      } catch (err) {
        console.error(
          '[Soil calculation error]:',
          err
        );

        throw err;
      } finally {
        setSoilLoading(
          false
        );
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // REGENERATIVE
  // ───────────────────────────────────────────────────────────────────────────

  const [
    regenerative,
    setRegenerative,
  ] =
    useState<RegenerativePlanData | null>(
      null
    );

  const [
    regenerativeLoading,
    setRegenerativeLoading,
  ] = useState(false);

  const fetchRegenerative =
    useCallback(
      async () => {
        if (!soil) {
          return;
        }

        await fetchRegenerativeWithSoil(
          soil.score
        );
      },
      [
        soil,
        satellite.ndvi,
        farm?.irrigationMethod,
      ]
    );

  // ───────────────────────────────────────────────────────────────────────────
  // DISEASE
  // ───────────────────────────────────────────────────────────────────────────

  const [disease, setDisease] =
    useState<DiseaseDiagnosisResult | null>(
      null
    );

  // ───────────────────────────────────────────────────────────────────────────
  // KNOWLEDGE PRACTICES
  // ───────────────────────────────────────────────────────────────────────────

  const [
    practices,
    setPractices,
  ] =
    useState<KnowledgePractice[]>(
      []
    );

  const [
    practicesLoading,
    setPracticesLoading,
  ] = useState<boolean>(
    true
  );

  const [
    practicesError,
    setPracticesError,
  ] =
    useState<string | null>(
      null
    );

  const refreshPractices =
    useCallback(
      async (
        country?: string
      ) => {
        setPracticesLoading(
          true
        );

        setPracticesError(
          null
        );

        try {
          const url =
            country &&
            country !== 'All'
              ? `${API_BASE}/knowledge?country=${encodeURIComponent(
                  country
                )}`
              : `${API_BASE}/knowledge`;

          const response =
            await fetch(url);

          if (
            response.ok
          ) {
            const data =
              await safeJson(response);

            if (
              data.status ===
                'success' &&
              Array.isArray(
                data.practices
              )
            ) {
              const mapped: KnowledgePractice[] =
                data.practices.map(
                  (p: any) => ({
                    id:
                      p.practiceId ||
                      p._id ||
                      p.id,

                    title:
                      p.title,

                    country:
                      p.country,

                    region:
                      p.region,

                    crop:
                      p.crop,

                    climateZone:
                      p.climateZone,

                    practiceType:
                      p.practiceType || 'Conservation Agriculture',

                    description:
                      p.description,

                    practiceDetails:
                      p.practiceDetails || '',

                    evidenceType:
                      p.evidenceType || 'Peer-Reviewed Research',

                    sourceOrganization:
                      p.sourceOrganization || '',

                    sourceTitle:
                      p.sourceTitle || '',

                    sourceYear:
                      p.sourceYear,

                    sourceUrl:
                      p.sourceUrl || '',

                    expectedBenefit:
                      p.expectedBenefit || '',

                    adaptationNotes:
                      p.adaptationNotes || '',

                    bricsRelevance:
                      p.bricsRelevance || '',

                    researchEvidence:
                      p.researchEvidence || [],

                    provenance:
                      p.provenance,

                    tags:
                      p.tags ||
                      [],

                    imageUrl:
                      p.imageUrl,

                    imageSource:
                      p.imageSource || '',

                    imageLicense:
                      p.imageLicense || '',

                    imageAttribution:
                      p.imageAttribution || '',

                    views:
                      p.views ||
                      0,

                    likes:
                      p.likes ||
                      0,
                  })
                );

              setPractices(
                mapped
              );

              return;
            }
          }

          setPracticesError(
            'Failed to load practices.'
          );
        } catch {
          setPracticesError(
            'Unable to reach knowledge service.'
          );
        } finally {
          setPracticesLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    refreshPractices();
  }, [refreshPractices]);

  const likePractice =
    async (id: string) => {
      const token =
        authService.getToken();

      const headers: Record<
        string,
        string
      > = {};

      if (token) {
        headers[
          'Authorization'
        ] = `Bearer ${token}`;
      }

      try {
        const response =
          await fetch(
            `${API_BASE}/knowledge/${id}/like`,
            {
              method: 'POST',
              headers,
            }
          );

        if (
          response.ok
        ) {
          const data =
            await safeJson(response);

          if (
            data.status ===
            'success'
          ) {
            setPractices(
              (prev) =>
                prev.map(
                  (p) =>
                    p.id === id
                      ? {
                          ...p,
                          likes:
                            data.likes,
                        }
                      : p
                )
            );
          }
        }
      } catch (err) {
        console.error(
          '[likePractice error]:',
          err
        );
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // GREENAGRO AI CHAT
  // ───────────────────────────────────────────────────────────────────────────

  const buildInitialChat =
    (
      lang: 'en' | 'hi',
      name = ''
    ): ChatMessage[] => {
      const greetingName =
        name &&
        name !==
          'Guest User'
          ? `, ${name}`
          : '';

      return [
        {
          id:
            'msg-welcome',

          sender:
            'assistant',

          text:
            lang === 'hi'
              ? `नमस्ते${greetingName}! मैं ग्रीनएग्रो एआई सहायक हूँ, आपका व्यक्तिगत कृषि सहायक। मुझसे फसलों, मिट्टी, मौसम या खेती के तरीकों के बारे में कुछ भी पूछें।`
              : `Namaste${greetingName}! I'm GreenAgro AI Assistant, your AI-powered farming assistant. Ask me anything about crops, soil, weather, or regenerative practices.`,

          timestamp:
            new Date().toLocaleTimeString(
              [],
              {
                hour:
                  '2-digit',
                minute:
                  '2-digit',
              }
            ),
        },
      ];
    };

  const [
    chatMessages,
    setChatMessages,
  ] =
    useState<ChatMessage[]>(
      () => {
        if (
          authService.isAuthenticated()
        ) {
          const u =
            authService.getCurrentUser();

          if (
            u &&
            u.id
          ) {
            return buildInitialChat(
              language,
              u.name
            );
          }
        }

        return [];
      }
    );

  const [isAiLoading, setIsAiLoading] =
    useState<boolean>(
      false
    );

  // ───────────────────────────────────────────────────────────────────────────
  // Synchronize chat with authentication
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      user.id
    ) {
      setChatMessages(
        (prev) => {
          if (
            prev.length >
            0
          ) {
            return prev;
          }

          return buildInitialChat(
            language,
            user.name
          );
        }
      );
    } else {
      setChatMessages(
        (prev) =>
          prev.length ===
          0
            ? prev
            : []
      );
    }
  }, [
    isAuthenticated,
    user?.name,
    user?.id,
    language,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // Send Chat Message
  // ───────────────────────────────────────────────────────────────────────────

  const sendChatMessage =
    async (
      text: string
    ) => {
      if (
        !isAuthenticated ||
        !authService.isAuthenticated() ||
        !user ||
        !user.id
      ) {
        setIsAuthenticated(
          false
        );

        setIsAiChatOpen(
          true
        );

        return;
      }

      const token =
        authService.getToken();

      if (
        !token ||
        authService.isTokenExpired(
          token
        )
      ) {
        logout();

        setIsAiChatOpen(
          true
        );

        return;
      }

      const userMsg: ChatMessage =
        {
          id: `user-${Date.now()}`,

          sender: 'user',

          text,

          timestamp:
            new Date().toLocaleTimeString(
              [],
              {
                hour:
                  '2-digit',
                minute:
                  '2-digit',
              }
            ),
        };

      setChatMessages(
        (prev) => [
          ...prev,
          userMsg,
        ]
      );

      setIsAiLoading(
        true
      );

      try {
        const response =
          await fetch(
            `${API_BASE}/assistant/message`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                message:
                  text,

                language,

                farmContext: {
                  farmId:
                    farm?.id ||
                    '',

                  farmName:
                    farm?.name ||
                    'No farm configured yet',

                  crop:
                    farm?.primaryCrop ||
                    'General Crops',

                  stage:
                    farm?.growthStage ||
                    'Vegetative',

                  location:
                    farm?.locationName ||
                    'Local Region',

                  soilScore:
                    soil?.score ??
                    null,

                  ndvi:
                    satellite.ndvi,

                  weatherToday:
                    weather
                      ? `${weather.current.temp}°C, ${weather.current.condition}`
                      : null,

                  rainProbability:
                    weather
                      ? `${weather.current.rainProbability}%`
                      : null,
                },
              }),
            }
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          logout();

          setIsAiChatOpen(
            true
          );

          return;
        }

        const contentType =
          response.headers.get(
            'content-type'
          ) || '';

        if (
          contentType.includes(
            'application/json'
          )
        ) {
          const data =
            await safeJson(response);

          const reply =
            data.reply ||
            data.message;

          if (reply) {
            setChatMessages(
              (prev) => [
                ...prev,
                {
                  id: `ai-${Date.now()}`,

                  sender:
                    'assistant',

                  text:
                    reply,

                  timestamp:
                    new Date().toLocaleTimeString(
                      [],
                      {
                        hour:
                          '2-digit',
                        minute:
                          '2-digit',
                      }
                    ),
                },
              ]
            );

            return;
          }
        }

        throw new Error(
          `Server returned ${response.status}`
        );
      } catch {
        const errMsg: ChatMessage =
          {
            id: `err-${Date.now()}`,

            sender:
              'assistant',

            text:
              language ===
              'hi'
                ? 'माफ़ करें, AI सेवा अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
                : 'AI advisory is temporarily unavailable. Please verify GEMINI_API_KEY on the server or try again shortly.',

            timestamp:
              new Date().toLocaleTimeString(
                [],
                {
                  hour:
                    '2-digit',
                  minute:
                    '2-digit',
                }
              ),
          };

        setChatMessages(
          (prev) => [
            ...prev,
            errMsg,
          ]
        );
      } finally {
        setIsAiLoading(
          false
        );
      }
    };

  // ───────────────────────────────────────────────────────────────────────────
  // Provider
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,

        isAuthenticated,
        isAuthLoading,

        currentUser:
          user,

        user,
        setUser,

        login,
        register,
        phoneLogin,
        googleLogin,
        logout,

        isLoginPromptOpen,
        setIsLoginPromptOpen,

        farm,
        setFarm,

        createFarm,
        updateFarmData,

        weather,
        weatherLoading,
        weatherError,
        setWeather,
        refreshWeather,

        satellite,
        setSatellite,

        soil,
        setSoil,
        soilLoading,
        calculateSoilScore,

        disease,
        setDisease,

        regenerative,
        regenerativeLoading,
        fetchRegenerative,

        practices,
        practicesLoading,
        practicesError,

        likePractice,
        refreshPractices,

        chatMessages,
        sendChatMessage,

        isAiChatOpen,
        setIsAiChatOpen,

        isAiLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// useApp
// ─────────────────────────────────────────────────────────────────────────────

export const useApp = () => {
  const context =
    useContext(
      AppContext
    );

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};

export const useAuth =
  useApp;

  