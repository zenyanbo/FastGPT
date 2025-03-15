export enum CodeClassNameEnum {
  guide = 'guide',
  questionGuide = 'questionGuide',
  mermaid = 'mermaid',
  echarts = 'echarts',
  quote = 'quote',
  files = 'files',
  latex = 'latex',
  iframe = 'iframe',
  html = 'html',
  video = 'video',
  audio = 'audio'
}

export const mdTextFormat = (text: string) => {
  // First handle direct LaTeX blocks with $$ syntax
  text = text
    // Ensure display math has line breaks around it
    .replace(/([^\n])\$\$([\s\S]*?)\$\$([^\n])/g, '$1\n$$\n$2\n$$\n$3')
    .replace(/([^\n])\$\$([\s\S]*?)\$\$/g, '$1\n$$\n$2\n$$')
    .replace(/\$\$([\s\S]*?)\$\$([^\n])/g, '$$\n$1\n$$\n$2')
    // Handle blocks where content is on the same line as delimiters
    .replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
      // If content doesn't have line breaks, add them
      if (!content.includes('\n')) {
        return `$$\n${content}\n$$`;
      }
      return match;
    });

  // Legacy handling for \[ and \( LaTeX syntax
  const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  text = text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
    if (codeBlock) {
      return codeBlock;
    } else if (squareBracket) {
      return `$$\n${squareBracket}\n$$`;
    } else if (roundBracket) {
      return `$${roundBracket}$`;
    }
    return match;
  });

  // Handle quote formatting and other cleanups
  text = text
    .replace(/\[quote:?\s*([a-f0-9]{24})\](?!\()/gi, '[$1](QUOTE)')
    .replace(/\[([a-f0-9]{24})\](?!\()/g, '[$1](QUOTE)');

  // Add spaces between URLs and Chinese punctuation
  text = text.replace(/(https?:\/\/[^\s，。！？；：、]+)([，。！？；：、])/g, '$1 $2');

  return text;
};
