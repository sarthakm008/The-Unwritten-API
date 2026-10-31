const mongoose = require('mongoose');

const npcStateSchema = new mongoose.Schema({
  relationship: { type: Number, default: 0, min: -5, max: 5 },
  mood: { type: String, required: true },
  memories: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { _id: false });

const gameSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  playerName: { type: String, required: true, trim: true, maxlength: 40 },
  currentChapter: { type: Number, default: 1, min: 1, max: 4 },
  currentScene: { type: String, default: 'INTRODUCTION' },
  rebellionLevel: { type: Number, default: 0, min: 0, max: 7 },
  choices: { type: [mongoose.Schema.Types.Mixed], default: [] },
  npcStates: {
    ELIAS: { type: npcStateSchema, required: true },
    MILO: { type: npcStateSchema, required: true },
    THE_FORGOTTEN: { type: npcStateSchema, required: true }
  },
  dialogueHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
  ending: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

gameSessionSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.createdAt = new Date(ret.createdAt).toISOString();
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.models.GameSession || mongoose.model('GameSession', gameSessionSchema);
