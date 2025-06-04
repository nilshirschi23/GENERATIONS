import { gameState } from './gameState.js';

let loadedNodes = [];

export async function loadNodeTree() {
  if (loadedNodes.length > 0) return loadedNodes;
  try {
    const res = await fetch('../data/nodes.json');
    if (!res.ok) throw new Error(`Fehler beim Laden: ${res.status}`);
    loadedNodes = await res.json();
    // IDs schon beim Laden trimmen
    loadedNodes.forEach(node => {
      if (typeof node.id === "string") node.id = node.id.trim();
    });
    return loadedNodes;
  } catch (err) {
    console.error("Konnte nodes.json nicht laden:", err);
    return [];
  }
}

function isReachableByAnyConnection(node, allNodes) {
  // alle IDs vorher trimmen
  const nodeId = (node.id || '').trim();
  if (allNodes.every(n => !n.verknuepfungen || !n.verknuepfungen.map(id => id.trim()).includes(nodeId))) {
    return true;
  }
  return allNodes.some(n =>
    gameState.triggeredEvents.map(e => (e || '').trim()).includes(n.id.trim()) &&
    n.verknuepfungen && n.verknuepfungen.map(id => id.trim()).includes(nodeId)
  );
}

export async function checkNextNodeEvent() {
  const nodes = await loadNodeTree();
  const currentAge = Math.floor(gameState.time.ageInMonths / 12);
  let decisionEvents = [];

  for (const node of nodes) {
    const type = (node.typ || '').toLowerCase();
    const nodeId = (node.id || '').trim();

    if (gameState.triggeredEvents.map(id => (id || '').trim()).includes(nodeId)) continue;
    if (!isReachableByAnyConnection(node, nodes)) continue;
    if (node.bedingung && !evalCondition(node.bedingung, currentAge)) continue;
    if (!flagsMatch(node.requireFlags || {})) continue;

    if (type === 'zufall') {
      applyNodeEffects(node);
      gameState.triggeredEvents.push(nodeId); // immer getrimmt!
      return node.beschreibung;
    }

    if (type === 'entscheidung') {
      decisionEvents.push(node);
    }
  }

  if (decisionEvents.length > 0) {
    const ids = decisionEvents.map(n => (n.id || '').trim());
    return {
      eventText: "Triff eine Entscheidung:",
      choices: decisionEvents.map(n => ({
        text:     n.beschreibung,
        effects:  n.effekte || {},
        followId: (n.id || '').trim()
      })),
      eventIds: ids
    };
  }

  return null;
}

function evalCondition(expr, age) {
  const Flags = gameState.flags || {};
  const Alter = age;
  try {
    return eval(expr);
  } catch (err) {
    console.warn("Fehler in Bedingungsausdruck:", expr, err);
    return false;
  }
}

function flagsMatch(required) {
  const userFlags = {};
  for (const key in (gameState.flags || {})) {
    userFlags[key.trim().toLowerCase()] = gameState.flags[key];
  }
  return Object.entries(required).every(([key, val]) =>
    userFlags[key.trim().toLowerCase()] === val
  );
}

export function applyNodeEffects(node) {
  const stats = gameState.player.stats;
  const eff = node.effekte || {};
  stats.intelligence += eff.intelligenz || 0;
  stats.charisma     += eff.charisma || 0;
  stats.appearance   += eff.aussehen || 0;
  stats.empathy      += eff.empathie || 0;
  gameState.player.money += eff.geld || 0;

  gameState.flags = gameState.flags || {};
  if (node.setFlags) {
    Object.entries(node.setFlags).forEach(([k, v]) => {
      gameState.flags[k.trim().toLowerCase()] = v;
    });
  }
}
