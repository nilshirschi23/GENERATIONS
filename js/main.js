// main.js

import {
  populateCountryDropdown,
  showGameScreen,
  renderCharacterOverview,
  renderGameUI,
  renderSubtopics,
  appendEvent,
  renderEvent
} from './ui.js';

import {
  gameState,
  initializePlayer,
  advanceTimeByOneMonth
} from './gameState.js';

import {
  checkConfiguredEvent
} from './eventHandler.js';

function setupEventListeners() {
  // Start-Formular
  document.getElementById('start-form').addEventListener('submit', e => {
    e.preventDefault();
    initializePlayer({
      character: document.getElementById('character-choice').value,
      firstName: document.getElementById('firstName').value.trim(),
      lastName:  document.getElementById('lastName').value.trim(),
      gender:    document.getElementById('gender').value,
      country:   document.getElementById('country').value
    });
    showGameScreen();
    renderCharacterOverview();
  });

  // Klick auf Hauptthemen
  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderSubtopics(btn.dataset.topic);
      document.getElementById('decision-panel').innerHTML = '';
    });
  });

  // Spiel-Buttons
  document.addEventListener('click', async e => {
    if (e.target.id === 'continue-button') {
      renderGameUI();
      appendEvent('Spiel gestartet');
      return;
    }
    if (e.target.id === 'next-round') {
      advanceTimeByOneMonth();
      const evt = await checkConfiguredEvent();
      if (evt) {
        if (typeof evt === 'object' && evt.choices) {
          renderEvent(evt);
        } else {
          const text = typeof evt === 'string' ? evt : evt.eventText;
          appendEvent(text);
          renderGameUI();
        }
        return;
      }
      renderGameUI();
      return;
    }
    if (e.target.id === 'skip-year') {
      for (let i = 0; i < 12; i++) advanceTimeByOneMonth();
      renderGameUI();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  populateCountryDropdown();
  setupEventListeners();
  gameState.triggeredEvents = [];
});
