import { initializePlayer, advanceTimeByOneMonth, gameState } from './gameState.js';
import {
  renderGameUI,
  renderCharacterOverview,
  showGameScreen,
  renderSubtopics,
  renderEvent,
  appendEvent,
  populateCountryDropdown
} from './ui.js';

import { checkNextNodeEvent } from './nodeHandler.js';

function setupEventListeners() {
  document.getElementById('start-form').addEventListener('submit', (e) => {
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

  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderSubtopics(btn.dataset.topic);
      document.getElementById('decision-panel').innerHTML = '';
    });
  });

  document.addEventListener('click', async (e) => {
    if (e.target.id === 'continue-button') {
      renderGameUI();
      appendEvent("Spiel gestartet");
      return;
    }

    if (e.target.id === 'next-round') {
      advanceTimeByOneMonth();
      const event = await checkNextNodeEvent();

      if (event) {
        if (typeof event === 'object' && event.choices) {
          renderEvent(event);
        } else if (typeof event === 'string') {
          appendEvent(event);
          renderGameUI();
        }
        return;
      }

      renderGameUI();
    }

    if (e.target.id === 'skip-year') {
      for (let i = 0; i < 12; i++) advanceTimeByOneMonth();
      renderGameUI();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  gameState.triggeredEvents = [];
  gameState.flags = {};    // Sicherstellen, dass Flags initialisiert sind!
  setupEventListeners();
  populateCountryDropdown();
});
