import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { GamesConfig, GameConfig, ProviderId, PricesData, GamePrices } from './types.js';
import { getProvider } from './providers/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONFIG_PATH = join(ROOT, 'config', 'games.json');
const DATA_DIR = join(ROOT, 'data');
const OUTPUT_PATH = join(DATA_DIR, 'prices.json');

async function main() {
  const configRaw = readFileSync(CONFIG_PATH, 'utf-8');
  const config: GamesConfig = JSON.parse(configRaw);
  const { ticketQuantity, games } = config;

  const results: GamePrices[] = [];

  for (const game of games) {
    const sources: GamePrices['sources'] = [];

    for (const [providerId, url] of Object.entries(game.sources)) {
      if (!url) continue;
      const id = providerId as ProviderId;
      try {
        const provider = getProvider(id);
        const result = await provider.scrapeTickets(url, ticketQuantity);
        sources.push(result);
      } catch (err) {
        console.error(`[${game.id}] ${id}:`, err);
        sources.push({
          provider: id,
          tickets: [],
          failedCount: 0,
        });
      }
    }

    results.push({
      gameId: game.id,
      name: game.name,
      date: game.date,
      venue: game.venue,
      ticketQuantity,
      lastUpdated: new Date().toISOString(),
      sources,
    });
  }

  const data: PricesData = {
    lastUpdated: new Date().toISOString(),
    ticketQuantity,
    games: results,
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Wrote', OUTPUT_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
