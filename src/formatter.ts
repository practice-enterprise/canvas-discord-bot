/* # Allows for easier formatting in Discord messages

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

  text(val: string, append = false): this {
    this.body = append ? `${this.body}${val}\n` : `${this.body}${val}`;
    return this;
  }

  bold(val: string, nl = false): this {
    return this.text(bold(val), nl);
  }

  italic(val: string, nl = false): this {
    return this.text(italic(val), nl);
  }

  underline(val: string, nl = false): this {
    return this.text(underline(val), nl);
  }

  strikethrough(val: string, nl = false): this {
    return this.text(strikethrough(val), nl);
  }

  spoiler(val: string, nl = false): this {
    return this.text(spoiler(val), nl);
  }

  codeblock(lang: string, val: string): this {
    return this.text(codeblock(lang, val), true);
  }

  command(val: string, nl = false): this {
    return this.text(command(val), nl);
  }

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
  //https://regex101.com/r/o5VvwW/3
  return val
    .replace(/`/g, '\\`') //backticks for codeblocks and commands
    .replace(/\*/g, '\\*') //italic and bold
    .replace(/\|\|/g, '\\||') //spoiler
    .replace(/~~/g, '\\~~'); //strikethrough
  //underline to go
}
