# Entity Sheets (PHP)

These files are **data-only** "sheets" used to define both playable characters (classes) and monsters.

## Why PHP sheets?
- Easy to version and edit
- Can be loaded directly by the backend
- Can be exported to JSON later without changing the structure

## Shared structure
Characters and monsters share the same structure. The main difference is:
- `is_player`: `true` for playable entities, `false` for monsters

All paths are relative to `public/` (e.g. `assets/img/...`).



