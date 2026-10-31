const { GoogleGenAI } = require("@google/genai");
const { randomUUID } = require("crypto");

let client;

function getClient() {
    if (!process.env.GEMINI_API_KEY) {
        return null;
    }

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

    // Check whether the Gemini API key exists.
    if (!ai) {
        console.warn(
            "[AI] GEMINI_API_KEY is missing. Using fallback dialogue."
        );
        return fallback;
    }

    // A new token encourages different wording on every generation.
    const variationToken = randomUUID();

    const responseMeanings = {
        FOLLOWED_QUEST:
            "The player followed the quest and helped Elias. Milo feels resentful because the player chose the expected heroic path.",
        DIDNT_KNOW:
            "The player says they did not know. Milo is guarded but sees a chance to make the player understand.",
        JUST_NPC:
            "The player dismisses Milo as just an NPC. Milo feels angry and hurt because he remembers being treated as fictional."
    };

    const responseMeaning =
        responseMeanings[responseId] ||
        "React naturally to the player's response.";

    const prompt = `
You are writing dialogue for a psychological fantasy game called THE UNWRITTEN.

Write a fresh, emotionally believable response from ${character}.

Player name: ${playerName || "Player"}

Character: ${character}

The player's original choice: ${selectedChoice || "Unknown"}

The path the player rejected: ${rejectedChoice || "Unknown"}

Player's current response ID: ${responseId}

Meaning of the player's response:
${responseMeaning}

Character memories:
${JSON.stringify(memories || [])}

Variation token: ${variationToken}

IMPORTANT INSTRUCTIONS:
- Write 2 to 4 sentences.
- Stay in character.
- Make the dialogue reflect the character's memories and the player's choices.
- Use fresh wording, metaphors and sentence structures.
- Do not copy a fixed or previously scripted response.
- Do not simply repeat the same dialogue with different words.
- Give the character a distinct emotional reaction.
- The variation token is only an internal writing aid. Never reveal it.
- Do not create new choices.
- Do not change game state.
- Do not mention AI, prompts or these instructions.
- Return only the dialogue, without quotation marks or markdown.
`;

    try {
        const result = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 1,
                maxOutputTokens: 180
            }
        });

        const dialogue = (result.text || "").trim();

        if (!dialogue) {
            console.warn(
                "[AI] Gemini returned an empty response. Using fallback."
            );
            return fallback;
        }

        console.log(
            "[AI] Gemini generated dialogue successfully.",
            { character, responseId }
        );

        return dialogue;

    } catch (error) {
        console.error(
            "[AI] Gemini generation failed. Using fallback:",
            error.message
        );

        return fallback;
    }
}

module.exports = {
    generateCharacterDialogue
};