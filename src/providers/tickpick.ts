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

    const tickpickScript = `
      const tickets = [];
      const link = pageUrl;
      let failedTicketsCount = 0;
      const ticketElements = document.querySelectorAll('.listing');
      ticketElements.forEach(el => {
        try {
          let sectionStr = '', rowStr = '';
          const sectionRowEl = el.querySelector('.sout span');
          const sectionRowText = sectionRowEl ? sectionRowEl.textContent : '';
          const match = sectionRowText && sectionRowText.match(/Section (\\d+) \\u2022 Row (\\d+)/);
          if (match) { sectionStr = match[1]; rowStr = match[2]; }
          const priceEl = el.querySelector('label > b');
          const priceText = priceEl ? priceEl.textContent.trim() : '';
          const price = priceText ? parseInt(priceText.replace(/^\\$/, ''), 10) : -1;
          if (sectionStr && rowStr && price >= 0) {
            const section = parseInt(sectionStr, 10);
            const row = parseInt(rowStr, 10);
            if (!isNaN(section) && !isNaN(row)) tickets.push({ section, row, price, quantity, provider: providerId, link });
          } else failedTicketsCount++;
        } catch { failedTicketsCount++; }
      });
      return { provider: providerId, tickets, failedCount: failedTicketsCount };
    `;
    const result = await page.evaluate(
      new Function('pageUrl', 'quantity', 'providerId', tickpickScript),
      urlWithParams,
      ticketQuantity,
      PROVIDER_ID
    );

    await browser.close();
    return result;
  },
};
