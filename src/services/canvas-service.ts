import Axios from 'axios';
import { CanvasCourse, CanvasInstance, CanvasModule, CanvasModuleItem } from '../models/canvas';
import token from '../../token.json';

export class CanvasService {
  // # Canvas instance
  static async getInstanceForId(id: string): Promise<CanvasInstance> {
    return Axios.request<CanvasInstance>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${id}`,
    }).then((res) => res.data);
  }

  static async updateInstance(canvasInstance: CanvasInstance): Promise<string> {
    return Axios.request<string>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/canvas',
      data: canvasInstance
    }).then((res) => res.data);
  }

  static async getCourses(discordUserID: string): Promise<CanvasCourse[] | undefined> {
    return Axios.request<CanvasCourse[]>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${discordUserID}/courses`,
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }

  static async getInstanceId(discordUserID: string): Promise<string | undefined> {
    return Axios.request<string>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${discordUserID}/instanceId`,
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }

  static async getModules(discordUserID: string, courseID: number): Promise<CanvasModule[] | undefined> {
    return Axios.request<CanvasModule[]>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${discordUserID}/courses/${courseID}/modules`,
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }

  static async getModuleItems(discordUserID: string, itemURL: string): Promise<CanvasModuleItem[] | undefined> {
    return Axios.request<CanvasModuleItem[]>({
      headers: {
        Authorization: `bearer ${token.token}`,
        itemurl: itemURL
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/canvas/${discordUserID}/items/` + encodeURIComponent(itemURL),
      validateStatus: () => true,
    }).then((res) => {
      return res.status === 200 ? res.data : undefined;
    });
  }
}
