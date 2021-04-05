import Axios from 'axios';
import { Config } from '../models/config';

export class ConfigService {
  static async get(): Promise<Config> {
    return Axios.request<Config>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: '/config'
    }).then((res) => res.data);
  }

  static async update(config: Config): Promise<string> {
    return Axios.request<string>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/config',
      data: config
    }).then((res) => res.data);
  }
}
