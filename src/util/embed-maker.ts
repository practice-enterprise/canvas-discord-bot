import { MessageEmbed } from 'discord.js';
import { Command } from '../models/command';

type Color = 'info' | 'success' | 'warning' | 'error' | 'gray' | 'discord' | 'canvas';

export const colors = {
  'info': '4FAFEF',
  'success': '43B581',
  'warning': 'FAA61A',
  'error': 'F04747',
  'gray': '747F8D',
  'discord': '7289DA',
  'canvas': 'E73D30'
};

export class EmbedMaker {
  private command: Command;
  private prefix: string;

  constructor(command: Command, prefix: string) {
    this.command = command;
    this.prefix = prefix;
  }

  success(description: string, title?: string): MessageEmbed {
    const Title = title == null ? ':white_check_mark: Succes!' : `:white_check_mark: ${title}`;
    return new MessageEmbed({
      color: colors.success,
      title: Title,
      description: description
    });
  }

  info(description: string, title?: string): MessageEmbed {
    const Title = title == null ? ':information_source: Info' : `:information_source: ${title}`;
    return new MessageEmbed({
      color: colors.info,
      title: Title,
      description: description
    });
  }

  warn(reason?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':warning: Warning' : `:warning: ${title}`;
    return new MessageEmbed({
      color: colors.warning,
      title: Title,
      description: reason
    });
  }

  error(reason?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':octagonal_sign: Error!' : `:octagonal_sign: ${title}`;
    return new MessageEmbed({
      color: colors.error,
      title: Title,
      description: reason
    });
  }

  buildHelp(typeColor: Color, params: Record<string, string> | string[], examples: string[], footer?: string): MessageEmbed {
    let paramVal = '';

    if (Array.isArray(params)) {
      paramVal = params.map((par) => `\`${this.prefix}${this.command.name} ${par}`).join('\n');
    }
    else {
      for (const key in params) {
        paramVal += `\`${this.prefix}${this.command.name} ${key}:\` ${params[key]}`;
      }
    }

    return new MessageEmbed({
      color: colors[typeColor],
      title: `Help for ${this.prefix}${this.command.name}`,
      description: this.command.description,
      fields: [
        {name: '**Usage**', value: paramVal},
        {name: '**Examples:**', value: examples.map((eg) => `${this.prefix}${this.command.name} ${eg}`).join('\n')},
      ],
      footer: {text: footer }
    });
  }

  buildList(typeColor: Color, title: string, items: Record<string, string> | string[], description?:string, footer?: string): MessageEmbed {
    let i = 0;
    if (description == null) {
      description = '';
    }

    if (Array.isArray(items)) {
      description += '\n\n' + items.map((item) => `\`${++i}\` • **${item}**`).join('\n');
    }
    else {
      for (const key in items) {
        description += `\n\n\`${++i}\` • **${key}**\n${items[key]}`;
      }
    }

    return new MessageEmbed({
      color: colors[typeColor],
      title: title,
      description: description,
      footer: {text: footer }
    });
  }
  
}
