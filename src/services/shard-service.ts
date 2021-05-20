import { Client } from 'discord.js';
import { connect } from 'socket.io-client';
import { buildClient } from '../discord';
import { AssignmentDM, GuildReminder, UserReminder } from '../models/reminder';
import { CreateChannelsData } from '../models/channel-creation-data';
import { AnnouncementService } from './announcement-service';
import { ChannelCreationService } from './channel-creation-service';
import { ReminderService } from './reminder-service';
import { RoleUpdateData } from '../models/role-update-data';
import { RoleAssignmentService } from './role-assignment-service';
import { AnnouncementData } from '../models/announcement-data';


export class ShardService {
  socket: SocketIOClient.Socket
  client?: Client;
  reminderJob?: NodeJS.Timeout;
  announcementJob?: NodeJS.Timeout;

  constructor(public apiURI: string) {
    this.socket = connect(apiURI, {
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 1000, // do not increase time between attempts 
      autoConnect: false
    });

    this.socket.on('connect', (socket: SocketIOClient.Socket) => {
      // TODO: socket undefined at this point?
      // console.log(`connected to api with ID ${socket.id}`);
    });

    this.socket.on('system', async (str: string) => {
      const msg = JSON.parse(str);
      if (msg.opcode == 0) {
        // FIX: client starts 2 shards if a reconnect request was sent before the first client was done building
        console.log(`reconnecting as shard ${msg.data.number} of ${msg.data.total}`);
        this.destroy();
        await this.build(msg);
      } else if (msg.opcode == 1) {
        console.error('received disconnect request');
        this.destroy();
        process.exit(1);
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.error('lost connection to api, closing');
      this.client?.destroy();
      process.exit(2);
    });

    this.socket.connect();

    this.socket.on('updateRoles', (data: RoleUpdateData) => {
      if (this.client !== undefined)
        RoleAssignmentService.updateRoles(data, this.client)
          .catch((err) => console.log(err));
    });

    this.socket.on('announcement', (data: AnnouncementData) => {
      if (this.client !== undefined)
        AnnouncementService.postAnnouncement(data, this.client);
    });

    this.socket.on('reminderGuild', (data: GuildReminder) => {
      if (this.client !== undefined)
        ReminderService.sendGuildReminder(data, this.client);
    });

    this.socket.on('reminderUser', (data: UserReminder) => {
      if (this.client !== undefined)
        ReminderService.sendUserReminder(data, this.client);
    });

    this.socket.on('assignmentDM', (data: AssignmentDM) => {
      if (this.client !== undefined)
        ReminderService.sendAssignment(data, this.client);
    });

    this.socket.on('createChannels', (data: CreateChannelsData) => {
      if (this.client !== undefined) {
        ChannelCreationService.createChannels(data, this.client)
          .catch(err => console.log(err));
      }
    });
  }

  private async build(msg: any): Promise<void> {
    this.client = await buildClient(msg.data.number, msg.data.total);
    //this.announcementJob = CanvasService.initAnnouncementJob('a40d37b54851efbcadb35e68bf03d698', this.client, '780572565240414208'); //Hard coded for now.
  }

  private destroy(): void {
    this.client?.destroy();
    if (this.announcementJob) {
      clearInterval(this.announcementJob);
    }
  }
}
