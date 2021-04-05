import Axios from 'axios';
import { CanvasCourse, CanvasInstance, CanvasModule, CanvasModuleItem } from '../models/canvas';

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
}
