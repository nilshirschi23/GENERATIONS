 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/js/nodeHandler.js b/js/nodeHandler.js
index c88cb3aabf4a440a7795178dc9dc75c54e0a31e2..027ae6c6865f94d91b4f37bed3916de05f0d4ddd 100644
--- a/js/nodeHandler.js
+++ b/js/nodeHandler.js
@@ -1,45 +1,39 @@
-import { gameState } from './gameState.js';
+import { gameState } from './gameState.js';
+import nodesData from '../data/nodes.json' assert { type: 'json' };
 
 let loadedNodes = [];
 
-export async function loadNodeTree() {
-  if (loadedNodes.length > 0) return loadedNodes;
-  try {
-    const res = await fetch('../data/nodes.json');
-    if (!res.ok) throw new Error(`Fehler beim Laden: ${res.status}`);
-    loadedNodes = await res.json();
-    // IDs schon beim Laden trimmen
-    loadedNodes.forEach(node => {
-      if (typeof node.id === "string") node.id = node.id.trim();
-    });
-    return loadedNodes;
-  } catch (err) {
-    console.error("Konnte nodes.json nicht laden:", err);
-    return [];
-  }
-}
+export async function loadNodeTree() {
+  if (loadedNodes.length > 0) return loadedNodes;
+  loadedNodes = nodesData.map(n => {
+    const node = { ...n };
+    if (typeof node.id === 'string') node.id = node.id.trim();
+    return node;
+  });
+  return loadedNodes;
+}
 
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
 
EOF
)
