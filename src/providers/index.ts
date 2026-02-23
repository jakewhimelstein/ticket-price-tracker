import type { ProviderId } from '../types.js';
import type { TicketProvider } from './types.js';
import { tickpickProvider } from './tickpick.js';
import { gametimeProvider } from './gametime.js';

const providers: Record<ProviderId, TicketProvider> = {
  tickpick: tickpickProvider,
  gametime: gametimeProvider,
};

export function getProvider(id: ProviderId): TicketProvider {
  const p = providers[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

export function getProviderIds(): ProviderId[] {
  return Object.keys(providers) as ProviderId[];
}

/** Add new providers here when you add new sites. */
export { tickpickProvider, gametimeProvider };
