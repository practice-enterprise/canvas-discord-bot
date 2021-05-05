import Axios from 'axios';
import { MessageEmbedOptions } from 'discord.js';
import { Notes } from '../models/notes';
import { Response } from '../models/command';

export class NotesService {
  static async get(id: string): Promise<Notes | undefined> {
    return Axios.request<Notes | undefined>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/notes/${id}`
    }).then((res) => res.data)
      .catch(() => undefined);
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

  static async getByChannel(channelID: string, guildID: string): Promise<Response> {
    const notes = await NotesService.get(guildID);
    if (notes == null || Array.isArray(notes.notes) || notes.notes[channelID]?.length == null) {
      const embed: MessageEmbedOptions = {
        title: 'Notes',
        description: 'No notes for this channel.',
        footer: { text: 'For help: notes help' }
      };
      return embed;
    }
    else {
      let i = 0;
      const embed: MessageEmbedOptions = {
        title: 'Notes',
        description: `Notes for channel <#${channelID}>:\n`
          + notes.notes[channelID].map((note: string) => ++i + ' • ' + note).join('\n'),
        footer: { text: 'For help: notes help' },
      };
      return embed;
    }
  }

  static async setChannelNote(note: string, channelID: string, guildID: string): Promise<void> {
    const notes = await NotesService.get(guildID);
    
    // When a guild doesnt have notes at all yet
    if (notes == null || notes.notes == null) {
      const newNotes: Notes = {
        id: guildID,
        notes: {
          [channelID]: [note],
        }
      };
      console.log('new', newNotes);
      
      return await NotesService.update(newNotes);
    }
  
    if (Array.isArray(notes.notes)) {
      throw Error('Notes is an array, not a Record (likely user notes instead of guildnotes).');
    }
    
    // When a server has notes
    if (notes.notes[channelID] == null) {
      notes.notes[channelID] = []; // create empty array if channel doesnt have notes yet
    }
    notes.notes[channelID].push(note);
    console.log(notes);
    return await NotesService.update(notes);
  }

  static async delChannelNote(noteNum: number, channelID: string, guildID: string): Promise<Response> {
    const notes = await NotesService.get(guildID);
  
    if (notes == null) {
      return 'There are no notes for this channel.';
    }

    if (Array.isArray(notes.notes)) {
      throw Error('Notes is an array, not a Record (likely user notes instead of guildnotes).');
    }

    // Checks if notes exist, checks if noteNum is in range
    if ( noteNum > 0 && noteNum <= notes.notes[channelID].length) {
      notes.notes[channelID].splice(noteNum - 1, 1);
      await NotesService.update(notes);
      return `Removed note \`${noteNum}\``;
    } else {
      return 'Failed to remove note, check index number';
    }
  }

  static async getByUser(userID: string): Promise<Response> {
    const notes = await NotesService.get(userID);
    console.log(notes?.notes, typeof notes?.notes, notes?.notes == null);
    if (notes == null || !Array.isArray(notes.notes) || notes.notes.length == 0) {
      const embed: MessageEmbedOptions = {
        title: 'Notes',
        description: 'No notes personal notes found.',
        footer: { text: 'For help: notes help' }
      };
      return embed;
    }
    else {
      let i = 0;
      const embed: MessageEmbedOptions = {
        title: 'Your personal notes',
        description: notes.notes.map((note) => ++i + ' • ' + note).join('\n'),
        footer: { text: 'For help: notes help' },
      };
      return embed;
    }
  }
  
  static async setUserNote(note: string, userID: string): Promise<void> {
    const notes = await NotesService.get(userID);
  
    // When a user doesnt have notes at all yet
    if (notes == null || notes.notes == null) {
      const newNotes: Notes = {
        id: userID,
        notes: [note]
      };
      return await NotesService.update(newNotes);
    }

    if (!Array.isArray(notes.notes)) {
      throw Error('Notes is not an array, Record (likely guild notes instead of user notes).');
    }

    notes.notes.push(note);
    return await NotesService.update(notes);
  }
  
  static async delUserNote(noteNum: number, userID: string): Promise<Response> {
    const notes = await NotesService.get(userID);
  

    if (notes == null) {
      return 'There are no notes for this channel.';
    }

    if (!Array.isArray(notes.notes)) {
      throw Error('Notes is not an array, Record (likely guild notes instead of user notes).');
    }
  
    // Checks if notes exist, checks if noteNum is in range
    if (noteNum > 0 && noteNum <= notes.notes.length) {
      notes.notes.splice(noteNum - 1, 1);
      await NotesService.update(notes);
      return `Removed note \`${noteNum}\``;
    } else {
      return 'Failed to remove note, check index number';
    }
  }
}

