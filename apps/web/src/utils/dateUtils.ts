/**
 * Dynamic date and time utilities for GreenAgro
 * Ensures all dates, days, and months match the user's real local time and timezone.
 */

export interface FormattedDateInfo {
  weekdayShort: string; // e.g. "Tue"
  weekdayLong: string;  // e.g. "Tuesday"
  day: string;          // e.g. "22"
  monthShort: string;   // e.g. "Sep"
  monthLong: string;    // e.g. "September"
  year: string;         // e.g. "2026"
  formattedShort: string; // e.g. "Tue, 22 Sep 2026"
  formattedLong: string;  // e.g. "Tuesday, 22 September 2026"
}

/**
 * Returns detailed, accurate date information respecting the specified or detected timezone.
 */
export function getLocalDateInfo(date: Date = new Date(), timeZone?: string): FormattedDateInfo {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: tz,
    });
    const parts = formatter.formatToParts(date);
    const weekdayShort = parts.find(p => p.type === 'weekday')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const monthShort = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';

    const longFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      timeZone: tz,
    });
    const longParts = longFormatter.formatToParts(date);
    const weekdayLong = longParts.find(p => p.type === 'weekday')?.value || weekdayShort;
    const monthLong = longParts.find(p => p.type === 'month')?.value || monthShort;

    return {
      weekdayShort,
      weekdayLong,
      day,
      monthShort,
      monthLong,
      year,
      formattedShort: `${weekdayShort}, ${day} ${monthShort} ${year}`,
      formattedLong: `${weekdayLong}, ${day} ${monthLong} ${year}`,
    };
  } catch {
    // Fallback if Intl fails or invalid timezone string
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsLong = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const d = date;
    const weekdayShort = daysShort[d.getDay()];
    const weekdayLong = daysLong[d.getDay()];
    const day = String(d.getDate());
    const monthShort = monthsShort[d.getMonth()];
    const monthLong = monthsLong[d.getMonth()];
    const year = String(d.getFullYear());

    return {
      weekdayShort,
      weekdayLong,
      day,
      monthShort,
      monthLong,
      year,
      formattedShort: `${weekdayShort}, ${day} ${monthShort} ${year}`,
      formattedLong: `${weekdayLong}, ${day} ${monthLong} ${year}`,
    };
  }
}

/**
 * Returns formatted date string like "Tue, 22 Sep 2026"
 */
export function formatCurrentDate(timeZone?: string): string {
  return getLocalDateInfo(new Date(), timeZone).formattedShort;
}

/**
 * Generates dynamic 5-day forecast dates starting from today
 */
export function generateForecastDates(timeZone?: string): Array<{ date: string; dayName: string }> {
  const result: Array<{ date: string; dayName: string }> = [];
  const base = new Date();

  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const info = getLocalDateInfo(d, timeZone);
    result.push({
      date: `${info.day} ${info.monthShort}`,
      dayName: i === 0 ? 'Today' : info.weekdayShort,
    });
  }

  return result;
}
