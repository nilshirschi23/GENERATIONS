let educationOptions = [];

/**
 * Lädt alle Bildung-&-Karriere-Optionen aus education.json (statt XLSX)
 * @returns {Promise<void>}
 */
export async function loadEducationOptions() {
  if (educationOptions.length > 0) return;
  try {
    const res = await fetch('../data/education.json');
    if (!res.ok) throw new Error('Fehler beim Laden von education.json');
    educationOptions = await res.json();
    console.debug('Bildungsoptionen geladen:', educationOptions.length);
  } catch (err) {
    console.error('Bildungsdaten konnten nicht geladen werden:', err);
  }
}

/**
 * Gibt das bereits geladene Bildungssystem zurück
 * @returns {Array}
 */
export function getEducationOptions() {
  return educationOptions;
}
