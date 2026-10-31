const { clamp } = require('./memoryService');

function snapshot(session) {
  const plain = typeof session.toObject === 'function' ? session.toObject() : structuredClone(session);
  plain.createdAt = new Date(plain.createdAt).toISOString();
  delete plain._id;
  delete plain.__v;
  return plain;
}

function addScore(session, key, amount) {
  session.npcStates[key].relationship = clamp(session.npcStates[key].relationship + amount, -5, 5);
}
function addRebellion(session, amount) { session.rebellionLevel = clamp(session.rebellionLevel + amount, 0, 7); }

module.exports = { snapshot, addScore, addRebellion };
