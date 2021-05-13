import { MessageEmbed } from 'discord.js';
import { Command } from '../models/command';

//type Color = 'info' | 'success' | 'warning' | 'error' | 'gray' | 'discord' | 'canvas';

export enum Colors {
  info = '4FAFEF',
  success = '43B581',
  warning = 'FAA61A',
  error = 'F04747',
  gray = '747F8D',
  discord = '7289DA',
  canvas = 'E73D30'
}

export class EmbedBuilder {
  success(description: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':white_check_mark: Succes!' : `:white_check_mark: ${title}`;
    return new MessageEmbed({
      color: Colors.success,
      title: Title,
      description: description,
      footer: {text: footer}
    });
  }

  info(description: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':information_source: Info' : `:information_source: ${title}`;
    return new MessageEmbed({
      color: Colors.info,
      title: Title,
      description: description,
      footer: {text: footer}
    });
  }

  warn(reason?: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':warning: Warning' : `:warning: ${title}`;
    return new MessageEmbed({
      color: Colors.warning,
      title: Title,
      description: reason,
      footer: {text: footer}
    });
  }

  error(reason?: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':octagonal_sign: Error!' : `:octagonal_sign: ${title}`;
    return new MessageEmbed({
      color: Colors.error,
      title: Title,
      description: reason,
      footer: {text: footer}
    });
  }

  buildHelp(command: Command, prefix: string, typeColor: Colors, params: Record<string, string> | string[], examples: string[], footer?: string): MessageEmbed {
    let paramVal = '';

    if (Array.isArray(params)) {
      paramVal = params.map((par) => `\`${prefix}${command.name} ${par}`).join('\n');
    }
    else {
      for (const key in params) {
        paramVal += `\`${prefix}${command.name} ${key}:\` ${params[key]}\n`;
      }
    }

    return new MessageEmbed({
      color: typeColor,
      title: `Help for ${prefix}${command.name}`,
      description: command.description,
      fields: [
        {name: '**Usage**', value: paramVal},
        {name: '**Examples:**', value: examples.map((eg) => `${prefix}${command.name} ${eg}`).join('\n')},
      ],
      footer: {text: footer }
    });
  }

  buildList(typeColor: Colors, title: string, items: Record<string, string> | string[], description?:string, footer?: string): MessageEmbed {
    let i = 0;
    if (description == null) {
      description = '';
    }

    if (Array.isArray(items)) {
      description += '\n' + items.map((item) => `\`${++i}\` • **${item}**`).join('\n');
    }
    else {
      for (const key in items) {
        description += `\n\`${++i}\` • **${key}**\n${items[key]}`;
      }
    }

    return new MessageEmbed({
      color: typeColor,
      title: title,
      description: description,
      footer: {text: footer }
    });
  }
}