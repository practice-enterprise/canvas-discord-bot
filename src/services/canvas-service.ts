import Axios from 'axios';
import { CanvasCourse } from '../models/canvas';

export class CanvasService {
  static async getCourses(token: string): Promise<CanvasCourse[]> {
    return Axios.request<CanvasCourse[]>({
      headers: { 
        Authorization: `Bearer ${token}` 
      },

      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/courses'
    }).then((res) => res.data);
  }

  static async updateCourse(courseData: CanvasCourse, courseID: string, token: string): Promise<string> {
    console.log('test');
    return Axios.request<string>({
      headers: { 
        Authorization: `Bearer ${token}` 
      },

      method: 'PUT',
      baseURL: process.env.CANVAS_URL,
      url: `/api/v1/courses/${courseID}`,
      data: courseData
    }).then((res) => res.data);
  }
}
