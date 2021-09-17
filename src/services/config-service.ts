import Axios from 'axios';
import { Config } from '../models/config';
import token from '../../token.json';

export class ConfigService {
  static async get(): Promise<Config> {
    return Axios.request<Config>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: '/config'
    }).then((res) => res.data);
  }

  static async update(config: Config): Promise<string> {
    return Axios.request<string>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/config',
      data: config
    }).then((res) => res.data);
  }
}
