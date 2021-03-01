import Axios from 'axios';
import { Notes } from '../models/notes';

export class NotesService {
  static async get(): Promise<Notes[]> {
    return Axios.request<Notes[]>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: '/notes'
    }).then((res) => res.data);
  }

  static async create(notes: Notes): Promise<void> {
    await Axios.request<void>({
      method: 'POST',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: notes
    });
  }

  static async update(notes: Notes): Promise<void> {
    return Axios.request<void>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/notes',
      data: notes
    }).then((res) => res.data);
  }
}
