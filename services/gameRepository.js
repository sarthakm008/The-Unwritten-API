const GameSession = require('../models/GameSession');
const { connectDB } = require('../config/db');

const memorySessions = new Map();
const memoryMode = () => process.env.IN_MEMORY_MODE === 'true';

async function ensureStore() { if (!memoryMode()) await connectDB(); }
async function create(session) {
  if (memoryMode()) { memorySessions.set(session.sessionId, structuredClone(session)); return memorySessions.get(session.sessionId); }
  return GameSession.create(session);
}
async function get(sessionId) {
  if (memoryMode()) return memorySessions.get(sessionId) || null;
  await ensureStore();
  return GameSession.findOne({ sessionId });
}
async function save(session) {
  if (memoryMode()) { memorySessions.set(session.sessionId, structuredClone(session)); return memorySessions.get(session.sessionId); }
  await session.save();
  return session;
}
module.exports = { ensureStore, create, get, save, memoryMode };
