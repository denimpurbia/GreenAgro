import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLiveLocation,
  getCachedLocation,
  LocationResult,
} from '../services/geolocationService';
import { formatCurrentDate } from '../utils/dateUtils';

export interface UseLiveLocationReturn {
  location: string;
  date: string;
  status: LocationResult['status'] | 'detecting';
  isLoading: boolean;
  timeZone?: string;
  refresh: () => Promise<void>;
  rawLocation?: LocationResult;
}

export function useLiveLocation(): UseLiveLocationReturn {
  // Check if we have an immediate cached location
  const cached = getCachedLocation();

  const [status, setStatus] = useState<LocationResult['status'] | 'detecting'>(
    cached ? 'success' : 'detecting'
  );
  const [location, setLocation] = useState<string>(
    cached ? cached.formattedLocation : 'Detecting location...'
  );
  const [timeZone, setTimeZone] = useState<string | undefined>(
    cached?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [date, setDate] = useState<string>(() => formatCurrentDate(timeZone));
  const [rawLocation, setRawLocation] = useState<LocationResult | undefined>(cached || undefined);

  const isMountedRef = useRef(true);

  // Keep date updated dynamically (every 30s)
  useEffect(() => {
    isMountedRef.current = true;
    const updateDate = () => {
      if (isMountedRef.current) {
        setDate(formatCurrentDate(timeZone));
      }
    };

    updateDate();
    const timer = setInterval(updateDate, 30000);
    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [timeZone]);

  const fetchLocation = useCallback(async (force = false) => {
    if (!force) {
      const activeCache = getCachedLocation();
      if (activeCache) {
        setLocation(activeCache.formattedLocation);
        setStatus('success');
        setRawLocation(activeCache);
        if (activeCache.timeZone) {
          setTimeZone(activeCache.timeZone);
        }
        return;
      }
    }

    setStatus('detecting');
    setLocation('Detecting location...');

    const res = await getLiveLocation(force);
    if (!isMountedRef.current) return;

    setRawLocation(res);
    setStatus(res.status);
    setLocation(res.formattedLocation);
    if (res.timeZone) {
      setTimeZone(res.timeZone);
      setDate(formatCurrentDate(res.timeZone));
    }
  }, []);

  useEffect(() => {
    fetchLocation(false);
  }, [fetchLocation]);

  const refresh = useCallback(async () => {
    await fetchLocation(true);
  }, [fetchLocation]);

  return {
    location,
    date,
    status,
    isLoading: status === 'detecting',
    timeZone,
    refresh,
    rawLocation,
  };
}
