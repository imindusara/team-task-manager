/**
 * Date utilities for timezone-agnostic date handling.
 * Prevents UTC offset shifts (e.g. Sep 14 becoming Sep 13 in UTC+5:30).
 */

/**
 * Extracts a pure 'YYYY-MM-DD' string without any timezone drift or UTC conversions.
 * @param {string|Date} dateVal 
 * @returns {string} e.g. '2026-09-14'
 */
export const toDateStringOnly = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a date string or Date object into a local Date object without UTC drift.
 * @param {string|Date} dateVal 
 * @returns {Date|null}
 */
export const parseLocalDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;

  const str = String(dateVal).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hours = match[4] !== undefined ? parseInt(match[4], 10) : 0;
    const minutes = match[5] !== undefined ? parseInt(match[5], 10) : 0;
    const seconds = match[6] !== undefined ? parseInt(match[6], 10) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }

  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a date value into "Sep 14, 2026" strictly based on its local date parts.
 * @param {string|Date} dateVal 
 * @returns {string} e.g. 'Sep 14, 2026'
 */
export const formatDisplayDate = (dateVal) => {
  const str = toDateStringOnly(dateVal);
  if (!str) return '';
  const parts = str.split('-');
  if (parts.length < 3) return '';
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[monthIdx]} ${day}, ${year}`;
};

/**
 * Formats event time (e.g. "10:00 AM" or "All Day").
 * @param {Object} event 
 * @returns {string}
 */
export const formatEventTime = (event) => {
  if (!event || event.all_day) return 'All Day';
  try {
    const d = parseLocalDate(event.start_date || event.date);
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/**
 * Formats an event date range strictly preserving start and end dates (e.g. "Sep 14, 2026 – Sep 15, 2026").
 * @param {Object} event 
 * @returns {string}
 */
export const formatEventDateRange = (event) => {
  if (!event) return 'Scheduled Date';
  try {
    const startDateStr = toDateStringOnly(event.start_date || event.date);
    const startFormatted = formatDisplayDate(startDateStr);

    if (!startDateStr) return 'Scheduled Date';

    const endDateStr = event.end_date ? toDateStringOnly(event.end_date) : null;

    if (!endDateStr || startDateStr === endDateStr) {
      if (event.all_day) return startFormatted;
      const timeStr = formatEventTime(event);
      return timeStr && timeStr !== 'All Day' ? `${startFormatted} at ${timeStr}` : startFormatted;
    }

    const endFormatted = formatDisplayDate(endDateStr);
    return `${startFormatted} – ${endFormatted}`;
  } catch {
    return 'Scheduled Date';
  }
};

/**
 * Calculates a human-readable relative countdown/status label (e.g. "Due Today", "In 3 Days", "2 Days Overdue", "Tomorrow", "Yesterday").
 * @param {string|Date} targetDateVal 
 * @param {string|Date} [baseDateVal=new Date()]
 * @returns {{ label: string, status: 'today'|'tomorrow'|'future'|'overdue'|'yesterday'|'past', diffDays: number }}
 */
export const getCountdownLabel = (targetDateVal, baseDateVal = new Date()) => {
  const targetStr = toDateStringOnly(targetDateVal);
  const baseStr = toDateStringOnly(baseDateVal);

  if (!targetStr || !baseStr) {
    return { label: '', status: 'future', diffDays: 0 };
  }

  const targetDate = parseLocalDate(targetStr);
  const baseDate = parseLocalDate(baseStr);

  if (!targetDate || !baseDate) {
    return { label: '', status: 'future', diffDays: 0 };
  }

  // Calculate day difference without time drift
  const oneDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((targetDate.getTime() - baseDate.getTime()) / oneDay);

  if (diffDays === 0) {
    return { label: 'Due Today', status: 'today', diffDays: 0 };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', status: 'tomorrow', diffDays: 1 };
  } else if (diffDays > 1) {
    return { label: `In ${diffDays} Days`, status: 'future', diffDays };
  } else if (diffDays === -1) {
    return { label: 'Yesterday', status: 'yesterday', diffDays: -1 };
  } else {
    return { label: `${Math.abs(diffDays)} Days Overdue`, status: 'overdue', diffDays };
  }
};
