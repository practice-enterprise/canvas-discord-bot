# Formatter class
Makes formatting messages for Discord easy to use/read in code.

## Example
```ts
    new Formatter()
      .bold(underline('Title: Code block'), true) // true for newline, default false
      .escape('```').text('c', true)
      .text('printf("Hello world!");', true)
      .escape('```')
      .codeblock('c', 'printf("Hello world!");')
      .text('You can also write commands like this:', true)
      .escape('`sudo make me sandwhich`').text(' -> ').command('sudo make me sandwhich').text('.')
      .build() //returns as string
```
Output: 
````
**__Title: Code block__** 
\`\`\`c 
printf("Hello world!"); 
\`\`\`
```c
printf("Hello world!");
```
You can also write commands like this:
\`sudo make me sandwhich\` -> `sudo make me sandwhich`.
````

## Formatting
### Text
`.text('text', nl?)` \
`.bold('bold text', nl?)` \
`.italic('italic text', nl?)` \
`.underline('underline text', nl?)` \
`.strikethrough('strikethrough text', nl?)` \
`.spoiler('spoiler text', nl?)` \
\
`nl` or newline is an optional parameter (default: false) that appends a newline. \
This makes writing titles or appending text easy.

### Code
`.codeblock('language', 'code')` \
`.command('inline command', nl?)` 

### Escaping characters
Easily escapes \`, *, |, ~, _ characters in the input text. \
`.command('**_Escape_** this ||text||!', nl?)`

### Build string
`.build()` is placed at the end to return the formatting as a string.
