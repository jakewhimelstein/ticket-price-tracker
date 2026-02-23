import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Ticket, ProviderId } from '../types.js';
import type { TicketProvider } from './types.js';

puppeteer.use(StealthPlugin());

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
        '--window-size=1920,1080',
      ],
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(urlWithParams, { waitUntil: 'networkidle0', timeout: 60000 });

    await Promise.race([
      page.waitForSelector('#listingContainer', { timeout: 35000 }),
      page.waitForSelector('.listing', { timeout: 35000 }),
      page.waitForSelector('[class*="listing"]', { timeout: 35000 }),
    ]).catch(() => null);
    await new Promise((r) => setTimeout(r, 4000));

    const tickpickScript = `
      const tickets = [];
      const link = pageUrl;
      let failedTicketsCount = 0;
      const parseSeat = (text) => {
        let section = 0, row = 0, sectionLabel, rowLabel;
        const sectionRow = (text || '').match(/Section\\s*(\\d+)\\s*[\\u2022\\u00B7\\•]?\\s*Row\\s*(\\d+)/i);
        if (sectionRow) { section = +sectionRow[1]; row = +sectionRow[2]; }
        else {
          const cat = (text || '').match(/(?:Category|CAT)\\s*(\\d+)/i);
          const num = (text || '').match(/(\\d+)/);
          if (cat) { section = +cat[1]; sectionLabel = 'CAT ' + cat[1]; }
          else if (num) section = +num[1];
        }
        return { section, row, sectionLabel, rowLabel };
      };
      const els = document.querySelectorAll('.listing');
      els.forEach(el => {
        try {
          const sout = el.querySelector('.sout span') || el.querySelector('.sout');
          const seat = parseSeat(sout ? sout.textContent : el.textContent);
          const priceEl = el.querySelector('label > b') || el.querySelector('[class*="price"]');
          const priceMatch = (el.textContent || '').match(/\\$[\\d,]+/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/\\D/g, ''), 10) : (priceEl ? parseInt((priceEl.textContent || '').replace(/\\D/g, ''), 10) : -1);
          if (price >= 0) tickets.push({ section: seat.section, row: seat.row, price, quantity, provider: providerId, link, sectionLabel: seat.sectionLabel, rowLabel: seat.rowLabel });
          else failedTicketsCount++;
        } catch { failedTicketsCount++; }
      });
      if (els.length === 0) {
        document.querySelectorAll('[class*="Listing"], [class*="listing"]').forEach(el => {
          const priceMatch = (el.textContent || '').match(/\\$[\\d,]+/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/\\D/g, ''), 10) : -1;
          if (price >= 0) { const s = parseSeat(el.textContent); tickets.push({ section: s.section, row: s.row, price, quantity, provider: providerId, link, sectionLabel: s.sectionLabel, rowLabel: s.rowLabel }); }
        });
      }
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
