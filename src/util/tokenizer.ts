export type TokenType = 'command' | 'text' | 'user' | 'role' | 'channel' | 'date' | 'datetime' | 'time';
export type Token = {
  type: TokenType,
  content: string,
};

const matchers: { type: TokenType, regex: RegExp }[] = [
  { type: 'user', regex: /<@!?\d{18}>/ },
  { type: 'role', regex: /<@&\d{18}>/ },
  { type: 'channel', regex: /<#\d{18}>/ },
  //{ type: 'datetime', regex: /\d{1,2}[-]\d{1,2}[-](\d{2,4})?[Tt]\d{1,2}:\d{1,2}/ },
  { type: 'date', regex: /\d{1,2}[/-]\d{1,2}[/-](\d{2,4})?/ },
  { type: 'time', regex: /\d{1,2}:\d{1,2}/ },
];

/** parses given content into tokens seperated by spaces
 * 
 * tokens can be retrieved from the tokens property
 */
export class Tokenizer {
  /** Tokens extracted from content
   * 
   * Available types: text, user, role, channel, datetime, date, time, command 
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

  /** return raw body after command or full if it's not a valid command
   * @param start  (default = 1) from where it's starts to include (0 = command, default doesnt include it)
   * @example .body() everything after the command
   * @example .body(2) if a command has a parameter this wouldnt return that parameter
  */
  body(start = 1): string {
    if (this.command()) {
      return this.tokens.slice(start).map((t) => t.content).join(' ');
    } else {
      return this.content;
    }
  }
}
