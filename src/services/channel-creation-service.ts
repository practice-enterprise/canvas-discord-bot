/* eslint-disable no-await-in-loop */
import { Client } from 'discord.js';
import { CreateChannelsData } from '../models/channel-creation-data';
import { GuildService } from './guild-service';

export class ChannelCreationService {
  static async createChannels(data: CreateChannelsData, client: Client): Promise<void> {
    const guild = await client.guilds.fetch(data.guildID, true, true);
    if (!await client.channels.fetch(data.courseChannels.categoryID).catch(() => false)) {
      const categoryChannel = (await guild.channels.create('courses', { 'type': 'category' }));
      data.courseChannels.categoryID = categoryChannel.id;
    }

    for (const courseID in data.courses) {
      let channel = await client.channels.fetch(data.courseChannels.channels[courseID])
        .catch(() => false);
      if (!channel) {
        channel = await guild.channels.create(data.courses[courseID], { 'type': 'text', 'parent': data.courseChannels.categoryID })
          .catch(() => false);
        if (channel) {
          data.courseChannels.channels[courseID] = channel.id;
        }
      }
    }

    await GuildService.updateCourseChannels(data.guildID, data.courseChannels);
  }
}
