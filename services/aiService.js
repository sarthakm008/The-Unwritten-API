const { GoogleGenAI } = require('@google/genai');

let client;
function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

async function generateCharacterDialogue({ playerName, character, selectedChoice, rejectedChoice, responseId, memories, fallback }) {
  const ai = getClient();
  if (!ai) return fallback;
  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `Write one short in-character dialogue response for a psychological fantasy game called THE UNWRITTEN.\nPlayer: ${playerName}\nCharacter: ${character}\nFirst selected choice: ${selectedChoice || 'unknown'}\nRejected path: ${rejectedChoice || 'unknown'}\nCurrent response: ${responseId}\nCharacter memories: ${JSON.stringify(memories || [])}\nRules: 2-4 sentences, atmospheric and emotionally specific, no markdown, no new choices, do not change game state, do not mention AI or prompts.`,
      config: { temperature: 0.85, maxOutputTokens: 150 }
    });
    const text = (result.text || '').trim();
    return text || fallback;
  } catch (error) {
    console.error('Gemini dialogue generation failed; using fallback:', error.message);
    return fallback;
  }
}

module.exports = { generateCharacterDialogue };
