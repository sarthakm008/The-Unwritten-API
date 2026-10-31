# THE UNWRITTEN — Backend Starter

Express + MongoDB/Mongoose + Gemini dialogue backend aligned to API Contract v1.1.

## Quick start

1. Install Node.js 20+.
2. In this folder, run `npm install`.
3. Copy `.env.example` to `.env` and configure values.
4. For a fast local smoke test without Atlas, set `IN_MEMORY_MODE=true` (data disappears on restart).
5. Run `npm run dev` and open `http://localhost:5000/api/health`.

For persistent sessions, set `IN_MEMORY_MODE=false` and provide a valid `MONGODB_URI`. Add `GEMINI_API_KEY` to enable generated dialogue. If Gemini is unavailable or the key is missing, deterministic fallback dialogue is used.

## API

- `POST /api/game/start` — `{ "playerName": "Player" }`
- `POST /api/game/continue` — `{ "sessionId": "..." }`
- `POST /api/game/choice` — `{ "sessionId": "...", "selected": "HELP_ELIAS", "rejected": "HELP_MILO" }`
- `POST /api/game/talk` — `{ "sessionId": "...", "character": "MILO", "responseId": "DIDNT_KNOW" }`
- `POST /api/game/forgotten` — `{ "sessionId": "...", "responseId": "WHO_ARE_YOU" }`
- `POST /api/game/ending` — `{ "sessionId": "...", "endingChoice": "REWRITE_STORY" }`
- `GET /api/game/:sessionId`
- `GET /api/health` and `GET /api/ready`

All successful game endpoints return `success: true`. Errors return `{ "success": false, "message": "..." }`. Scene transitions are validated server-side; duplicate or out-of-order transitions return HTTP 409. Repeating the same ending request returns the saved ending; requesting the opposite ending returns 409.

## Frontend integration

Set the frontend's `VITE_API_URL` to the backend base URL, for example `http://localhost:5000`. Configure `CLIENT_ORIGIN` to the exact frontend origin. For multiple origins, use a comma-separated list.

## Important scope notes

- Introduction narration remains in `client/src/data/storyData.js`; the backend only tracks `INTRODUCTION` and advances it via `/continue`.
- Gemini generates dialogue only. The backend owns scoring, memories, and scene progression.
- `npcStates.MILO.mood` and the top-level `mood` returned by `/talk` are taken from the same saved value.
- This is a hackathon starter, not a hardened production service. The in-memory mode is for local demos only; use MongoDB for deployment.
