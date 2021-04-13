import Axios from 'axios';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { AssignmentDM, isUserTarget, Reminder } from '../models/reminder';


export class ReminderService {
  static async delete(reminder: Reminder): Promise<void> {
    await Axios.request<Reminder>({
      method: 'DELETE',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static async create(reminder: Omit<Reminder, 'id'>): Promise<void> {
    await Axios.request<void>({
      method: 'POST',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static sendReminder(reminder: Reminder, client: Client): void {
    try {
      if (!isUserTarget(reminder.target)) {
        (client.channels.resolve(reminder.target.channel) as TextChannel)
          .send('reminder: ' + reminder.content);
      } else {
        client.users.resolve(reminder.target.user)?.send(reminder.content);//TODO 
      }
    } catch (err) {
      console.error(err);
    } finally {
      ReminderService.delete(reminder);
    }
  }

  static async sendAssignment(data: AssignmentDM, client: Client){
    const user =  await client.users.fetch('223928391559151618');
    await user?.send(new MessageEmbed({'title': data.title, 'description': data.description}))
    .catch((err)=> console.error(err));
    await this.updateLastAssignment(data.id, data.assignmentID)
      .catch((err)=>console.log(err));
  }

  static async updateLastAssignment(userID: string, lastAssignment: string){
    return Axios.request<void>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: `/reminders/${userID}/${lastAssignment}`,
    });
  }
}
