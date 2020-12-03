import { MessageEmbedOptions } from 'discord.js';
import { Tokenizer } from './util/tokenizer';

type Command = { name: string, aliases: string[], response: (tokenizer: Tokenizer) => string | MessageEmbedOptions };

export const commands: Command[] = [
  {
    name: 'roll',
    aliases: [],
    response(tokenizer: Tokenizer): string | MessageEmbedOptions {
      const match = (/^(\d+)?d(\d+)$/gm).exec(tokenizer.tokens[1]?.content);
      if (match) {
        const times = Number(match[1]) > 0 ? Number(match[1]) : 1;
        const dice = [];
        for (let i = 0; i < times; i++) {
          dice.push(Math.floor(Math.random() * Number(match[2]) + 1));
        }
  
        if(times === 1) {
          return `Rolled a ${dice[0]}`;
        } else {
          return `Dice: ${dice.join(', ')}\nTotal: ${dice.reduce((p, c) => p + c, 0)}`;
        }
      } else {
        return 'no valid die found, e.g. \'3d6\'';
      }
    }
  }
];
