function addMemory(npc, type, text, scene) {
  npc.memories.push({ type, text, scene, at: new Date().toISOString() });
  if (npc.memories.length > 30) npc.memories.splice(0, npc.memories.length - 30);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

module.exports = { addMemory, clamp };
