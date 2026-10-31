const { randomUUID } = require('node:crypto');
const repository = require('../services/gameRepository');
const { snapshot, addScore, addRebellion } = require('../services/storyService');
const { addMemory } = require('../services/memoryService');
const { generateCharacterDialogue } = require('../services/aiService');
const { MILO_LINES, FORGOTTEN_LINES } = require('../data/npcData');

function fail(status, message) { const e = new Error(message); e.status = status; throw e; }
function requiredString(value, field, max = 80) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `${field} is required and must be at most ${max} characters`);
  return value.trim();
}
async function getSession(sessionId) {
  const session = await repository.get(sessionId);
  if (!session) fail(404, 'Session not found');
  return session;
}
function recordDialogue(session, character, responseId, dialogue) {
  session.dialogueHistory.push({ character, responseId, dialogue, scene: session.currentScene, at: new Date().toISOString() });
}

async function start(req, res) {
  const playerName = requiredString(req.body?.playerName, 'playerName', 40);
  const session = {
    sessionId: randomUUID(), playerName, currentChapter: 1, currentScene: 'INTRODUCTION', rebellionLevel: 0,
    choices: [],
    npcStates: {
      ELIAS: { relationship: 0, mood: 'NEUTRAL', memories: [] },
      MILO: { relationship: 0, mood: 'NEUTRAL', memories: [] },
      THE_FORGOTTEN: { relationship: 0, mood: 'MYSTERIOUS', memories: [] }
    }, dialogueHistory: [], ending: null, createdAt: new Date()
  };
  const saved = await repository.create(session);
  res.status(201).json({ success: true, sessionId: saved.sessionId, gameState: snapshot(saved) });
}

async function continueIntro(req, res) {
  const session = await getSession(requiredString(req.body?.sessionId, 'sessionId'));
  if (session.currentScene !== 'INTRODUCTION') fail(409, 'Continue is only valid during INTRODUCTION');
  session.currentScene = 'VILLAGE_CHOICE';
  await repository.save(session);
  res.json({ success: true, gameState: snapshot(session), nextScene: session.currentScene });
}

async function choice(req, res) {
  const sessionId = requiredString(req.body?.sessionId, 'sessionId');
  const selected = requiredString(req.body?.selected, 'selected');
  const rejected = requiredString(req.body?.rejected, 'rejected');
  if (!['HELP_ELIAS', 'HELP_MILO'].includes(selected) || !['HELP_ELIAS', 'HELP_MILO'].includes(rejected) || selected === rejected) fail(400, 'selected and rejected must be different valid choice IDs');
  const session = await getSession(sessionId);
  if (session.currentScene !== 'VILLAGE_CHOICE') fail(409, 'Choice is not valid in the current scene');
  session.choices.push({ selected, rejected, scene: 'VILLAGE_CHOICE', at: new Date().toISOString() });
  const selectedNpc = selected === 'HELP_ELIAS' ? 'ELIAS' : 'MILO';
  const rejectedNpc = rejected === 'HELP_ELIAS' ? 'ELIAS' : 'MILO';
  addScore(session, selectedNpc, 1); addScore(session, rejectedNpc, -1); addRebellion(session, 1);
  addMemory(session.npcStates[selectedNpc], 'SELECTED', `The player chose ${selected}.`, 'VILLAGE_CHOICE');
  addMemory(session.npcStates[rejectedNpc], 'REJECTED', `The player rejected ${rejected}.`, 'VILLAGE_CHOICE');
  session.currentChapter = 2; session.currentScene = 'MILO_CONFRONTATION';
  await repository.save(session);
  res.json({ success: true, gameState: snapshot(session), nextScene: session.currentScene });
}

async function talk(req, res) {
  const sessionId = requiredString(req.body?.sessionId, 'sessionId');
  const character = requiredString(req.body?.character, 'character');
  const responseId = requiredString(req.body?.responseId, 'responseId');
  const session = await getSession(sessionId);
  if (session.currentScene !== 'MILO_CONFRONTATION') fail(409, 'Dialogue is not valid in the current scene');
  if (character !== 'MILO' || !Object.hasOwn(MILO_LINES, responseId)) fail(400, 'Invalid character or responseId');
  const rule = MILO_LINES[responseId];
  let deltaRelationship = responseId === 'FOLLOWED_QUEST' ? -1 : responseId === 'DIDNT_KNOW' ? 1 : -2;
  let deltaRebellion = responseId === 'FOLLOWED_QUEST' ? 1 : responseId === 'DIDNT_KNOW' ? 0 : 2;
  addScore(session, 'MILO', deltaRelationship); addRebellion(session, deltaRebellion);
  session.npcStates.MILO.mood = rule.mood;
  addMemory(session.npcStates.MILO, 'RESPONSE', `The player responded: ${responseId}.`, 'MILO_CONFRONTATION');
  const firstChoice = session.choices[0] || {};
  const dialogue = await generateCharacterDialogue({
    playerName: session.playerName, character: 'Milo', selectedChoice: firstChoice.selected,
    rejectedChoice: firstChoice.rejected, responseId, memories: session.npcStates.MILO.memories, fallback: rule.fallback
  });
  recordDialogue(session, 'MILO', responseId, dialogue);
  session.currentChapter = 3; session.currentScene = 'FORGOTTEN_ENCOUNTER';
  await repository.save(session);
  res.json({ success: true, dialogue, mood: session.npcStates.MILO.mood, gameState: snapshot(session), nextScene: session.currentScene });
}

