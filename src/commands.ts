import { Message, MessageEmbedOptions } from 'discord.js';
import { Tokenizer } from './util/tokenizer';
import { Formatter } from './util/formatter';

type Command = { name: string, description: string, aliases: string[], response: (message: Message, guildConfig: any) => string | MessageEmbedOptions };

export const commands: Command[] = [
  {
    name: 'help',
    description: 'That\'s this command.',
    aliases: [],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions {
      const help = new Formatter().bold('Available commands:', true)
        .text(commands.concat(guildConfig.commands).map( c => '`' + guildConfig.prefix + c.name + ':` ' + c.description).join('\n'))
        .build();
      return help;
    }
  },
  {
    name: 'roll',
    description: 'rolls a die or dice (eg d6, 2d10, d20 ...).',
    aliases: [],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions {
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
    name: 'default',
    description: 'sets the default channel',
    aliases: [],
    response(message: Message, guildConfig: any): string | MessageEmbedOptions {
      const tokenizer = new Tokenizer(message.content, guildConfig);
      if (tokenizer.tokens[1]?.type === 'channel') {
        return tokenizer.tokens[1].content; //TODO stash in db of server
      }
      else {
        return 'this is not a valid channel';
      }
    }
  }
];
