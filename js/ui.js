import { gameState } from './gameState.js';
import { earnMoney, spendMoney } from './gameState.js';
import { applyNodeEffects, loadNodeTree } from './nodeHandler.js';

let countries = [];

async function populateCountryDropdown() {
  try {
    const response = await fetch('data/countries.json');
    countries = await response.json();

    const select = document.getElementById('country');
    select.innerHTML = '';
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.id;
      option.textContent = country.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Fehler beim Laden der Länder:", err);
  }
}

function getProfileImagePath() {
  const years = Math.floor(gameState.time.ageInMonths / 12);
  let phase = 'child';
  if (years >= 13 && years < 20) phase = 'youth';
  else if (years >= 20 && years < 65) phase = 'adult';
  else if (years >= 65) phase = 'old';
  return `assets/img/Characters/${phase}_${gameState.selectedCharacter}.png`;
}

function getFormattedAge() {
  const months = gameState.time.ageInMonths;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y} Jahr${y !== 1 ? 'e' : ''}, ${m} Monat${m !== 1 ? 'e' : ''}`;
}

function showGameScreen() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
}

function appendEvent(text) {
  const panel = document.getElementById('event-panel');
  panel.style.display = 'block';
  const p = document.createElement('p');
  p.textContent = text;
  panel.appendChild(p);
}

function renderCharacterOverview() {
  const p = gameState.player;
  document.getElementById('character-panel').innerHTML = `
    <div id="profile-container">
      <img id="profile-pic" src="${getProfileImagePath()}" alt="Profilbild">
    </div>
    <h3>Charakter</h3>
    <p>${p.firstName} ${p.lastName} (${translateGender(p.gender)})</p>
    <p>Land: ${p.country.toUpperCase()}</p>
    <p><strong>Alter:</strong> ${getFormattedAge()}</p>
    <hr>
    <p>Intelligenz: ${p.stats.intelligence}</p>
    <p>Charisma: ${p.stats.charisma}</p>
    <p>Aussehen: ${p.stats.appearance}</p>
    <p>Empathie: ${p.stats.empathy}</p>
    <p><strong>Geld:</strong> <span id="money-display">${p.money} CHF</span></p>
  `;
  document.getElementById('decision-panel').innerHTML = '';
  document.getElementById('subtopic-panel').style.display = 'none';
  document.getElementById('game-options').innerHTML = `<button id="continue-button">Starten</button>`;
}

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

  renderCharacterOverview();

  document.getElementById('game-options').innerHTML = `
    <button id="next-round">Weiter</button>
    <button id="skip-year">1 Jahr überspringen</button>
  `;
}

function renderEvent(eventData) {
  const dp = document.getElementById('decision-panel');
  dp.innerHTML = `<p>${eventData.eventText}</p>`;

  if (eventData.choices) {
    const container = document.createElement('div');
    container.className = 'choice-buttons';

    eventData.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.addEventListener('click', async () => {
        // Effekte der Auswahl anwenden
        applyEffects(choice.effects);
        appendEvent(choice.text);

        if (choice.followId) {
          // gewählte Entscheidung blockieren
          const followId = (choice.followId || '').trim();
          if (!gameState.triggeredEvents.map(e => (e || '').trim()).includes(followId)) {
            gameState.triggeredEvents.push(followId);
          }

          // alle anderen Optionen derselben Entscheidung ebenfalls blockieren
          if (eventData.eventIds) {
            eventData.eventIds.forEach(id => {
              const tid = (id || '').trim();
              if (!gameState.triggeredEvents.map(e => (e || '').trim()).includes(tid)) {
                gameState.triggeredEvents.push(tid);
              }
            });
          }

          // Flags des Knotens endgültig setzen (korrekt normalisiert)
          const allNodes = await loadNodeTree();
          const chosenNode = allNodes.find(n => (n.id || '').trim() === followId);
          if (chosenNode && chosenNode.setFlags) {
            gameState.flags = gameState.flags || {};
            Object.entries(chosenNode.setFlags).forEach(([k, v]) => {
              gameState.flags[k.trim().toLowerCase()] = v;
            });
          }
        }

        // UI zurücksetzen und nächste Runde starten
        dp.innerHTML = '';
        renderGameUI();
      });

      container.appendChild(btn);
    });

    dp.appendChild(container);
  }
}

function applyEffects(effects) {
  if (!effects) return;
  if (effects.money > 0) earnMoney(effects.money);
  if (effects.money < 0) spendMoney(-effects.money);
  for (const [stat, delta] of Object.entries(effects)) {
    if (stat !== 'money') {
      gameState.player.stats[stat] = (gameState.player.stats[stat] || 0) + delta;
    }
  }
}

function translateGender(c) {
  return c === 'm' ? 'Männlich'
       : c === 'w' ? 'Weiblich'
       : c === 'd' ? 'Divers'
       : '-';
}

function renderSubtopics(topicKey) {
  const panel = document.getElementById('subtopic-panel');
  panel.innerHTML = `<p>Subthemen für "${topicKey}" folgen.</p>`;
  panel.style.display = 'block';
}

export {
  showGameScreen,
  renderCharacterOverview,
  renderGameUI,
  renderEvent,
  appendEvent,
  populateCountryDropdown,
  renderSubtopics
};
