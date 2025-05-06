// gameState.js

export const gameState = {
  player: {
    firstName: "",
    lastName: "",
    gender: "",
    country: "",
    stats: {
      intelligence: 0,
      charisma: 0,
      appearance: 0,
      empathy: 0
    },
    money: 0
  },
  time: {
    ageInMonths: 0,
    startYear: 2025
  },
  selectedCharacter: "1"  // "1" oder "2"
};

export function initializePlayer(formData) {
  gameState.player.firstName = formData.firstName;
  gameState.player.lastName  = formData.lastName;
  gameState.player.gender    = formData.gender;
  gameState.player.country   = formData.country;
  gameState.selectedCharacter = formData.character;
  // Anfangs-Kontostand
  gameState.player.money = 0;

  gameState.player.stats.intelligence = getRandomStat();
  gameState.player.stats.charisma     = getRandomStat();
  gameState.player.stats.appearance   = getRandomStat();
  gameState.player.stats.empathy      = getRandomStat();
}

function getRandomStat() {
  return Math.floor(Math.random() * 51) + 50;
}

export function advanceTimeByOneMonth() {
  gameState.time.ageInMonths += 1;
}

// Finanz-Operationen
export function earnMoney(amount) {
  gameState.player.money += amount;
}

export function spendMoney(amount) {
  gameState.player.money = Math.max(0, gameState.player.money - amount);
}
