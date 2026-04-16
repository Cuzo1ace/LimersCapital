/**
 * Minimal iCalendar (.ics) generator + download helper.
 * No dependencies. RFC 5545 compliant enough for Google Cal / Apple / Outlook.
 */

function fmtIcsDate(iso) {
  // Convert ISO timestamp → YYYYMMDDTHHMMSSZ
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(s) {
  if (!s) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * Build an .ics file body for a single event.
 *
 * @param {object} ev
 * @param {string} ev.id          — stable UID
 * @param {string} ev.title
 * @param {string} [ev.summary]   — description body
 * @param {string} ev.startIso    — start date (ISO)
 * @param {string} [ev.endIso]    — end date (ISO). Defaults to start+1h.
 * @param {string} [ev.url]       — URL attached to the event
 * @returns {string} .ics file contents
 */
export function buildIcs(ev) {
  const dtStart = fmtIcsDate(ev.startIso);
  const end = ev.endIso || new Date(new Date(ev.startIso).getTime() + 3600_000).toISOString();
  const dtEnd = fmtIcsDate(end);
  const dtStamp = fmtIcsDate(new Date().toISOString());
  const uid = `${ev.id}@limerscapital.com`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    "PRODID:-//Limer's Capital//News Events//EN",
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(ev.title)}`,
    ev.summary ? `DESCRIPTION:${escapeText(ev.summary)}` : null,
    ev.url ? `URL:${ev.url}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  // RFC 5545: CRLF line endings
  return lines.join('\r\n');
}

/**
 * Trigger a browser download of an .ics file.
 */
export function downloadIcs(ev) {
  const body = buildIcs(ev);
  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug = (ev.title || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick before revoking
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
