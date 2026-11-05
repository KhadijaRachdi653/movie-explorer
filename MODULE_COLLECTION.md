# Personal Collection module

This module stores one collection item per signed-in user and TMDB movie ID. Each item can be marked as a favorite and assigned a watch status (`planned`, `watching`, or `watched`). The watch history records each time a movie is marked watched and supports explicitly logging rewatches. Custom named lists are outside this module and remain with the recommendations/lists module.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Put your MongoDB Atlas connection string in `MONGODB_URI`, replacing the placeholders. Keep `.env.local` private; it is ignored by Git.
3. Add the app's `AUTH_SECRET` and `TMDB_API_KEY` values. A TMDB key is needed for movie discovery; MongoDB settings alone don't provide movie data.
4. In MongoDB Atlas, allow network access from your development machine and ensure the database user has read/write access to the application database.
5. Run `npm install`, then `npm run dev`.

Mongoose creates the `collectionItems` collection on first write. Movie metadata is stored as a snapshot with the TMDB numeric ID, not a MongoDB `_id`.

## API

- `GET /api/collection` — list all items; optional `?favorite=true|false` or `?status=planned|watching|watched` filters.
- `POST /api/collection` — create or replace an item by TMDB movie ID. Body: `{ "movie": { "movieId": 550, "title": "Fight Club", "posterUrl": null }, "status": "planned", "favorite": true }`.
- `PATCH /api/collection/:id` — change `status`, `favorite`, or the stored movie snapshot.
- `POST /api/collection/:id/viewings` — log another viewing for a movie; marks its status as `watched`.
- `DELETE /api/collection/:id` — remove an item.

Moving an item into `watched` records a viewing date once for that status transition. Moving it to another status preserves its history. The response includes `watchHistory`, `viewingCount`, and `lastWatchedAt`.

All routes require a valid NextAuth session and derive `userId` from that session. A user cannot read, update, or delete another user's items. Re-adding a movie updates the existing item, so favorites and watch status share one record.
