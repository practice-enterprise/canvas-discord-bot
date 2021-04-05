import { Client, MessageEmbed } from 'discord.js';

export class AnnouncementService {
  static async postAnnouncement(announcement: any, client: Client): Promise<void> {
    const channel = await client.channels.cache.get(announcement.channelID);
    if (channel !== undefined && channel.isText()) {
      channel.send(new MessageEmbed(announcement.embed));
    }
  }
}
