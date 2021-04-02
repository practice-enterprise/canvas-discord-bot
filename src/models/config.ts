import { PresenceStatusData } from 'discord.js';

export interface Config {
  discord: {
    richpresence: {
      interval: number,
      statusType: number,
      states: [
        {
          status: PresenceStatusData | string,
          activity: {
            name: string,
            type: number
          }
        }
      ]
    }
  }
}
