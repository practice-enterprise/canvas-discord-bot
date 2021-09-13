import { ColorResolvable, MessageEmbed } from 'discord.js';
import { Command } from '../models/command';

export enum Colors {
  info = '#4FAFEF',
  success = '#3BA55D', // old '#43B581',
  warning = '#FAA61A',
  error = '#ED4245', // old '#F04747',
  gray = '#747F8D',
  discord = '5865F2', // old accent color '#7289DA',
  canvas = '#E73D30'
}

export class EmbedBuilder {
  static success(description: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':white_check_mark: Succes!' : `:white_check_mark: ${title}`;
    return new MessageEmbed({
      color: Colors.success,
      title: Title,
      description: description,
      footer: { text: footer }
    });
  }

  static info(description: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':information_source: Info' : `:information_source: ${title}`;
    return new MessageEmbed({
      color: Colors.info,
      title: Title,
      description: description,
      footer: { text: footer }
    });
  }

  static warn(reason?: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':warning: Warning' : `:warning: ${title}`;
    return new MessageEmbed({
      color: Colors.warning,
      title: Title,
      description: reason,
      footer: { text: footer }
    });
  }

  static error(reason?: string, footer?: string, title?: string): MessageEmbed {
    const Title = title == null ? ':octagonal_sign: Error!' : `:octagonal_sign: ${title}`;
    return new MessageEmbed({
      color: Colors.error,
      title: Title,
      description: reason,
      footer: { text: footer }
    });
  }

  static buildHelp(command: Command, prefix: string, typeColor: Colors, params: Record<string, string> | string[], examples: string[], footer?: string): MessageEmbed {
    let paramVal = '';

    if (Array.isArray(params)) {
      paramVal = params.map((par) => `\`${prefix}${command.name} ${par}\``).join('\n');
    }
    else {
      for (const key in params) {
        paramVal += `\`${prefix}${command.name} ${key}\`: ${params[key]}\n`;
      }
    }

    return new MessageEmbed({
      color: typeColor,
      title: `Help for ${prefix}${command.name}`,
      description: command.description,
      fields: [
        { name: '**Usage**', value: paramVal },
        { name: '**Examples:**', value: examples.map((eg) => `${prefix}${command.name} ${eg}`).join('\n') },
      ],
      footer: { text: footer }
    });
  }

  static buildList(typeColor: Colors | ColorResolvable, title: string, items: Record<string, string> | string[], description?: string, footer?: string, url?: string): MessageEmbed {
    let i = 0;
    if (description == null) {
      description = '';
    }

    if (Array.isArray(items)) {
      description += '\n' + items.map((item) => `\`${++i}\` • **${item}**`).join('\n');
    }
    else {
      for (const key in items) {
        description += `\n\`${++i}\` • **${key}**${items[key].length == 0 ? '' : '\n' + items[key]}`;
      }
    }

    return new MessageEmbed({
      color: typeColor,
      title: title,
      description: description,
      footer: { text: footer },
      url: url
    });
  }
}
