// eventHandler.js

import { gameState, earnMoney, spendMoney } from './gameState.js';

let configEvents = null;

/**
 * Lädt und parst die Excel-Datei data/events/events_with_choices.xlsx per SheetJS
 */
async function loadConfigEvents() {
  if (!configEvents) {
    const res = await fetch('/data/events/events_with_choices.xlsx');
    if (!res.ok) throw new Error('Konnte events_with_choices.xlsx nicht laden');
    const arrayBuffer = await res.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: null });
    configEvents = raw;
  }
  return configEvents;
}

/**
 * Prüft, ob für das aktuelle Alter ein konfiguriertes Event fällig ist.
 * Gibt bei Entscheidungs-Event ein Objekt zurück, sonst Text.
 */
export async function checkConfiguredEvent() {
  const years = Math.floor(gameState.time.ageInMonths / 12);
  const phase = years < 13
    ? 'child'
    : years < 20
      ? 'youth'
      : years < 65
        ? 'adult'
        : 'old';

  const all = await loadConfigEvents();
  const candidates = all.filter(e =>
    e.phase === phase &&
    years >= e.minAge &&
    years <= e.maxAge &&
    !gameState.triggeredEvents.includes(e.id)
  );
  if (!candidates.length) return null;

  const evt = candidates[Math.floor(Math.random() * candidates.length)];
  gameState.triggeredEvents.push(evt.id);

  // Prüfe auf choice-Felder
  if (evt.choice1_text && evt.choice2_text) {
    return {
      id: evt.id,
      eventText: evt.eventText,
      choices: [
        {
          text: evt.choice1_text,
          effects: {
            money: Number(evt.choice1_moneyEffect) || 0,
            intelligence: Number(evt.choice1_intelligenceEffect) || 0,
            charisma: Number(evt.choice1_charismaEffect) || 0,
            appearance: Number(evt.choice1_appearanceEffect) || 0,
            empathy: Number(evt.choice1_empathyEffect) || 0
          }
        },
        {
          text: evt.choice2_text,
          effects: {
            money: Number(evt.choice2_moneyEffect) || 0,
            intelligence: Number(evt.choice2_intelligenceEffect) || 0,
            charisma: Number(evt.choice2_charismaEffect) || 0,
            appearance: Number(evt.choice2_appearanceEffect) || 0,
            empathy: Number(evt.choice2_empathyEffect) || 0
          }
        }
      ]
    };
  }

  // Normales Event ohne Choice
  if (evt.moneyEffect) {
    if (evt.moneyEffect > 0) earnMoney(evt.moneyEffect);
    else spendMoney(-evt.moneyEffect);
  }
  if (evt.intelligenceEffect) gameState.player.stats.intelligence += evt.intelligenceEffect;
  if (evt.charismaEffect)     gameState.player.stats.charisma     += evt.charismaEffect;
  if (evt.appearanceEffect)   gameState.player.stats.appearance   += evt.appearanceEffect;
  if (evt.empathyEffect)      gameState.player.stats.empathy      += evt.empathyEffect;

  return evt.eventText;
}
