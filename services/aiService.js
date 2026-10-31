const { GoogleGenAI } = require('@google/genai');

let client;

function getClient() {
    if (!process.env.GEMINI_API_KEY) return null;

    if (!client) {
        client = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
    }

    return client;
}

async function generateCharacterDialogue({
    playerName,
    character,
    selectedChoice,
    rejectedChoice,
    responseId,
    memories,
    fallback
}) {
    const ai = getClient();

    if (!ai) return fallback;

    const responseMeanings = {
        FOLLOWED_QUEST:
            "The player says they followed the quest. React to their decision to follow the assigned mission rather than considering Milo's feelings.",

        DIDNT_KNOW:
            "The player says they did not know. React to their lack of awareness. Show guarded emotion and question whether they ever noticed Milo.",

        JUST_NPC:
            "The player calls Milo just an NPC. React with anger and hurt. Challenge the idea that he is merely a fictional character."
    };

    const instruction =
        responseMeanings[responseId] ||
        "React naturally to what the player said.";

    try {
        const result = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

            contents: `
You are writing dialogue for ${character} in THE UNWRITTEN,
a psychological fantasy game.

PLAYER NAME: ${playerName}

PLAYER'S ORIGINAL CHOICE: ${selectedChoice}
PLAYER'S REJECTED PATH: ${rejectedChoice}

PLAYER'S CURRENT RESPONSE: ${responseId}

MEANING OF THIS RESPONSE:
${instruction}

CHARACTER MEMORIES:
${JSON.stringify(memories || [])}

IMPORTANT RULES:
1. React specifically to the meaning of the current response.
2. Do not give the same generic reaction for every response.
3. Remember the player's original choice and rejected path.
4. Maintain ${character}'s established personality.
5. Show emotions through natural dialogue.
6. Generate fresh wording rather than repeating previous dialogue.
7. Write 2-4 sentences.
8. Do not use markdown.
9. Do not invent new player choices.
10. Never change game state or relationship scores.

Return only the character's dialogue.
`,

            config: {
                temperature: 0.95,
                maxOutputTokens: 180
            }
        });

        const dialogue = (result.text || '').trim();

        return dialogue || fallback;

    } catch (error) {
        console.error(
            'Gemini dialogue generation failed; using fallback:',
            error.message
        );

        return fallback;
    }
}

module.exports = { generateCharacterDialogue };