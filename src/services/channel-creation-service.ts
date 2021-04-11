/* eslint-disable no-await-in-loop */
import { Client, TextChannel } from "discord.js";
import { GuildService } from "./guild-service";

export class ChannelCreationService {
  static async createChannels(data: createChannelsData, client: Client) {

    const guild = await client.guilds.fetch(data.guildID, true, true);
    if (!await client.channels.fetch(data.courseChannels.CategoryID).catch(() => undefined)) {
      let categoryChannel = (await guild.channels.create('courses', { 'type': 'category' }).catch(() => undefined));
      categoryChannel != undefined ? data.courseChannels.CategoryID = categoryChannel.id : categoryChannel = undefined;
    }

    for (const courseID in data.courses) {
      let channel = await client.channels.fetch(data.courseChannels.channels[courseID]).catch(() => undefined);
      if (channel == undefined) {
        channel = await guild.channels.create(data.courses[courseID], { 'type': 'text', 'parent': data.courseChannels.CategoryID }).catch(() =>undefined);
        channel != undefined ? data.courseChannels.channels[courseID] = channel.id : channel = undefined;
      }
    }

    await GuildService.updateCourseChannels(data.guildID, data.courseChannels);
    return true;
  }
}

export interface createChannelsData {
  guildID: string,
  courseChannels: {
    CategoryID: string,
    channels: Record<string, string>
  },
  courses: Record<string, string>
}
