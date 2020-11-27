/* # Allows for easier formatting in messages

Example to use:
const mySecretMessage: string = new Formatter()
      .bold('Code block', true) // true for newline, default false
      .escape('```').append('c')
      .append('printf("Hello world!");')
      .escape('```')
      .codeblock('c', 'printf("Hello world!");')
      .append('You can also write commands like this:')
      .escape('`sudo make me sandwhich`').text(' -> ').command('sudo make me sandwhich')
      .build();
*/

export class Formatter {
  private body: string;

  constructor() {
    this.body = '';
  }

  build(): string {
    return this.body;
  }

  append(val: string): this {
    this.body = `${this.body}${val}\n`;
    return this;
  }

  text(val: string): this {
    this.body = `${this.body}${val}`;
    return this;
  }

  bold(val: string, nl = false): this {
    return nl ? this.append(bold(val)) : this.text(bold(val));
  }

  italic(val: string, nl = false): this {
    return nl ? this.append(italic(val)) : this.text(italic(val));
  }

  underline(val: string, nl = false): this {
    return nl ? this.append(underline(val)) : this.text(underline(val));
  }

  strikethrough(val: string, nl = false): this {
    return nl ? this.append(strikethrough(val)) : this.text(strikethrough(val));
  }

  spoiler(val: string, nl = false): this {
    return nl ? this.append(spoiler(val)) : this.text(spoiler(val));
  }

  codeblock(lang: string, val: string): this {
    return this.append(codeblock(lang, val));
  }

  command(val: string): this {
    return this.text(command(val));
  }

  escape(val: string): this {
    return this.text(escape(val));
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
  //https://regex101.com/r/o5VvwW/3
  return val.replace(/`/g, '\\`').replace(/\*/g, '\\*');
}
