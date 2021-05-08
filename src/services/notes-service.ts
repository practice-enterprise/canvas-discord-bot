import Axios from 'axios';
import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { Notes } from '../models/notes';
import { Command, Response } from '../models/command';
import { GuildConfig } from '../models/guild';
import { Logger } from '../util/logger';
import { Tokenizer } from '../util/tokenizer';
import { Formatter } from '../util/formatter';

export class NotesService {
  private prefix: string;
  private command: Command;

  constructor(command: Command, prefix: string){
    this.command = command;
    this.prefix = prefix;
  }

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

  async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
    const tokenizer = new Tokenizer(msg.content, this.prefix);

    //!notes - get notes in channel
    if (tokenizer.tokens.length === 1) {
      if(guildConfig) {
        return this.getByChannel(msg.channel.id.toString(), guildConfig.id)
          .catch((err) => {Logger.error(err); return;});
      }
      else {
        return this.getByUser(msg.author.id)
          .catch((err) => {Logger.error(err); return;});
      }
    }

    if (guildConfig) {
      //!notes #channel - get notes for a channel
      if (tokenizer.tokens[1]?.type === 'channel') { 
        return this.getByChannel(tokenizer.tokens[1].content.substr(2, 18), guildConfig.id)
          .catch((err) => {Logger.error(err); return;});
      }
      //!notes add #channel - adds this note
      if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1]?.content === 'add' && tokenizer.tokens[2]?.type === 'channel' && tokenizer.tokens[3]?.type === 'text') {
        await this.setChannelNote(tokenizer.body(3), tokenizer.tokens[2].content.substr(2, 18), guildConfig.id)
          .catch((err) => {Logger.error(err); return;});
        return `Note '${tokenizer.body(2)}' got succesfully added to the channel ` + tokenizer.tokens[1].content;
      }
      //!notes add
      if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1]?.content === 'add' && tokenizer.tokens[2]?.type === 'text') {
        await this.setChannelNote(tokenizer.body(2), msg.channel.id, guildConfig.id)
          .catch((err) => {Logger.error(err); return;});
        return `Note '${tokenizer.body(2)}' got succesfully added to this channel.`;
      }
    }
    else {
      // DM/user
      if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1]?.content === 'add' && tokenizer.tokens[2]?.type === 'text') {
        await this.setUserNote(tokenizer.body(2), msg.author.id)
          .catch((err) => {Logger.error(err); return;});
        return `Note '${tokenizer.body(2)}' got succesfully added to the channel ` + tokenizer.tokens[1].content;
      }
    }
    
    //!notes remove <channel> <number>
    if(guildConfig) {
      if (!(msg.member?.hasPermission('ADMINISTRATOR'))) {
        return 'You have to be an admin to delete notes.';
      }

      if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1].content === 'remove'
        && tokenizer.tokens[2]?.type === 'channel' && tokenizer.tokens[3]?.type === 'text') {
        const noteNum: number = parseInt(tokenizer.tokens[3].content);
        return this.delChannelNote(noteNum, tokenizer.tokens[2].content.substr(2, 18), guildConfig.id)
          .catch((err) => {Logger.error(err); return;});
      }

      if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1].content === 'remove' &&
        tokenizer.tokens[2]?.type === 'text') {
        const noteNum: number = parseInt(tokenizer.tokens[2].content);
        return this.delChannelNote(noteNum, msg.channel.id, guildConfig.id)
          .catch((err) => {Logger.error(err); return;});
      }
    }
    else {
      if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1].content === 'remove' && tokenizer.tokens[2]?.type === 'text') {
        const noteNum: number = parseInt(tokenizer.tokens[2].content);
        return this.delUserNote(noteNum, msg.author.id)
          .catch((err) => {Logger.error(err); return;});
      }
    }
    // When incorrectly used (includes !notes help)
    return new MessageEmbed({
      title: 'Help for notes',
      description: new Formatter()
        .command(`${this.prefix}${this.command.name} #channel (optional)`).text(': get notes from your favourite channel', true)
        .command(`${this.prefix}${this.command.name} add #channel (optional)`).text(': enter an epic note in a channel', true)
        .command(`${this.prefix}${this.command.name} remove #channel (optional) notenumber`).text(': Remove a note in a channel', true)
        .build(),
      color: 'F04747',
      footer: {text:'Also works in direct messages.'}
    });
  }
  

  async getByChannel(channelID: string, guildID: string): Promise<Response> {
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

  async setChannelNote(note: string, channelID: string, guildID: string): Promise<void> {
    const notes = await NotesService.get(guildID);
    
    // When a guild doesnt have notes at all yet
    if (notes == null || notes.notes == null) {
      const newNotes: Notes = {
        id: guildID,
        notes: {
          [channelID]: [note],
        }
      };
      
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
    return await NotesService.update(notes);
  }

  async delChannelNote(noteNum: number, channelID: string, guildID: string): Promise<Response> {
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

  async getByUser(userID: string): Promise<Response> {
    const notes = await NotesService.get(userID);
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
  
  async setUserNote(note: string, userID: string): Promise<void> {
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
  
  async delUserNote(noteNum: number, userID: string): Promise<Response> {
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

