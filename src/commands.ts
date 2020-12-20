import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { Tokenizer } from './util/tokenizer';
import { command, Formatter } from './util/formatter';
import { DateTime } from 'luxon';
import { Command } from './models/command';
import { GuildConfig } from './models/guild';
import { GuildService } from './services/guild-service';
import { ReminderService } from './services/reminder-service';
import { mesh } from './app';


export const commands: Command[] = [
  { // help
    name: 'help',
    description: 'that\'s this command.',
    aliases: ['how', 'wtf', 'man', 'get-help'],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      const help: MessageEmbedOptions = {
        'title': 'Help is on the way!',
        'description': commands.concat(guildConfig.commands).map(c => `\`${guildConfig.prefix}${c.name}\`: ${c.description}`).join('\n'),
        'color': '43B581',
        'footer': { text: 'Some commands support putting \'help\' behind it.' }
      };
      return help;
    }
  },
  { // ping
    name: 'ping',
    description: 'play the most mundane ping pong ever with the bot.',
    aliases: [],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      //const delay = new Date().getMilliseconds() - new Date(message.createdTimestamp).getMilliseconds();
      return new Formatter().text('Pong! :ping_pong:')
        //.command(delay+' ms to receive.')
        .build();
    }
  },
  { // roll
    name: 'roll',
    description: 'rolls a die or dice (eg d6, 2d10, d20 ...).',
    aliases: [],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      const tokenizer = new Tokenizer(message.content, guildConfig);

      const match = (/^(\d+)?d(\d+)$/gm).exec(tokenizer.tokens[1]?.content);
      if (match) {
        const times = Number(match[1]) > 0 ? Number(match[1]) : 1;
        const dice = [];
        for (let i = 0; i < times; i++) {
          dice.push(Math.floor(Math.random() * Number(match[2]) + 1));
        }

        if (times === 1) {
          return `Rolled a ${dice[0]}`;
        } else {
          return `Dice: ${dice.join(', ')}\nTotal: ${dice.reduce((p, c) => p + c, 0)}`;
        }
      } else {
        return 'no valid die found, e.g. \'3d6\'';
      }
    }
  },
  { //coinflip
    name: 'coinflip',
    description: 'heads or tails?',
    aliases: ['coin', 'flip', 'cf'],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      const tokenizer = new Tokenizer(message.content, guildConfig);
      const flip = Math.round(Math.random());
      const embed = new MessageEmbed()
        .setTitle(flip ? 'Heads! :coin:' : 'Tails! :coin:');

      if (tokenizer.tokens.length === 1) {
        return embed;
      }
      else if (tokenizer.tokens[1]?.content == 'heads' || tokenizer.tokens[1]?.content == 'h') {
        return flip == 1 ? (embed.setDescription('You\'ve won! :tada:')) : (embed.setDescription('You\'ve lost...'));
      }
      else if (tokenizer.tokens[1]?.content == 'tails' || tokenizer.tokens[1]?.content == 't') {
        return flip == 0 ? (embed.setDescription('You\'ve won! :tada:')) : (embed.setDescription('You\'ve lost...'));
      }
      else {
        return 'Try with heads (h) or tails (t) instead!';
      }
    }
  },
  { // prefix
    name: 'prefix',
    description: 'Set prefix for guild',
    aliases: ['pf'],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      const tokenizer = new Tokenizer(message.content, guildConfig);

      if (!message.member?.hasPermission('ADMINISTRATOR')) {
        return 'No admin permissions!';
      }

      if (tokenizer.tokens[1] != undefined && tokenizer.tokens[1].type === 'text' && message.guild?.id != undefined) {
        setPrefix(tokenizer.tokens[1].content, message.guild?.id);
        return 'Prefix update with: ' + tokenizer.tokens[1].content;
      }
      else {
        return 'Use like `prefix newPrefix`';
      }
    }
  },
  { // default
    name: 'default',
    description: 'sets the default channel',
    aliases: [],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      const tokenizer = new Tokenizer(message.content, guildConfig);
      if (tokenizer.tokens[1]?.type === 'channel') {
        return tokenizer.tokens[1].content; //TODO stash in db of server
      } else {
        return 'this is not a valid channel';
      }
    }
  },
  { // notes
    name: 'notes',
    description: 'set or get notes for channels',
    aliases: ['note'],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      const tokenizer = new Tokenizer(message.content, guildConfig);
      //!notes #channel adds this note
      if (tokenizer.tokens[1]?.type === 'channel' && tokenizer.tokens[2]?.type === 'text') {
        //TODO write notes to DB
        return `Pretend '${tokenizer.body(2)}' got succesfully added to the DB (for now).`;

      }
      //!notes #channel - get notes for a channel
      else if (tokenizer.tokens[1]?.type === 'channel') {
        return getNotes(tokenizer.tokens[1].content.substr(2, 18), guildConfig);
      }
      //!notes - get notes in channel
      else if (tokenizer.tokens.length === 1) {
        return getNotes(message.channel.id.toString(), guildConfig);
      }
      //When incorrectly used (includes !notes help)
      else {
        return new Formatter()
          .bold('Help for ' + command(guildConfig.prefix + 'notes'), true)
          .command(guildConfig.prefix + 'notes').text(': get notes from your current channel', true)
          .command(guildConfig.prefix + 'notes #channel').text(': get notes from your favourite channel', true)
          .command(guildConfig.prefix + 'notes #channel an amazing note').text(': Enter a note in a channel', true)
          .build();
      }
    }
  },
  { // reminder
    name: 'reminder',
    description: 'set reminders default channel = current, command format: date desc channel(optional) \n\'s. supported formats: d/m/y h:m, d.m.y h:m, d-m-y h:m',
    aliases: ['remindme', 'remind', 'setreminder'],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {

      const tokenizer = new Tokenizer(message.content, guildConfig);
      const dateFormates: string[] = ['d/m/y h:m', 'd.m.y h:m', 'd-m-y h:m'];

      for (const format of dateFormates) {
        let time;
        if (tokenizer.tokens[1] && tokenizer.tokens[2] && tokenizer.tokens[1].type == 'date' && tokenizer.tokens[2].type == 'time') {
          time = DateTime.fromFormat(tokenizer.tokens[1].content + ' ' + tokenizer.tokens[2].content, format);
        } else {
          time = undefined;
        }
        if (time && time.isValid) {
          ReminderService.create({
            content: tokenizer.tokens.filter((t) => t.type === 'text').map((t) => t.content).join(' '),
            date: time.toString(),
            target: {
              channel: tokenizer.tokens.find((t) => t.type === 'channel')?.content.substr(2, 18) || message.channel.id,
              guild: message.guild!.id
            },
          });

          return 'your reminder has been set as: ' + time.toString();
        }
      }
      return 'this was not a valid date/time format';
    }
  },
  { // status
    name: 'status',
    description: 'get bot status',
    aliases: [],
    response(message: Message, guildConfig: GuildConfig): string | MessageEmbedOptions | MessageEmbed {
      return {
        fields: [{ name: 'shard', value: `${mesh?.shard?.shard}` }, {name: 'health', value: `${mesh?.health}/3` }]
      };
    }
  }
];

function getNotes(channelID: string, guildConfig: GuildConfig) {
  // TODO send something else when channel doesnt have notes (rn simply undefined)
  let i = 0;
  const embed: MessageEmbedOptions = {
    'title': 'Notes',
    'description': `Notes for channel <#${channelID}>:\n`
      + guildConfig.notes[channelID]?.map((note: string) => ++i + ' • ' + note).join('\n'),
    'footer': { text: `For help: ${guildConfig.prefix}notes help` }
  };

  return embed;
}

async function setPrefix(prefix: string, guildID: string): Promise<void> {
  const config = await GuildService.getForId(guildID);
  config.prefix = prefix;
  await GuildService.update(config);
}
