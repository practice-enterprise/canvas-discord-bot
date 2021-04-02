import Axios from 'axios';
import { GuildConfig } from '../models/guild';

export class GuildService {
  static async getForId(id: string): Promise<GuildConfig> {
    return Axios.request<GuildConfig>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/guilds/${id}`
    }).then((res) => res.data);
  }

  static async update(config: GuildConfig): Promise<string> {
    return Axios.request<string>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/guilds',
      data: config
    }).then((res) => res.data);
  }

  static async setPrefix(prefix: string, guildID: string): Promise<string> {
    const config = await this.getForId(guildID);
    config.prefix = prefix;
    return this.update(config);
  }

  static async setCategoryID(categoryID: string, guildID: string): Promise<string>{
    const config = await this.getForId(guildID);
    config.courseChannels.CategoryID = categoryID;
    return this.update(config);
  }

  static async setChannel(courseID: string, channelID: string, guildID: string): Promise<string>{
    const config = await this.getForId(guildID);
    config.courseChannels.channels[courseID] = channelID;
    return this.update(config);
  }
}
