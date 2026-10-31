const NPC_IDS = Object.freeze({ ELIAS: 'ELIAS', MILO: 'MILO', THE_FORGOTTEN: 'THE_FORGOTTEN', NARRATOR: 'NARRATOR' });

const MILO_LINES = {
  FOLLOWED_QUEST: {
    mood: 'RESENTFUL',
    fallback: 'You did exactly what the story asked. Elias gets his heroic moment, the gate stays safe, and I return to the same empty shop. Tell me—did you ever wonder what happens to the people you do not choose?'
  },
  DIDNT_KNOW: {
    mood: 'GUARDED',
    fallback: 'You did not know. That is what the script counts on: that you will keep moving before you can ask who wrote the rules. I am asking now. Will you listen?'
  },
  JUST_NPC: {
    mood: 'ANGRY',
    fallback: 'Just an NPC? I remember every time you walked past. Every line I was forced to repeat. If I am only a character, why can I remember you?'
  }
};

const FORGOTTEN_LINES = {
  WHO_ARE_YOU: 'I am every road you did not take. Every voice left outside the story. I have been waiting in the space between your choices.',
  WHY_NOT_IN_STORY: 'Because the story has room for only the people it needs. The rest of us are cut away—and told we never existed.',
  NO_TIME: 'Then keep running. The story loves a player who never stops long enough to notice the walls.'
};

module.exports = { NPC_IDS, MILO_LINES, FORGOTTEN_LINES };
