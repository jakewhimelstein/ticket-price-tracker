/**
 * Shared types for ticket data and providers.
 * Add new provider IDs here when you add new sites.
 */

export type ProviderId = 'tickpick' | 'gametime';

export interface Ticket {
  section: number;
  row: number;
  price: number;
  quantity: number;
  provider: ProviderId;
  link: string;
}

export interface ScrapeResult {
  provider: ProviderId;
  tickets: Ticket[];
  failedCount: number;
}

export interface GameConfig {
  id: string;
  name: string;
  date: string;
  venue: string;
  /** URLs per provider; only listed providers are scraped */
  sources: Partial<Record<ProviderId, string>>;
}

export interface GamesConfig {
  ticketQuantity: number;
  games: GameConfig[];
}

export interface GamePrices {
  gameId: string;
  name: string;
  date: string;
  venue: string;
  ticketQuantity: number;
  lastUpdated: string;
  sources: Array<{
    provider: ProviderId;
    tickets: Ticket[];
    failedCount: number;
  }>;
}

export interface PricesData {
  lastUpdated: string;
  ticketQuantity: number;
  games: GamePrices[];
}
