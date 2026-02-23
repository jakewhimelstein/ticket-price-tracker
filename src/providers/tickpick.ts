import puppeteer from 'puppeteer';
import type { Ticket, ProviderId } from '../types.js';
import type { TicketProvider } from './types.js';

const PROVIDER_ID: ProviderId = 'tickpick';

export const tickpickProvider: TicketProvider = {
  id: PROVIDER_ID,
  name: 'TickPick',

  async scrapeTickets(eventUrl: string, ticketQuantity: number) {
    const urlWithParams = `${eventUrl}?qty=${ticketQuantity}-false&sortType=P`;
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(urlWithParams, { waitUntil: 'load', timeout: 45000 });

    // Try primary container first; fall back to .listing (page structure may vary by event type)
    const container = await page
      .waitForSelector('#listingContainer', { timeout: 25000 })
      .catch(() => null);
    if (!container) {
      await page.waitForSelector('.listing', { timeout: 8000 }).catch(() => null);
    }
    await new Promise((r) => setTimeout(r, 2500));

    const result = await page.evaluate(
      (pageUrl: string, quantity: number, providerId: ProviderId) => {
        const tickets: Ticket[] = [];
        const link = pageUrl;
        let failedTicketsCount = 0;

        const ticketElements = document.querySelectorAll('.listing');
        ticketElements.forEach((ticketElement) => {
          try {
            let sectionStr = '';
            let rowStr = '';
            const sectionRowText = ticketElement.querySelector('.sout span')?.textContent;
            if (sectionRowText) {
              const match = sectionRowText.match(/Section (\d+) • Row (\d+)/);
              if (match) {
                [sectionStr, rowStr] = match.slice(1, 3);
              }
            }

            const priceElement = ticketElement.querySelector('label > b');
            const priceText = priceElement ? priceElement.textContent?.trim() : '';
            const price = priceText ? parseInt(priceText.replace(/^\$/, ''), 10) : -1;

            if (sectionStr && rowStr && price >= 0) {
              const section = parseInt(sectionStr, 10);
              const row = parseInt(rowStr, 10);
              if (!Number.isNaN(section) && !Number.isNaN(row)) {
                tickets.push({ section, row, price, quantity, provider: providerId, link });
              }
            } else {
              failedTicketsCount++;
            }
          } catch {
            failedTicketsCount++;
          }
        });

        return { provider: providerId, tickets, failedCount: failedTicketsCount };
      },
      urlWithParams,
      ticketQuantity,
      PROVIDER_ID
    );

    await browser.close();
    return result;
  },
};
