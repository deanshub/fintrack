# Fintrack

Personal finance tracker built with Next.js. Track transactions, categorize spending, and monitor budgets.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** shadcn/ui, Tailwind CSS v4
- **Language:** TypeScript (strict)
- **Data:** Flat JSON files (`data/` directory)
- **PWA:** Serwist (offline support)
- **Package Manager:** Bun

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Seed mock data
curl -X POST http://localhost:3000/api/seed
```

## Scripts

| Command          | Description            |
|------------------|------------------------|
| `bun dev`        | Start dev server       |
| `bun run build`  | Production build       |
| `bun run lint`   | Lint with Biome        |
| `bun run format` | Auto-format with Biome |

## Docker

Build and run the image directly:

```bash
docker build -t fintrack .
docker run -p 3000:3000 -v fintrack-data:/app/data fintrack
```

### Docker Compose

```yaml
# compose.yaml
services:
  fintrack:
    image: ghcr.io/deanshub/fintrack:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

```bash
docker compose up -d
```

## Data Layout

```
data/
  transactions/      # Per-month JSON files
    2025-11.json
    2025-12.json
    ...
  categories.json
  budgets.json
```

Transaction data is split into per-month files for scalability. Categories and budgets remain as single files.
