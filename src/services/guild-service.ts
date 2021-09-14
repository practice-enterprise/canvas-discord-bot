import Axios from 'axios';
import { CourseChannels, GuildConfig } from '../models/guild';
import { commands } from '../commands';

//default modules


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
        canvasInstanceID: '',
        info: [],
        roles: roles,
        modules: this.getModules(),
        courseChannels: {
          categoryID: null,
          channels: {},
        }

      }
    }).then((res) => res.data);
  }

  static async updateModules(guildID: string): Promise<Record<string, boolean>> {
    const modules: Record<string, boolean> = this.getModules();
    Axios.request<number>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/guilds/modules',
      data: {
        id: guildID,
        modules: modules
      }
    });
    return modules;
  }

  static getModules(): Record<string, boolean> {
    const modules: Record<string, boolean> = {};
    for (const c of commands) {
      modules[c.category] = true;
    }
    modules['customCommands'] = true;
    modules['announcements'] = true;
    modules['roleSync'] = true;
    return modules;
  }

  static async updateRole(guildID: string, roleID: string, roleKey: string): Promise<string> {
    const config = await this.getForId(guildID);
    config.roles[roleKey] = roleID;
    return this.update(config);
  }
}

