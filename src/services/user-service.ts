import Axios from 'axios';
import { User } from '../models/users';

export class UserService {
  static async getForDiscord(discordID: string): Promise<User> {
    return Axios.request<User>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/users/discord/${discordID}`
    }).then((res) => res.data);
  }

  static async getForCanvas(canvasID: string): Promise<User> {
    return Axios.request<User>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/users/canvas/${canvasID}`
    }).then((res) => res.data);
  }

  /* Doesn't work yet, needs indexer.*/
  static async getForCourse(courseID: string): Promise<User> {
    return Axios.request<User>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/users/course/${courseID}`
    }).then((res) => res.data);
  }

  static async update(user: User): Promise<string> {
    return Axios.request<string>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/users',
      data: user
    }).then((res) => res.data);
  }
}
