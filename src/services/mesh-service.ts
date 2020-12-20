import Axios from 'axios';
import { Client } from 'discord.js';
import { Subscription, timer } from 'rxjs';
import { buildClient } from '../discord';
import { Logger } from '../util/logger';
import { ReminderService } from './reminder-service';

const MAX_HEALTH = 3;

export class MeshService {
  shard: { id: string, shard: number, shardCount: number } | undefined;
  heartbeat: Subscription | undefined;
  reminder: Subscription | undefined;
  client: Client | undefined;
  health = MAX_HEALTH;

  constructor() {
    this.startHeartbeat();
  }

  async join(): Promise<void> {
    try {
      const res = await Axios.request({
        method: 'GET',
        baseURL: process.env.API_URL,
        url: '/mesh',
        validateStatus: () => true,
      });

      if (res.status == 200) {
        this.shard = res.data;
        Logger.info(`Joined mesh as shard(${res.data.shard}:${res.data.id})`);
        this.client = await buildClient(res.data.shardCount, res.data.shard);
        this.reminder = ReminderService.initReminderJob(this.client);
      } else if (res.status == 204) {
        Logger.debug('mesh service full, standing by');
      }
    } catch (err) {
      this.health -= 1;
      Logger.error('Failed to contact service mesh');
    }
  }

  startHeartbeat(): void {
    if (this.heartbeat) {
      this.heartbeat.unsubscribe();
    }

    this.heartbeat = timer(0, 10000).subscribe(async () => {
      if (this.health <= 0) {
        Logger.crit(`Could not connect to service mesh after ${MAX_HEALTH} tries, exiting with status 2`);
        process.exit(2);
      }

      if (!this.shard) {
        this.join();
        return;
      }

      try {
        const res = await Axios.request({
          method: 'GET',
          baseURL: process.env.API_URL,
          url: `/mesh/${this.shard.id}`,
          validateStatus: () => true,
        });

        if (res.status === 404) {
          // likely due to api outage
          Logger.error('Tried to heartbeat with invalid data');
          this.reset();
        } else if (res.status === 426) {
          Logger.crit('I have been marked as bad, exiting with status 1');
          process.exit(1);
        } else if (res.status === 204) {
          this.health = Math.min(this.health + 1, MAX_HEALTH);
        }
      } catch (err) {
        this.health -= 1;
        Logger.error('Failed to send heartbeat');
      }
    });
  }

  async destroy(): Promise<void> {
    if (this.shard?.id) {
      await Axios.request({
        method: 'DELETE',
        baseURL: process.env.API_URL,
        url: `/mesh/${this.shard.id}`
      });
    }
  }

  reset(): void {
    this.shard = undefined;
    this.client?.destroy();
    this.client = undefined;
    this.heartbeat?.unsubscribe();
    this.reminder?.unsubscribe();

    this.startHeartbeat();
  }
}
