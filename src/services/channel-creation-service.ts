/* eslint-disable no-await-in-loop */
import { Client } from 'discord.js';
import { ChannelTypes } from 'discord.js/typings/enums';
import { CreateChannelsData } from '../models/channel-creation-data';
import { GuildService } from './guild-service';

export class ChannelCreationService {
  static async createChannels(data: CreateChannelsData, client: Client): Promise<void> {
    const guild = await client.guilds.fetch({guild: data.guildID, cache: true, force: true});
    if (!await client.channels.fetch(data.courseChannels.categoryID).catch(() => false)) {
      const categoryChannel = (await guild.channels.create('courses', { 'type': 'GUILD_CATEGORY' }));
      data.courseChannels.categoryID = categoryChannel.id;
    }

    for (const courseID in data.courses) {
      let channel = await client.channels.fetch(data.courseChannels.channels[courseID])
        .catch(() => false);
      if (!channel) {
        channel = await guild.channels.create(data.courses[courseID], { 'type': 'GUILD_TEXT', 'parent': data.courseChannels.categoryID })
          .catch(() => false);
        if (channel) {
          data.courseChannels.channels[courseID] = channel.id;
        }
      }
    }

    await GuildService.updateCourseChannels(data.guildID, data.courseChannels);
  }
}
