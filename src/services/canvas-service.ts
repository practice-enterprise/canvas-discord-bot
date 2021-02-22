import Axios from 'axios';
import { CanvasCourses } from '../models/canvas';

export class CanvasService {
  static async getCourses(token: string): Promise<CanvasCourses[]> {
    return Axios.request<CanvasCourses[]>({
      headers: { 
        Authorization: `Bearer ${token}` 
      },

      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/courses'
    }).then((res) => res.data);
  }

  static async updateCourses(token: string, config: CanvasCourses): Promise<string> {
    return Axios.request<string>({
      headers: { 
        Authorization: `Bearer ${token}` 
      },

      method: 'PUT',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/courses',
      data: config
      
    }).then((res) => res.data);
  }
}
