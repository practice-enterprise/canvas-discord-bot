export type TokenType = 'command' | 'text' | 'user' | 'role' | 'channel';
export type Token = {
  type: TokenType,
  content: string,
};

const matchers: { type: TokenType, regex: RegExp }[] = [
  { type: 'user', regex: /<@!?\d{18}>/ },
  { type: 'role', regex: /<@&\d{18}>/ },
  { type: 'channel', regex: /<#\d{18}>/ },
];

/** parses given content into tokens seperated by spaces
 * 
 * tokens can be retrieved from the tokens property
 */
export class Tokenizer {
  /** Tokens extracted from content
   * 
   * Available types: text, user, role, channel, command
   */
  tokens: Token[];

  constructor(
    private content: string,
    private serverConfig: { prefix: string }
  ) {
    this.tokens = [];
    this.parse();
  }

  private parse(): void {
    for (const content of this.content.split(' ')) {
      if (content.trim() === '') {
        continue; // ignore double space situations
      }

      if (content.startsWith(this.serverConfig.prefix)) {
        this.tokens.push({ type: 'command', content: content.substr(this.serverConfig.prefix.length) });
      } else {
        const matcher = matchers.find(m => content.match(m.regex));
        if (matcher) {
          this.tokens.push({ type: matcher.type, content });
        } else {
          this.tokens.push({ type: 'text', content });
        }
      }
    }
  }

  /** get command name, will return undefined if it's an invalid command */
  command(): string | undefined {
    const token: Token | undefined = this.tokens[0];
    return token?.type === 'command' ? token.content : undefined;
  }

  /** return raw body after command or full if it's not a valid command */
  body(): string {
    if (this.command()) {
      return this.tokens.slice(1).map((t) => t.content).join(' ');
    } else {
      return this.content;
    }
  }
}
