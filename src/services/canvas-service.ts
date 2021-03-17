import Axios from 'axios';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { stringify } from 'querystring';
import TurndownService from 'turndown';
import { CanvasAnnouncement, CanvasCourse, CanvasInstance, CanvasModule, CanvasModuleItem } from '../models/canvas';
import { GuildService } from './guild-service';

export class CanvasService {
  // # Canvas instance
  static async getInstanceForId(id: string): Promise<CanvasInstance> {
    return Axios.request<CanvasInstance>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${id}`,
    }).then((res) => res.data);
  }

  static async updateInstance(canvasInstance: CanvasInstance): Promise<string> {
    return Axios.request<string>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/canvas',
      data: canvasInstance
    }).then((res) => res.data);
  }

  // # get data from canvas API
  static async getCourses(token: string): Promise<CanvasCourse[]> {
    return Axios.request<CanvasCourse[]>({
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: { per_page: '50' },
      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/courses'
    }).then((res) => res.data);
  }

  static async getModules(token: string, courseID: number): Promise<CanvasModule[]> {
    return Axios.request<CanvasModule[]>({
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        include: ['items, content_details']
      },

      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: `/api/v1/courses/${courseID}/modules`
    }).then((res) => res.data);
  }

  static async getModuleItems(token: string, itemURL: string): Promise<CanvasModuleItem[]> {
    return Axios.request<CanvasModuleItem[]>({
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        include: ['items', 'content_details']
      },

      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: itemURL
    }).then((res) => res.data);
  }

  // # Announcements job
  // ## get last (default: 10) announcements
  static async getAnnouncements(token: string, courseID: number): Promise<CanvasAnnouncement[]> {
    // context_codes param supports arrays.
    // console.log(Array.isArray(courseID));

    return Axios.request<CanvasAnnouncement[]>({
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        context_codes: ['course_' + courseID]
      },

      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/announcements'
    }).then((res) => res.data);
  }


  static async buildAnnouncementEmbed(announcement: CanvasAnnouncement, courseID: number, token: string): Promise<MessageEmbed> {
    const ts = new TurndownService();

    const courses = await CanvasService.getCourses(token);
    const course = courses.find(c => c.id === courseID);

    const postedTime = new Date(announcement.posted_at);
    const postTimeString = postedTime.getHours() + ':' + postedTime.getMinutes() + ' • ' + postedTime.getDate() + '/' + (postedTime.getMonth() + 1) + '/' + postedTime.getFullYear();

    const embed = new MessageEmbed({
      color: '#E63F30',
      title: announcement.title,
      url: announcement.html_url,
      author: {
        name: course?.course_code + ' - ' + announcement.author.display_name
      },
      description: ts.turndown(announcement.message),
      footer: {
        text: postTimeString
      }
    });
    return embed;
  }


  // ## Checking announcements for changes
  // TODO: check rate limits. Currently 1 minute. We want this as low as is allowed.
  // TODO: Loop through all guildconfigs.
  static initAnnouncementJob(CanvasInstanceId: string, client: Client, guildID: string): NodeJS.Timeout {
    return setInterval(async () => {
      const instance = await this.getInstanceForId(CanvasInstanceId);
      const guildConfig = await GuildService.getForId(guildID);

      console.log('Canvas domain: ', instance.endpoint);

      if (process.env.CANVAS_TOKEN === undefined) {
        console.log('Token undefined.');
        return;
      }

      // Canvas Instance for announcements is undefined or empty
      if (instance.lastAnnounce === undefined || (stringify(instance.lastAnnounce) === stringify({}))) {
        instance.lastAnnounce = {};
        this.updateInstance(instance);
      }

      // TODO: Delay for ratelimit
      for (const courseID in guildConfig.courseChannels.channels) {
        // TODO: grab a valid token from a user for courseID
        // Maybe?: call for mutliple courses once instead of for each course (courseID[])
        const announcements = await this.getAnnouncements(process.env.CANVAS_TOKEN, parseInt(courseID));

        console.log('length ', announcements.length);
        console.log('courseID:', courseID);

        // There are no announcements
        if (announcements.length === 0) {
          console.log('No announcements for this subject');
          continue;
        }

        // No channel is set for a course.
        if (guildConfig.courseChannels.channels[courseID].length === 0) {
          console.error('No channelID was set for this course in the config!');
          continue;
        }

        // Last announcement ID is undefined
        if (instance.lastAnnounce[parseInt(courseID)] === undefined) {
          console.log('No lastAnnounceID set. Posting last announcement and setting ID.');

          const embed = await this.buildAnnouncementEmbed(announcements[0], parseInt(courseID), process.env.CANVAS_TOKEN);
          (client.guilds.resolve(guildConfig._id)?.channels.resolve(guildConfig.courseChannels.channels[courseID]) as TextChannel)
            .send(embed)
            .then(() => {
              instance.lastAnnounce[parseInt(courseID)] = announcements[0].id;
              this.updateInstance(instance);
              console.log('Updated!');
            });

          continue;
        }


        console.log('Checking announcements for courseID', courseID);

        const lastAnnounceID = instance.lastAnnounce[parseInt(courseID)];
        const index = announcements.findIndex(a => a.id === lastAnnounceID);

        if (index === 0) {
          console.log('Already last announcement.');
        }
        else {
          console.log('New announcement(s)!');

          for (let i = index - 1; i >= 0; i--) {
            console.log('Posting: ' + announcements[i].title);

            const embed = await this.buildAnnouncementEmbed(announcements[i], parseInt(courseID), process.env.CANVAS_TOKEN)
              .catch(() => {
                console.error('Couldn\'t make announcement embed. Invalid announcement obj, courseID and/or token?');
              });

            if (embed !== undefined) {
              (client.guilds.resolve(guildConfig._id)?.channels.resolve(guildConfig.courseChannels.channels[courseID]) as TextChannel)
                .send(embed)
                .catch(() => {
                  console.error('Couldn\'t post announcement. Likely wrong channel/guildID.');
                });
            }
          }

          // Update the lastAnnounceID
          instance.lastAnnounce[parseInt(courseID)] = announcements[0].id;
          this.updateInstance(instance);

          console.log('Last announcements are now: ', instance.lastAnnounce);
        }
      }

      // // Loop with delay, perhaps for ratelimits
      // (function Loop (i) {
      //   setTimeout(function () {
      //     console.log(i);
      //     if (--i) {       
      //       Loop(i);       
      //     }
      //   }, 30);
      // })(10);
    }, 60000);
  }
}
