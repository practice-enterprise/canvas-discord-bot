import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { Tokenizer } from './util/tokenizer';
import { command, Formatter } from './util/formatter';

type Command = { name: string, description: string, aliases: string[], response: (message: Message, guildConfig: any) => string | MessageEmbedOptions | MessageEmbed };

export const commands: Command[] = [
  {
    name: 'help',
    description: 'that\'s this command.',
    aliases: ['how', 'wtf', 'man', 'get-help'],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions | MessageEmbed {
      const help: MessageEmbedOptions = {
        'title': 'Help is on the way!',
        'description': commands.concat(guildConfig.commands).map(c => `\`${guildConfig.prefix}${c.name}\`: ${c.description}`).join('\n'),
        'color': '43B581',
        'footer': { text: 'Some commands support putting \'help\' behind it.' }
      };
      return help;
    }
  },
  {
    name: 'ping',
    description: 'play the most mundane ping pong ever with the bot.',
    aliases: [],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions | MessageEmbed {
      //const delay = new Date().getMilliseconds() - new Date(message.createdTimestamp).getMilliseconds();
      return new Formatter().text('Pong! :ping_pong:')
        //.command(delay+' ms to receive.')
        .build();
    }
  },
  {
    name: 'roll',
    description: 'rolls a die or dice (eg d6, 2d10, d20 ...).',
    aliases: [],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions | MessageEmbed {
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
  {
    name: 'coinflip',
    description: 'heads or tails?',
    aliases: ['coin', 'flip', 'cf'],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions | MessageEmbed  {
      const tokenizer = new Tokenizer(message.content, guildConfig);
      const flip = Math.round(Math.random());
      const embed = new MessageEmbed()
        .setTitle(flip ? 'Heads! :coin:' : 'Tails! :coin:');
      
      if(tokenizer.tokens.length === 1) {
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
  {
    name: 'default',
    description: 'sets the default channel',
    aliases: [],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions | MessageEmbed {
      const tokenizer = new Tokenizer(message.content, guildConfig);
      if (tokenizer.tokens[1]?.type === 'channel') {
        return tokenizer.tokens[1].content; //TODO stash in db of server
      }
      else {
        return 'this is not a valid channel';
      }
    }
  },
  {
    name: 'notes',
    description: 'set or get notes for channels',
    aliases: ['note'],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions | MessageEmbed {
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
  {
    name: 'reminder',
    description: 'set reminders in channels or dm\'s',
    aliases: ['remindme', 'remind', 'setreminder'],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions | MessageEmbed {
      return 'your reminder has been set as: '; //TODO stach in DB and
    }
  }
];

function getNotes(channelID: string, guildConfig: any) {
  //TODO send something else when channel doesnt have notes (rn simply undefined)
  let i = 0;
  const embed: MessageEmbedOptions = {
    'title': 'Notes',
    'description': `Notes for channel <#${channelID}>:\n`
      + guildConfig.notes[channelID]?.map((note: string) => ++i + ' • ' + note).join('\n'),
    'footer': { text: `For help: ${guildConfig.prefix}notes help` }
  };
  return embed;
}
