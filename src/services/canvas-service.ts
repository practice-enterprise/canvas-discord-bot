import Axios from 'axios';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { stringify } from 'querystring';
import TurndownService from 'turndown';
import { CanvasAnnouncement, CanvasCourse, CanvasInstance, CanvasModule, CanvasModuleItem } from '../models/canvas';
import { GuildService } from './guild-service';
import { UserService } from './user-service';

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

  static async getCourses(canvasInstanceID: string, discordUserID: string): Promise<CanvasCourse[] | undefined> {
    return Axios.request<CanvasCourse[]>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${canvasInstanceID}/${discordUserID}/courses`,
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }

  static async getModules(canvasInstanceID: string, discordUserID: string, courseID: number): Promise<CanvasModule[] | undefined> {
    return Axios.request<CanvasModule[]>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${canvasInstanceID}/${discordUserID}/courses/${courseID}/modules`,
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }

  static async getModuleItems(canvasInstanceID: string, discordUserID: string, itemURL: string): Promise<CanvasModuleItem[] | undefined> {
    return Axios.request<CanvasModuleItem[]>({
      headers: {
        itemurl: itemURL
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${canvasInstanceID}/${discordUserID}/items/` + encodeURIComponent(itemURL),
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }

  // # Announcements job
  // ## get last (default: 10) announcements
  static async getAnnouncements(canvasInstanceID: string, discordUserID: string, courseID: string): Promise<CanvasAnnouncement[] | undefined> {
    return Axios.request<CanvasAnnouncement[]>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${canvasInstanceID}/${discordUserID}/courses/${courseID}/announcements`,
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }


  static async buildAnnouncementEmbed(announcement: CanvasAnnouncement, courseID: string, canvasInstanceID: string, discordUserID: string): Promise<MessageEmbed> {
    const ts = new TurndownService();

    const courses = await CanvasService.getCourses(canvasInstanceID, discordUserID);
    if (courses === undefined) {
      throw new Error('Courses not defined. Likely invaled or undefined token from users.');
    }
    const course = courses.find(c => c.id === parseInt(courseID));
    
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
  static initAnnouncementJob(CanvasInstanceID: string, client: Client, guildID: string): NodeJS.Timeout {
    return setInterval(async () => {
      const canvas = await this.getInstanceForId(CanvasInstanceID);
      const guildConfig = await GuildService.getForId(guildID);

      //console.log('Canvas domain: ', instance.endpoint);

      if (process.env.CANVAS_TOKEN === undefined) {
        console.log('Token undefined.');
        return;
      }

      // Canvas Instance for announcements is undefined or empty
      if (canvas.lastAnnounce === undefined || (stringify(canvas.lastAnnounce) === stringify({}))) {
        canvas.lastAnnounce = {};
        this.updateInstance(canvas);
      }

      // TODO: Delay for ratelimit
      for (const courseID in guildConfig.courseChannels.channels) {
        const user = await UserService.getForCourse(courseID);

        if (user === undefined) { console.error('No user was found for subject ', courseID); continue;}

        // Maybe?: call for mutliple courses once instead of for each course (courseID[])
        // FIX: The random user we took may not have a token
        
        //= this.getAnnouncements(CanvasInstanceID, user.discord.id, courseID)
        //.catch((err) => {throw err;});
        const announcements = await this.getAnnouncements(CanvasInstanceID, user.discord.id, courseID);
        if (announcements === undefined) {
          throw new Error('Announcements undefined. Likely invaled or undefined token from users.');
        }

        //console.log('length ', announcements.length);
        //console.log('courseID:', courseID);

        // There are no announcements
        if (announcements.length === 0) {
          //console.log('No announcements for this subject');
          continue;
        }

        // No channel is set for a course.
        if (guildConfig.courseChannels.channels[courseID].length === 0) {
          console.error('No channelID was set for this course in the config!');
          continue;
        }

        // Last announcement ID is undefined
        if (canvas.lastAnnounce[parseInt(courseID)] === undefined) {
          console.log('No lastAnnounceID set. Posting last announcement and setting ID.');

          const embed = await this.buildAnnouncementEmbed(announcements[0], courseID, CanvasInstanceID, user.discord.id);
          (client.guilds.resolve(guildConfig._id)?.channels.resolve(guildConfig.courseChannels.channels[courseID]) as TextChannel)
            .send(embed)
            .then(() => {
              canvas.lastAnnounce[parseInt(courseID)] = announcements[0].id;
              this.updateInstance(canvas);
              console.log('Updated!');
            });

          continue;
        }


        //console.log('Checking announcements for courseID', courseID);

        const lastAnnounceID = canvas.lastAnnounce[parseInt(courseID)];
        const index = announcements.findIndex(a => a.id === lastAnnounceID);

        if (index === 0) {
          //console.log('Already last announcement.');
        }
        else {
          console.log('New announcement(s)!');

          for (let i = index - 1; i >= 0; i--) {
            console.log('Posting: ' + announcements[i].title);

            const embed = await this.buildAnnouncementEmbed(announcements[i], courseID, CanvasInstanceID, user.discord.id)
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
          canvas.lastAnnounce[parseInt(courseID)] = announcements[0].id;
          this.updateInstance(canvas);

          console.log('Last announcements are now: ', canvas.lastAnnounce);
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
