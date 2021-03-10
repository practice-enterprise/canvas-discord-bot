import Axios from 'axios';
import { stringify } from 'querystring';
import { CanvasAnnouncement, CanvasCourse, CanvasInstance, CanvasModule, CanvasModuleItem } from '../models/canvas';

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
      params: { per_page: '100' },
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
  static async getAnnouncements(token: string, courseID: number | string | string[]): Promise<CanvasAnnouncement[]> {
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

  // ## Checking announcements for changes
  // TODO: Loop through all courses and post msg in corresponding channels
  // TODO: check rate limits. Currently 1 minute. We want this as low as is allowed.
  static initAnnouncementJob(CanvasInstanceId: string): NodeJS.Timeout {
    return setInterval(async () => {
      const courseID = 1; //temp for testing, needs to check for all courses not just one

      const instance = await this.getInstanceForId(CanvasInstanceId);
      console.log(instance.endpoint);

      if (process.env.CANVAS_TOKEN === undefined) {
        console.log('Token undefined.');
        return;
      }

      const announcements = await this.getAnnouncements(process.env.CANVAS_TOKEN, courseID);

      // Undefined or empty
      if (instance.lastAnnounce === undefined || (stringify(instance.lastAnnounce) === stringify({}))) {
        instance.lastAnnounce = {};
        instance.lastAnnounce[courseID] = announcements[0].id;
        this.updateInstance(instance);
      }
      else {
        const lastAnnounceID = instance.lastAnnounce[courseID];
        const index = announcements.findIndex(a => a.id === lastAnnounceID);

        if (index === 0) {
          console.log('Already last announcement');
        }
        else {
          console.log('New announcement(s)!');

          for (let i = index - 1; i >= 0; i--) {
            console.log('Pretend to post: ' + announcements[i].title);
          }

          instance.lastAnnounce[courseID] = announcements[0].id;
          console.log('Last announcement is now: ', instance.lastAnnounce);
          this.updateInstance(instance);
        }
      }
    }, 60000);
  }
}