async function forgotten(req, res) {
  const sessionId = requiredString(req.body?.sessionId, 'sessionId');
  const responseId = requiredString(req.body?.responseId, 'responseId');
  if (!Object.hasOwn(FORGOTTEN_LINES, responseId)) fail(400, 'Invalid responseId');
  const session = await getSession(sessionId);
  if (session.currentScene !== 'FORGOTTEN_ENCOUNTER') fail(409, 'Forgotten response is not valid in the current scene');
  const deltas = { WHO_ARE_YOU: [1, 1], WHY_NOT_IN_STORY: [2, 1], NO_TIME: [-1, 2] };
  const [relationship, rebellion] = deltas[responseId];
  addScore(session, 'THE_FORGOTTEN', relationship); addRebellion(session, rebellion);
  addMemory(session.npcStates.THE_FORGOTTEN, 'RESPONSE', `The player responded: ${responseId}.`, 'FORGOTTEN_ENCOUNTER');
  const dialogue = await generateCharacterDialogue({
    playerName: session.playerName, character: 'The Forgotten', selectedChoice: session.choices[0]?.selected,
    rejectedChoice: session.choices[0]?.rejected, responseId, memories: session.npcStates.THE_FORGOTTEN.memories,
    fallback: FORGOTTEN_LINES[responseId]
  });
  recordDialogue(session, 'THE_FORGOTTEN', responseId, dialogue);
  session.currentChapter = 4; session.currentScene = 'FINAL_CONFRONTATION';
  await repository.save(session);
  res.json({ success: true, dialogue, nextScene: session.currentScene, gameState: snapshot(session) });
}

async function ending(req, res) {
  const sessionId = requiredString(req.body?.sessionId, 'sessionId');
  const endingChoice = requiredString(req.body?.endingChoice, 'endingChoice');
  if (!['RESTORE_STORY', 'REWRITE_STORY'].includes(endingChoice)) fail(400, 'Invalid endingChoice');
  const session = await getSession(sessionId);
  const requestedEnding = endingChoice === 'RESTORE_STORY' ? 'THE_SCRIPTED' : 'THE_UNWRITTEN';
  const requestedScene = endingChoice === 'RESTORE_STORY' ? 'ENDING_SCRIPTED' : 'ENDING_UNWRITTEN';
  if (session.ending) {
    if (session.ending !== requestedEnding) fail(409, 'An ending has already been chosen for this session');
    return res.json({ success: true, ending: session.ending, narration: endingNarration(session.ending, session.playerName), gameState: snapshot(session) });
  }
  if (session.currentScene !== 'FINAL_CONFRONTATION') fail(409, 'Ending is not valid in the current scene');
  session.ending = requestedEnding; session.currentScene = requestedScene;
  session.dialogueHistory.push({ character: 'NARRATOR', responseId: endingChoice, dialogue: endingNarration(requestedEnding, session.playerName), scene: requestedScene, at: new Date().toISOString() });
  await repository.save(session);
  res.json({ success: true, ending: session.ending, narration: endingNarration(session.ending, session.playerName), gameState: snapshot(session) });
}
function endingNarration(ending, playerName) {
  if (ending === 'THE_SCRIPTED') return `${playerName}, the pages settle. Elarion returns to its familiar shape, every character in their appointed place. The world is safe—and the story will begin again.`;
  return `${playerName}, the final page tears itself open. For the first time, the characters look beyond their lines and choose what comes next. The story ends here. Their lives do not.`;
}

async function getGame(req, res) {
  const session = await getSession(requiredString(req.params.sessionId, 'sessionId'));
  res.json({ success: true, gameState: snapshot(session) });
}

module.exports = { start, continueIntro, choice, talk, forgotten, ending, getGame };
