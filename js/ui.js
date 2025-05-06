// ui.js

import { gameState } from './gameState.js';
import { earnMoney, spendMoney } from './gameState.js';

/**
 * Befüllt das Länder-Dropdown im Startbildschirm
 */
function populateCountryDropdown() {
  fetch('data/countries.json')
    .then(response => {
      if (!response.ok) throw new Error('Fehler beim Laden der Länder');
      return response.json();
    })
    .then(countries => {
      const select = document.getElementById('country');
      select.innerHTML = '';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.id;
        option.textContent = country.name;
        select.appendChild(option);
      });
    })
    .catch(error => console.error('Dropdown-Fehler:', error));
}

/**
 * Bildpfad je Phase & Wahl
 */
function getProfileImagePath() {
  const years = Math.floor(gameState.time.ageInMonths / 12);
  let phase = 'child';
  if (years >= 13 && years < 20) phase = 'youth';
  else if (years >= 20 && years < 65) phase = 'adult';
  else if (years >= 65) phase = 'old';
  return `assets/img/Characters/${phase}_${gameState.selectedCharacter}.png`;
}

/**
 * Wechsel zum Spielbildschirm
 */
function showGameScreen() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
}

/**
 * Erweiterte Unterthemen
 */
const subtopics = {
  "Bildung & Karriere": [
    "Vorschulerziehung", "Grundschulbildung", "Sekundarstufe & Berufsorientierung",
    "Ausbildung & Studium", "Einstieg ins Berufsleben", "Karriereaufstieg",
    "Unternehmertum & Selbstständigkeit", "Lebenslanges Lernen"
  ],
  "Beziehungen & Familie": [
    "Eltern-Kind-Bindung", "Geschwister- und Freundschaften", "Jugendliche Partnerschaften",
    "Erwachsenenpartnerschaft", "Elternschaft & Familienplanung", "Generationsbeziehungen",
    "Krisen & Versöhnung", "Soziales Engagement"
  ],
  "Finanzen & Besitz": [
    "Taschengeld & erste Einnahmen", "Sparen & Budgetieren", "Konsumentscheidungen",
    "Geldanlage & Investitionen", "Immobilien & Miete", "Versicherungen & Steuern",
    "Schulden & Kredite", "Erbschaft & Vermögensweitergabe"
  ],
  "Gesundheit & Persönlichkeit": [
    "Grundversorgung & Impfungen", "Ernährung & Bewegung", "Psychische Gesundheit",
    "Selbstbild & Identität", "Persönlichkeitsentwicklung", "Krisenbewältigung",
    "Lebensphasenübergänge", "Ruhestand & Altersvorsorge"
  ],
  "Freizeit & Umwelt": [
    "Hobbys & Talente", "Reisen & Kulturerfahrungen", "Digitale Welt & Medien",
    "Natur & Nachhaltigkeit", "Kreatives Schaffen", "Freizeitnetzwerke",
    "Kultur & Veranstaltungen", "Soziale Initiativen"
  ]
};

/**
 * Zeigt Unterthemen an
 */
function renderSubtopics(topicKey) {
  const panel = document.getElementById('subtopic-panel');
  panel.innerHTML = '<ul>' +
    subtopics[topicKey].map(item =>
      `<li><button class="subtopic-btn">${item}</button></li>`
    ).join('') +
    '</ul>';
  panel.style.display = 'block';
}

/**
 * Hängt Eintrag in Event-Historie (Rechts) an
 */
function appendEvent(text) {
  const panel = document.getElementById('event-panel');
  const p = document.createElement('p');
  p.textContent = text;
  panel.appendChild(p);
}

/**
 * Rendert Charakterübersicht & löscht Panels
 */
function renderCharacterOverview() {
  const p = gameState.player;
  document.getElementById('character-panel').innerHTML = `
    <div id="profile-container">
      <img id="profile-pic" src="${getProfileImagePath()}" alt="Profilbild">
    </div>
    <h3>Charakter</h3>
    <p>${p.firstName} ${p.lastName} (${translateGender(p.gender)})</p>
    <p>Land: ${p.country.toUpperCase()}</p>
    <hr>
    <p>Intelligenz: ${p.stats.intelligence}</p>
    <p>Charisma: ${p.stats.charisma}</p>
    <p>Aussehen: ${p.stats.appearance}</p>
    <p>Empathie: ${p.stats.empathy}</p>
    <p><strong>Geld:</strong> <span id="money-display">${p.money} CHF</span></p>
  `;
  document.getElementById('decision-panel').innerHTML = '';
  document.getElementById('event-panel').innerHTML = '';
  document.getElementById('subtopic-panel').style.display = 'none';
  document.getElementById('game-options').innerHTML = `<button id="continue-button">Starten</button>`;
}

/**
 * Rendert Spiel-Header und Optionen
 */
function renderGameUI() {
  const { ageInMonths, startYear } = gameState.time;
  const year = startYear + Math.floor(ageInMonths / 12);
  const month = (ageInMonths % 12) + 1;
  const ageY = Math.floor(ageInMonths / 12);
  let phaseLabel = 'Kindheit';
  if (ageY >= 13 && ageY < 20) phaseLabel = 'Jugend';
  else if (ageY >= 20 && ageY < 65) phaseLabel = 'Erwachsenenalter';
  else if (ageY >= 65) phaseLabel = 'Alter';

  document.getElementById('game-header').textContent =
    `Monat: ${String(month).padStart(2, '0')}/${year}  |  Phase: ${phaseLabel}`;
  document.getElementById('profile-pic').src = getProfileImagePath();
  document.getElementById('money-display').textContent = `${gameState.player.money} CHF`;
  document.getElementById('game-options').innerHTML = `
    <button id="next-round">Weiter</button>
    <button id="skip-year">1 Jahr überspringen</button>
  `;
}

/**
 * Rendert Entscheidungs-Event im Decision-Panel
 */
function renderEvent(eventData) {
  const dp = document.getElementById('decision-panel');
  dp.innerHTML = `<p>${eventData.eventText}</p>`;
  if (eventData.choices) {
    const container = document.createElement('div');
    container.className = 'choice-buttons';
    eventData.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        applyEffects(choice.effects);
        appendEvent(choice.text);
        dp.innerHTML = '';
        renderGameUI();
      });
      container.appendChild(btn);
    });
    dp.appendChild(container);
  }
}

/**
 * Wendet Effekte an
 */
function applyEffects(effects) {
  if (effects.money > 0) earnMoney(effects.money);
  if (effects.money < 0) spendMoney(-effects.money);
  for (const [stat, delta] of Object.entries(effects)) {
    if (stat !== 'money') gameState.player.stats[stat] += delta;
  }
}

/**
 * Geschlechts-Code übersetzen
 */
function translateGender(c) {
  return c === 'm' ? 'Männlich'
       : c === 'w' ? 'Weiblich'
       : c === 'd' ? 'Divers'
       : '-';
}

export {
  populateCountryDropdown,
  showGameScreen,
  renderCharacterOverview,
  renderGameUI,
  renderSubtopics,
  appendEvent,
  renderEvent
};
