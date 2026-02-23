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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(eventUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    if (ticketQuantity !== 2) {
      const dropdownMenuSelector =
        'div.ui-Menu-Menu-module__menu.ui-Menu-Menu-module__icon-chip';
      await page.waitForSelector(dropdownMenuSelector, { timeout: 10000 });
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

        const ticketElements = document.querySelectorAll(
          '.pages-Event-components-ListingCard-ListingCard-module__listing-card-container'
        );
        ticketElements.forEach((ticketElement) => {
          let sectionStr = '';
          let rowStr = '';
          const sectionRowElement = ticketElement.querySelector(
            '.pages-Event-components-ListingCard-ListingCard-module__seat-details-row'
          );
          const sectionRowText = sectionRowElement?.textContent;
          if (sectionRowText) {
            const match = sectionRowText.match(/(\d+), Row (\d+|[A-Z])/);
            if (match) {
              [sectionStr, rowStr] = match.slice(1, 3);
            }
          }

          const priceElement = ticketElement.querySelector(
            '.pages-Event-components-ListingCard-ListingCard-module__price-info'
          );
          const priceText = priceElement
            ? priceElement.lastElementChild?.textContent
            : '';
          const price = priceText
            ? parseInt(priceText.trim().replace(/^\$|\/ea$/g, ''), 10)
            : -1;

          const linkElement = ticketElement.querySelector(
            'a.pages-Event-components-ListingCard-ListingCard-module__listing-card'
          );
          const link =
            linkElement instanceof HTMLAnchorElement ? linkElement.href : pageUrl;

          if (sectionStr && rowStr && price >= 0 && link) {
            const section = parseInt(sectionStr, 10);
            const row = parseInt(rowStr, 10);
            if (!Number.isNaN(section) && !Number.isNaN(row)) {
              tickets.push({ section, row, price, quantity, provider: providerId, link });
            }
          } else {
            failedTicketsCount++;
          }
        });

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
