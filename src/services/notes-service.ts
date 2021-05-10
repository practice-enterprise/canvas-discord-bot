import Axios from 'axios';
import { MessageEmbedOptions } from 'discord.js';
import { GuildConfig } from '../models/guild';
import { Notes } from '../models/notes';
import { Response } from '../models/command';

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
      url: '/notes',
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

  static async getByChannel(channelID: string, guildConfig: GuildConfig): Promise<Response> {
    const notes = await NotesService.get();
    const guildNotes = notes.find(n => n.id === guildConfig.id);

    if (guildNotes?.id === undefined || guildNotes.notes[channelID] === undefined || guildNotes.notes[channelID].length === 0) {
      const embed: MessageEmbedOptions = {
        title: 'Notes',
        description: 'No notes for this channel.',
        footer: { text: `For help: ${guildConfig.prefix}notes help` }
      };
      return embed;
    }
    else {
      let i = 0;
      const embed: MessageEmbedOptions = {
        title: 'Notes',
        description: `Notes for channel <#${channelID}>:\n`
          + guildNotes?.notes[channelID].map((note: string) => ++i + ' • ' + note).join('\n'),
        footer: { text: `For help: ${guildConfig.prefix}notes help` },
      };
      return embed;
    }
  }

  static async setNote(note: string, channelID: string, guildConfig: GuildConfig): Promise<void> {
    const notes = await NotesService.get();
    const guildNotes = notes.find(n => n.id === guildConfig.id);
  
    // When a server/guild doesnt have notes at all yet
    if (guildNotes === undefined) {
      const newNotes: Notes = {
        id: guildConfig.id,
        notes: {
          channelID: [note]
        }
      };
      return await NotesService.create(newNotes);
    }
  
    // When a server has notes
    if (guildNotes.notes[channelID] === undefined) {
      guildNotes.notes[channelID] = []; // create empty array if channel doesnt have notes yet
    }
  
    guildNotes.notes[channelID].push(note);
    return await NotesService.update(guildNotes);
  }

  static async delNote(noteNum: number, channelID: string, guildConfig: GuildConfig): Promise<Response> {
    const notes = await NotesService.get();
    const guildNotes = notes.find(n => n.id === guildConfig.id);
  
    // Checks if notes exist, checks if noteNum is in range
    if ( guildNotes !== undefined && !isNaN(noteNum) && noteNum > 0 && noteNum <= guildNotes.notes[channelID].length) {
      guildNotes.notes[channelID].splice(noteNum - 1, 1);
      await NotesService.update(guildNotes);
      return `Removed note \`${noteNum}\``;
    } else {
      return 'Failed to remove note, validate command';
    }
  }
}
