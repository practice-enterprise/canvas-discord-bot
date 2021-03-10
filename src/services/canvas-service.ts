import Axios from 'axios';
import { CanvasAnnouncement, CanvasCourse, CanvasModule, CanvasModuleItem } from '../models/canvas';

export class CanvasService {
  // # Courses
  static async getCourses(token: string): Promise<CanvasCourse[]> {
    return Axios.request<CanvasCourse[]>({
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      params: { per_page: '100'},
      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/courses'
    }).then((res) => res.data);
  }

  // # Modules
  static async getModules(token: string, courseID: number): Promise<CanvasModule[]> {
    return Axios.request<CanvasModule[]>({
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      params: {
        include: [ 'items, content_details' ]
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
  
  // # Announcements
  // ## get (10) announcements
  static async getAnnouncements(token: string, courseID: number | string | string[]): Promise<CanvasAnnouncement[]> {
    return Axios.request<CanvasAnnouncement[]>({
      headers: { 
        Authorization: `Bearer ${token}` 
      },
      params: {
        context_codes: ['course_'+courseID]
      },

      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/announcements'
    }).then((res) => res.data);
  }

  // ## get announcements table for latest id and channels
  // static async get(): Promise<anc[]> {
  //   return Axios.request<anc[]>({
  //     method: 'GET',
  //     baseURL: process.env.API_URL,
  //     url: '/anc'
  //   }).then((res) => res.data);
  // }

  // ## Checking announcements for changes
  // static initAnnouncementJob(client: Client): NodeJS.Timeout {
  //   return setInterval(async function () {
  //     client.users.
  //   }, 30000);
  // }
}
