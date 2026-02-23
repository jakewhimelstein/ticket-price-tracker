# Ticket Price Tracker

A **GitHub-hosted** ticket price tracker that shows the cheapest listings for games you choose, from **TickPick**, **Gametime**, and (optionally) more sites. Data is scraped by GitHub Actions and displayed on a static page.

Inspired by [rjmcnamara10/ticket-tracker](https://github.com/rjmcnamara10/ticket-tracker).

## What you get

- **Static GitHub Pages site** in `docs/` that shows ticket prices per game and per source.
- **Configurable games** in `config/games.json` — you pick the games and event URLs for each provider.
- **Scheduled updates** via GitHub Actions (daily + on push); results are committed to the repo so the page always has fresh data.
- **Extensible providers** — add new ticket sites by implementing one interface and registering the provider.

## Quick start

1. **Add your games** in `config/games.json`:
   - Set `ticketQuantity` (e.g. `2`).
   - For each game, set `id`, `name`, `date`, `venue`, and `sources`: URLs for each site you want (e.g. `tickpick`, `gametime`).

2. **Enable GitHub Pages** for this repo:
   - **Settings → Pages → Source**: “Deploy from a branch”
   - **Branch**: `main` (or your default), folder **`/docs`**
   - Save. The site will be at `https://<your-username>.github.io/ticket-price-tracker/`.

3. **Run the scraper** so the page has data:
   - Push to `main` (the workflow will run and commit `data/prices.json` and `docs/data/prices.json`), or
   - Trigger **Actions → “Update ticket prices” → Run workflow**.

## Local development

```bash
npm install
npm run scrape   # writes data/prices.json (and optionally copy to docs/data for local view)
```

To view the page locally, serve the `docs/` folder (e.g. `npx serve docs` or open `docs/index.html` and load `docs/data/prices.json` in the same server).

## Adding more ticket sites

The design is provider-agnostic:

1. **Extend the type** in `src/types.ts`: add a new key to `ProviderId`, e.g. `'stubhub'`.
2. **Implement a provider** in `src/providers/`: create e.g. `stubhub.ts` that implements `TicketProvider` (id, name, `scrapeTickets(eventUrl, ticketQuantity)` returning `ScrapeResult`).
3. **Register it** in `src/providers/index.ts`: add the provider to the `providers` object and export it.
4. **Use it in config**: in `config/games.json`, add a `sources.stubhub` URL for any game you want to scrape from that site.

No changes are required in the GitHub Action or the docs page — they iterate over whatever providers and games are in the config and data.

## Project layout

- `config/games.json` — games to track and their event URLs per provider.
- `src/providers/` — one module per ticket site (TickPick, Gametime, etc.).
- `src/run-scrape.ts` — reads config, runs all providers for all games, writes `data/prices.json`.
- `.github/workflows/update-prices.yml` — runs scraper on schedule and push, commits updated data and copies to `docs/data/`.
- `docs/` — static GitHub Pages site; loads `data/prices.json` and renders games and prices.

## License

MIT.
