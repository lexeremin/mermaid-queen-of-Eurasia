# mermaid-queen-of-Eurasia
Game about the mermaid queen that brought love and peace to slavic lands


## Development

```bash
npm install
npm run dev        # start the dev server
npm run build      # typecheck + production build
npm run typecheck
npm run lint
npm test
```

Project docs live in [`docs/`](docs/Task.md); the product brief is [`Description.md`](Description.md).

## Cloud sync (optional)

The game is fully playable offline; progress is saved in the browser. To add a cloud save and anonymous stats, create a Supabase project and follow "Setup" in [`docs/database-schema.md`](docs/database-schema.md): enable anonymous sign-ins, run the SQL migration, put the project URL and the **publishable** key in `.env`, then run `npm run supabase:check`.
