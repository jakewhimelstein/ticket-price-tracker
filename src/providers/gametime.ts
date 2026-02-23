import puppeteer from 'puppeteer';
import type { Ticket, ProviderId } from '../types.js';
import type { TicketProvider } from './types.js';

const PROVIDER_ID: ProviderId = 'gametime';

export const gametimeProvider: TicketProvider = {
  id: PROVIDER_ID,
  name: 'Gametime',

  async scrapeTickets(eventUrl: string, ticketQuantity: number) {
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
    await page.goto(eventUrl, { waitUntil: 'load', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 3000));

    await page.waitForSelector('a[href*="/listings/"]', { timeout: 15000 }).catch(() => null);

    if (ticketQuantity !== 2) {
      const dropdownMenuSelector =
        'div.ui-Menu-Menu-module__menu.ui-Menu-Menu-module__icon-chip';
      await page.waitForSelector(dropdownMenuSelector, { timeout: 10000 }).catch(() => null);
      const dropdownMenu = await page.$(dropdownMenuSelector);
      if (dropdownMenu) {
        await dropdownMenu.click();
      }
      await new Promise((r) => setTimeout(r, 2000));
      const ticketsOptionSelector = `div.pages-Event-components-OmnibarOptions-OmnibarOptions-module__panel-body-item[id="${ticketQuantity}"]`;
      await page.waitForSelector(ticketsOptionSelector, { timeout: 15000 }).catch(() => null);
      await page.click(ticketsOptionSelector).catch(() => null);
      await new Promise((r) => setTimeout(r, 2000));
    }

    const allInPricingEnabled = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="all-in-pricing"]');
      return el?.classList.contains('_2amR4x2ztZ5dL7PJxn7oJo') ?? false;
    });
    if (!allInPricingEnabled) {
      await page.click('[data-testid="all-in-pricing"]').catch(() => null);
      await new Promise((r) => setTimeout(r, 2000));
    }

    const result = await page.evaluate(
      (pageUrl: string, quantity: number, providerId: ProviderId) => {
        const tickets: Ticket[] = [];
        let failedTicketsCount = 0;
        const seen = new Set<string>();

        const processCard = (el: Element, link: string) => {
          const text = el.textContent || '';
          const priceMatch = text.match(/\$[\d,]+/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/[^\d]/g, ''), 10) : -1;

          let section = 0;
          let row = 0;
          let sectionLabel: string | undefined;
          let rowLabel: string | undefined;

          const seatEl = el.querySelector(
            '.pages-Event-components-ListingCard-ListingCard-module__seat-details-row'
          );
          const seatText = (seatEl?.textContent || text);

          const nbaMatch = seatText.match(/(\d+),?\s*Row\s*(\d+|[A-Z])/i);
          if (nbaMatch) {
            section = parseInt(nbaMatch[1], 10);
            const r = nbaMatch[2];
            row = /\d+/.test(r) ? parseInt(r, 10) : r.charCodeAt(0);
          } else {
            const catMatch = seatText.match(/CAT\s*(\d+)/i);
            const lowerMatch = seatText.match(/Lower\s*(\d+)/i);
            const rowMatch = seatText.match(/Row\s*(\d+|[A-Z]|TBD)/i);
            if (catMatch) {
              section = parseInt(catMatch[1], 10);
              sectionLabel = `CAT ${catMatch[1]}`;
            } else if (lowerMatch) {
              section = parseInt(lowerMatch[1], 10);
              sectionLabel = `Lower${lowerMatch[1]}`;
            } else {
              const anyNum = seatText.match(/(\d+)/);
              if (anyNum) section = parseInt(anyNum[1], 10);
            }
            if (rowMatch) {
              const r = rowMatch[1];
              if (r.toUpperCase() === 'TBD') {
                rowLabel = 'TBD';
              } else {
                row = /\d+/.test(r) ? parseInt(r, 10) : r.charCodeAt(0);
              }
            }
          }

          const key = `${link}-${price}-${section}-${row}`;
          if (price >= 0 && link && !seen.has(key)) {
            seen.add(key);
            tickets.push({
              section,
              row,
              price,
              quantity,
              provider: providerId,
              link,
              sectionLabel,
              rowLabel,
            });
          } else if (price < 0 || !link) {
            failedTicketsCount++;
          }
        };

        const nbaCards = document.querySelectorAll(
          '.pages-Event-components-ListingCard-ListingCard-module__listing-card-container'
        );
        nbaCards.forEach((card) => {
          const linkEl = card.querySelector('a[href*="/listings/"]');
          const link = linkEl instanceof HTMLAnchorElement ? linkEl.href : pageUrl;
          processCard(card, link);
        });

        if (nbaCards.length === 0) {
          document.querySelectorAll('a[href*="/listings/"]').forEach((a) => {
            if (!(a instanceof HTMLAnchorElement)) return;
            const card = a.closest('[class*="Listing"]') || a.closest('[class*="Card"]') || a;
            processCard(card, a.href);
          });
        }

        return { provider: providerId, tickets, failedCount: failedTicketsCount };
      },
      eventUrl,
      ticketQuantity,
      PROVIDER_ID
    );

    await browser.close();
    return result;
  },
};
