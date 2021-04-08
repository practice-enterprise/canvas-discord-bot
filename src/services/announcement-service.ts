import { Client, MessageEmbed } from 'discord.js';

export class AnnouncementService {
  static async postAnnouncement(announcement: any, client: Client): Promise<void> {
    const channel = await client.channels.fetch(announcement.channelID);
    if (channel.isText()) {
      channel.send(new MessageEmbed(announcement.embed));
    }
  }
}
