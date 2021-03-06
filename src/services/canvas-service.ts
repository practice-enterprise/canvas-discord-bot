import Axios from 'axios';
import { CanvasCourse, CanvasModule, CanvasModuleItem } from '../models/canvas';

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
  static async getModules(token: string, courseID: string): Promise<CanvasModule[]> {
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
  
}
