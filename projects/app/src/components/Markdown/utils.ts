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
  // Handle LaTeX blocks with proper line breaks
  text = text.replace(
    /(\${2,})([^\$]*?)(\${2,})/gs,
    (match, startDelim, content, endDelim) => {
      const trimmedContent = content.trim();
      // If the content has line breaks, ensure proper formatting
      if (trimmedContent.includes('\n')) {
        return `\n$$\n${trimmedContent}\n$$\n`;
      }
      // For inline content, keep it on the same line
      return `$$${trimmedContent}$$`;
    }
  );

  // Handle standalone $$ delimiters on their own lines
  text = text.replace(/^\s*\$\$\s*$/gm, (match) => {
    return '\n$$\n';
  });

  // Then handle \[...\] and \(...\) format
  const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  text = text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
    if (codeBlock) {
      return codeBlock;
    } else if (squareBracket) {
      return `$$${squareBracket}$$`;
    } else if (roundBracket) {
      return `$${roundBracket}$`;
    }
    return match;
  });

  // Process quotes and other markdown elements
  text = text
    .replace(/\[quote:?\s*([a-f0-9]{24})\](?!\()/gi, '[$1](QUOTE)')
    .replace(/\[([a-f0-9]{24})\](?!\()/g, '[$1](QUOTE)');

  // Handle links followed by Chinese punctuation
  text = text.replace(/(https?:\/\/[^\s，。！？；：、]+)([，。！？；：、])/g, '$1 $2');

  return text;
};
