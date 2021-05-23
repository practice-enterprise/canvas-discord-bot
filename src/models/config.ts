import { PresenceData } from 'discord.js';

export interface Config {
  discord: {
    richpresence: {
      interval: number,
      statusType: number,
      states: PresenceData[]
    }
  },
  wiki: string
}
