import Axios from 'axios';
import { CourseChannels, GuildConfig } from '../models/guild';

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

  static async updateCourseChannels(guildID: string, courseChannels: CourseChannels): Promise<string> {
    const config = await this.getForId(guildID);
    config.courseChannels = courseChannels;
    return this.update(config);
  }

  static async createDefault(guildID: string, roles: Record<string, string>): Promise<string> {
    return Axios.request<string>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/guilds/create',
      data: {
        id: guildID,
        commands: [],
        canvasInstanceID: '',
        info: [],
        prefix: '!',
        roles: roles,
        modules: {
          'announcements': false, //API d
          'courses': false, //bot d
          'customCommands': false, //bot d
          'misc': false, //bot d
          'notes': false, //bot d
          'reminders': false, //bot d
          'roleSync': false, //API  
          'wiki': false, //bot d
        },
        courseChannels: {
          categoryID: null,
          channels: {},
        }

      }
    }).then((res) => res.data);
  }
}
