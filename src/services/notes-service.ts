import Axios from 'axios';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { Notes } from '../models/notes';
import { Command, Response } from '../models/command';
import { GuildConfig } from '../models/guild';
import { Logger } from '../util/logger';
import { Tokenizer } from '../util/tokenizer';
import { Colors, EmbedBuilder } from '../util/embed-builder';
import token from '../../token.json';

export class NotesService {
  private interaction: CommandInteraction;

  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
  }

  static async get(id: string): Promise<Notes | undefined> {
    return Axios.request<Notes | undefined>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/notes/${id}`
    }).then((res) => res.data)
      .catch(() => undefined);
  }

  static async create(notes: Notes): Promise<void> {
    await Axios.request<void>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'POST',
      baseURL: process.env.API_URL,
      url: '/notes',
      data: notes
    });
  }

  static async update(notes: Notes): Promise<void> {
    return Axios.request<void>({
      headers: {
        Authorization: `bearer ${token.token}`
      },
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: '/notes',
      data: notes
    }).then((res) => res.data);
  }

  // TODO: Fix for global/dms, maybe not and leave guild
  async response(/*msg: Message, guildConfig: GuildConfig | undefined*/): Promise<void> {
    if (this.interaction.guildId == null) {
      return;
    }
    const channelInteraction = this.interaction.options.getChannel('channel', false);
    switch(this.interaction.options.getSubcommand()){
      case 'view': {
        if (channelInteraction != null && channelInteraction.type === 'GUILD_TEXT') {
          this.interaction.reply({ embeds: [ await this.getByChannel(channelInteraction.id, this.interaction.guildId)] });
        }
        else {
          this.interaction.reply({ embeds: [ await this.getByChannel(this.interaction.channelId, this.interaction.guildId)] });
        }
        break;
      }
      case 'add': {
        if (channelInteraction != null && channelInteraction.type === 'GUILD_TEXT') {
          this.interaction.reply({ embeds: [ await this.setChannelNote(this.interaction.options.getString('note', true), channelInteraction.id, this.interaction.guildId)] });
        }
        else {
          this.interaction.reply({ embeds: [ await this.setChannelNote(this.interaction.options.getString('note', true), this.interaction.channelId, this.interaction.guildId)] });
        }
        break;
      }
        break;
      case 'remove': {
        if (channelInteraction != null && channelInteraction.type === 'GUILD_TEXT') {
          this.interaction.reply({ embeds: [ await this.delChannelNote(this.interaction.options.getInteger('note', true), channelInteraction.id, this.interaction.guildId)] });
        }
        else {
          this.interaction.reply({ embeds: [ await this.delChannelNote(this.interaction.options.getInteger('note', true), this.interaction.channelId, this.interaction.guildId)] });
        }
        break;
      }
    }
  }


  async getByChannel(channelID: string, guildID: string): Promise<MessageEmbed> {
    const notes = await NotesService.get(guildID);
    if (notes == null || Array.isArray(notes.notes) || notes.notes[channelID]?.length == 0) {
      return EmbedBuilder.info('No notes found for this channel.', 'Add some notes :D', 'No notes');
    }
    else {
      return EmbedBuilder.buildList(Colors.success, 'Notes :memo:', notes.notes[channelID], `Notes for channel <#${channelID}>`);
    }
  }

  async setChannelNote(note: string, channelID: string, guildID: string): Promise<MessageEmbed> {
    const notes = await NotesService.get(guildID);

    // When a guild doesnt have notes at all yet
    if (notes == null || notes.notes == null) {
      const newNotes: Notes = {
        id: guildID,
        notes: {
          [channelID]: [note],
        }
      };

      return await NotesService.update(newNotes)
        .then(() => EmbedBuilder.success(`Note '${note}' got succesfully added to the channel <#${channelID}>`))
        .catch((err) => {
          Logger.error('Something wen\'t wrong trying to set notes. Err: ' + err);
          return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
        });
    }

    if (Array.isArray(notes.notes)) {
      Logger.error('Notes is an array, not a Record (likely user notes instead of guildnotes).');
      return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
    }

    // When a server has notes
    if (notes.notes[channelID] == null) {
      notes.notes[channelID] = []; // create empty array if channel doesnt have notes yet
    }
    notes.notes[channelID].push(note);
    return await NotesService.update(notes)
      .then(() => EmbedBuilder.success(`Note '${note}' got succesfully added to the channel <#${channelID}>`))
      .catch((err) => {
        Logger.error('Something wen\'t wrong trying to set notes. Err: ' + err);
        return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
      });
  }

  async delChannelNote(noteNum: number, channelID: string, guildID: string): Promise<MessageEmbed> {
    const notes = await NotesService.get(guildID);

    if (notes == null) {
      return EmbedBuilder.info('There are currently no notes in this channel.', 'No notes found');
    }

    if (Array.isArray(notes.notes)) {
      Logger.error('Notes is an array, not a Record (likely user notes instead of guildnotes).');
      return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
    }

    // Checks if notes exist, checks if noteNum is in range
    if (noteNum > 0 && notes.notes[channelID] && noteNum <= notes.notes[channelID].length) {
      notes.notes[channelID].splice(noteNum - 1, 1);
      return NotesService.update(notes)
        .then(() => EmbedBuilder.success(`Removed note \`${noteNum}\`.`))
        .catch((err) => {
          Logger.error('Failed to remove note. Err: ' + err);
          return EmbedBuilder.error(`Failed to remove note. \`${noteNum}\`.`);
        });
    }
    else {
      return EmbedBuilder.error(`Failed to remove note \`${noteNum}\``, 'Check your note index number.');
    }
  }

  /* Still supported by API and DB but makes mores sense to keep this a Guild command.
  async getByUser(userID: string): Promise<MessageEmbed> {
    const notes = await NotesService.get(userID);
    if (notes == null || !Array.isArray(notes.notes) || notes.notes.length == 0) {
      return EmbedBuilder.info('No notes personal notes found.', 'Add some notes :D', 'No notes');
    }
    else {
      return EmbedBuilder.buildList(Colors.success, 'Your personal notes! :memo:', notes.notes);
    }
  }

  async setUserNote(note: string, userID: string): Promise<MessageEmbed> {
    const notes = await NotesService.get(userID);

    // When a user doesnt have notes at all yet
    if (notes == null || notes.notes == null) {
      const newNotes: Notes = {
        id: userID,
        notes: [note]
      };
      return await NotesService.update(newNotes)
        .then(() => EmbedBuilder.success(`Note '${note}' got succesfully added to your notes`))
        .catch((err) => {
          Logger.error('Something wen\'t wrong trying to set notes. Err: ' + err);
          return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
        });
    }

    if (!Array.isArray(notes.notes)) {
      Logger.error('Notes is not an array, Record (likely guild notes instead of user notes).');
      return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
    }

    notes.notes.push(note);
    return await NotesService.update(notes)
      .then(() => EmbedBuilder.success(`Note '${note}' got succesfully added to your notes`))
      .catch((err) => {
        Logger.error('Something wen\'t wrong trying to set notes. Err: ' + err);
        return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
      });
  }

  async delUserNote(noteNum: number, userID: string): Promise<MessageEmbed> {
    const notes = await NotesService.get(userID);

    if (notes == null) {
      return EmbedBuilder.info('You currently don\'t have any notes.', 'No notes found');
    }

    if (!Array.isArray(notes.notes)) {
      Logger.error('Notes is not an array, Record (likely guild notes instead of user notes).');
      return EmbedBuilder.error('Something wen\'t wrong trying to set notes.');
    }

    // Checks if notes exist, checks if noteNum is in range
    if (noteNum > 0 && noteNum <= notes.notes.length) {
      notes.notes.splice(noteNum - 1, 1);
      return NotesService.update(notes)
        .then(() => EmbedBuilder.success(`Removed note \`${noteNum}\`.`))
        .catch((err) => {
          Logger.error('Failed to remove note. Err: ' + err);
          return EmbedBuilder.error(`Failed to remove note. \`${noteNum}\`.`);
        });
    }
    else {
      return EmbedBuilder.error(`'Failed to remove note \`${noteNum}\``, 'Check your note index number.');
    }
  }
  */
}
