import Axios from 'axios';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { Notes } from '../models/notes';
import { Command, Response } from '../models/command';
import { GuildConfig } from '../models/guild';
import { Logger } from '../util/logger';
import { Tokenizer } from '../util/tokenizer';
import { Colors, EmbedBuilder } from '../util/embed-builder';

export class NotesService {
  private interaction: CommandInteraction;

  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
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

    // ////////
    // const tokenizer = new Tokenizer(msg.content, this.prefix);

    // //!notes - get notes in channel
    // if (tokenizer.tokens.length === 1) {
    //   if (guildConfig) {
    //     return this.getByChannel(msg.channel.id.toString(), guildConfig.id);
    //   }
    //   else {
    //     return this.getByUser(msg.author.id);
    //   }
    // }

    // if (guildConfig) {
    //   //!notes #channel - get notes for a channel
    //   if (tokenizer.tokens[1]?.type === 'channel') {
    //     return this.getByChannel(tokenizer.tokens[1].content.substr(2, 18), guildConfig.id);
    //   }
    //   //!notes add #channel - adds this note
    //   if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1]?.content === 'add' && tokenizer.tokens[2]?.type === 'channel' && tokenizer.tokens[3]?.type === 'text') {
    //     return this.setChannelNote(tokenizer.body(3), tokenizer.tokens[2].content.substr(2, 18), guildConfig.id);
    //   }
    //   //!notes add
    //   if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1]?.content === 'add' && tokenizer.tokens[2]?.type === 'text') {
    //     return this.setChannelNote(tokenizer.body(2), msg.channel.id, guildConfig.id);
    //   }
    // }
    // else {
    //   // DM/user
    //   if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1]?.content === 'add' && tokenizer.tokens[2]?.type === 'text') {
    //     return this.setUserNote(tokenizer.body(2), msg.author.id);
    //   }
    // }

    // ////////

    // //!notes remove <channel> <number>
    // if (guildConfig) {
    //   if (!(msg.member?.permissions.has(['ADMINISTRATOR'], true))) {
    //     return 'You have to be an admin to delete notes.';
    //   }

    //   if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1].content === 'remove'
    //     && tokenizer.tokens[2]?.type === 'channel' && tokenizer.tokens[3]?.type === 'text') {
    //     const noteNum: number = parseInt(tokenizer.tokens[3].content);
    //     return this.delChannelNote(noteNum, tokenizer.tokens[2].content.substr(2, 18), guildConfig.id);
    //   }

    //   if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1].content === 'remove' &&
    //     tokenizer.tokens[2]?.type === 'text') {
    //     const noteNum: number = parseInt(tokenizer.tokens[2].content);
    //     return this.delChannelNote(noteNum, msg.channel.id, guildConfig.id);
    //   }
    // }
    // else {
    //   if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1].content === 'remove' && tokenizer.tokens[2]?.type === 'text') {
    //     const noteNum: number = parseInt(tokenizer.tokens[2].content);
    //     return this.delUserNote(noteNum, msg.author.id);
    //   }
    // }
    // When incorrectly used (includes !notes help)
    // return EmbedBuilder.buildHelp(this.command, this.prefix, Colors.error, {
    //   '#channel (optional)': 'get notes from a channel or DM.',
    //   'add #channel (optional)': 'enter a note in a channel or DM.',
    //   'remove #channel (optional) notenumber': 'remove a note in a channel or DM.'
    // }, ['add #cooking-stuff Eggs', 'add a note here', 'remove #cooking-stuff 1']);
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
    if (noteNum > 0 && noteNum <= notes.notes[channelID].length) {
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
}
