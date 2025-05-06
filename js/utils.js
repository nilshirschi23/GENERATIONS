/**
 * utils.js
 * Hilfsfunktionen für das GENERATIONS-Spiel.
 */

/**
 * Lädt per Fetch ein Workbook aus einer .xlsx-Datei.
 * @param {string} url
 * @returns {Promise<import('xlsx').WorkBook>}
 */
export async function loadWorkbook(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Konnte ${url} nicht laden: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: 'array' });
}

/**
 * Lädt alle Bildung-&-Karriere-Optionen aus education_career_options.xlsx
 * @returns {Promise<Record<string, any[]>>} Objekt mit je Sheet-Name und Array von Optionen
 */
export async function loadEducationCareerOptions() {
  const wb = await loadWorkbook('data/education_career_options.xlsx');
  const { utils: xlsxUtils } = XLSX;
  const data = {};
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    data[sheetName] = sheet
      ? xlsxUtils.sheet_to_json(sheet, { defval: null })
      : [];
  });
  console.debug('Bildungs-&-Karriere-Optionen geladen:', Object.keys(data));
  return data;
}
