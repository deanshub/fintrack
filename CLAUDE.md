# Fintrack — Project Conventions

## UI
- Use shadcn/ui components (new-york style, lucide icons).
- Add new shadcn components via `bunx shadcn add <component>`.

## React
- Default to Server Components. Only add `"use client"` when required (e.g., SWR hooks, event handlers, browser APIs).
- Each custom (non-shadcn) component lives in its own file under `components/`.

## Data Fetching
- Use SWR (`import useSWR from "swr"`) for client-side data fetching.

## Styling
- Tailwind CSS v4. Theme is defined via CSS variables in `app/globals.css`.
- Use the `cn()` helper from `@/lib/utils` for conditional/merged classes.

## Language
- TypeScript in strict mode.

## Data Storage
- Store data as flat JSON files in the `data/` directory.
- Only migrate to SQLite if file-based storage becomes insufficient.

## Linting & Formatting
- Biome (not ESLint). Run `bun run lint` to check and `bun run format` to auto-format.

## Package Manager
- Bun.

## Path Aliases
- `@/*` maps to the project root (configured in `tsconfig.json`).
