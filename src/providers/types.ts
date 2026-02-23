import type { ProviderId, ScrapeResult } from '../types.js';

/**
 * Interface for ticket providers. Implement this to add a new site.
 */
export interface TicketProvider {
  readonly id: ProviderId;
  readonly name: string;
  scrapeTickets(eventUrl: string, ticketQuantity: number): Promise<ScrapeResult>;
}
