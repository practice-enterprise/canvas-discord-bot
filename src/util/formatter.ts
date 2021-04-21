import { MessageEmbedOptions } from 'discord.js';

/**Allows for easier formatting in Discord messages. \
 * Read ../docs/formatterts.md for more info.
 * @example
 * new Formatter()
      .bold(underline('Title: Code block'), true) // true for newline, default false
      .escape('```').text('c', true)
      .text('printf("Hello world!");', true)
      .escape('```')
      .codeblock('c', 'printf("Hello world!");')
      .text('You can also write commands like this:', true)
      .escape('`sudo make me sandwhich`').text(' -> ').command('sudo make me sandwhich').text('.')
      .build() //returns as string
 */
export class Formatter {
  private body: string;

  constructor() {
    this.body = '';
  }

  /** Return as string
  */
  build(): string {
    return this.body;
  }

  /** Create text.
   * @param {string} text - create text
   * @param {boolean} newline - append a new line
  */
  text(val: string, nl = false): this {
    this.body = nl ? `${this.body}${val}\n` : `${this.body}${val}`;
    return this;
  }

  /** Create bold text.
   * @param {string} text - create bold text
   * @param {boolean} newline - append a new line
  */
  bold(val: string, nl = false): this {
    return this.text(bold(val), nl);
  }

  /** Create italic text.
   * @param {string} text - create italic text
   * @param {boolean} newline - append a new line
  */
  italic(val: string, nl = false): this {
    return this.text(italic(val), nl);
  }

  /** Create underlined text.
   * @param {string} text - create underlined text
   * @param {boolean} newline - append a new line
  */
  underline(val: string, nl = false): this {
    return this.text(underline(val), nl);
  }

  /** Create strikethrough text.
   * @param {string} text - create strikethrough text
   * @param {boolean} newline - append a new line
  */
  strikethrough(val: string, nl = false): this {
    return this.text(strikethrough(val), nl);
  }

  /** Create spoiler text.
   * @param {string} text - create spoiler text
   * @param {boolean} newline - append a new line
  */
  spoiler(val: string, nl = false): this {
    return this.text(spoiler(val), nl);
  }

  /** Create spoiler text.
   * @param {string} language - set code language (c, sql, js ...)
   * @param {boolean} code
  */
  codeblock(lang: string, val: string): this {
    return this.text(codeblock(lang, val), true);
  }

  /** Create spoiler text.
   * @param {string} command - create an inline command
   * @param {boolean} newline - append a new line
  */
  command(val: string, nl = false): this {
    return this.text(command(val), nl);
  }

  /** Escapes characters such as `, *, |, ~, _ with \
   * @param {string} text - text to escape
   * @param {boolean} newline - append a new line
   * @example '**Bold**, __underline__, `command`' -> '\*\*Bold\*\*, \_\_underline\_\_, \`command\`'
  */
  escape(val: string, nl = false): this {
    return this.text(escape(val), nl);
  }
}

export function bold(val: string): string {

  return `**${val}**`;
}

export function italic(val: string): string {
  return `*${val}*`;
}

export function underline(val: string): string {
  return `__${val}__`;
}

export function strikethrough(val: string): string {
  return `~~${val}~~`;
}

export function spoiler(val: string): string {
  return `||${val}||`;
}

export function codeblock(lang: string, val: string): string {
  return `\n\`\`\`${lang}\n${val}\n\`\`\``;
}

export function command(val: string): string {
  return `\`${val}\``;
}

export function escape(val: string): string {
  return val
    .replace(/`/g, '\\`') //backticks for codeblocks and commands
    .replace(/\*/g, '\\*') //italic and bold
    .replace(/\|\|/g, '\\||') //spoiler
    .replace(/~~/g, '\\~~') //strikethrough
    .replace(/_/g, '\\_');  //underline
}

/**Will cut content if too long to prevent the message to be too long for discord.
 * Consider using the .trim() method on string messages instead
 * @param content string or embed to trim if too long
 * @param maxLength Max length of string/embed description
 * @param append string to append trimmed content
 */
export function preventExceed(content: string, maxLength?: number, append?: string): string;
export function preventExceed(content: MessageEmbedOptions, maxLength?: number, append?: string): MessageEmbedOptions;
export function preventExceed(content: string | MessageEmbedOptions, maxLength = 2000, append = ' ...'): string | MessageEmbedOptions {
  if (maxLength > 2000)
    maxLength = 2000;
  if (typeof content == 'string') {
    return content.length > maxLength ? content.slice(0, maxLength - append.length).concat(append) : content;
  }
  // https://discord.com/developers/docs/resources/channel#embed-limits
  else {
    if (content.description != null && content.description.length > maxLength)
      content.description = content.description.slice(0, maxLength - append.length).concat(append);

    if (content.title != null && content.title.length > 256)
      content.title = content.title.slice(0, 256 - append.length).concat(append);

    if (content.footer?.text != null && content.footer.text.length > 256)
      content.footer.text = content.footer.text.slice(0, 256 - append.length).concat(append);

    if (content.author?.name != null && content.author.name.length > 256)
      content.author.name = content.author.name.slice(0, 256 - append.length).concat(append);

    if (content.fields != null) {
      if (content.fields.length > 25)
        content.fields = content.fields.slice(0, 25);
      // TODO check length of field object entries
      // content.fields.forEach(field => {
      // });
    }

    return content;
  }
}
