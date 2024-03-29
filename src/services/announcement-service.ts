import { Client, MessageEmbed } from 'discord.js';
import { AnnouncementData } from '../models/announcement-data';
import { preventExceed } from '../util/formatter';

export class AnnouncementService {
  static async postAnnouncement(announcement: AnnouncementData, client: Client): Promise<void> {
    const channel = await client.channels.fetch(announcement.channelID);
    if (channel && channel.isText()) {
      channel.send({ embeds: [new MessageEmbed(preventExceed(announcement.embed))]});
    }
  }
}
