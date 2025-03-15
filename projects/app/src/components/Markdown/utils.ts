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
  // First handle existing $$ LaTeX blocks to ensure consistent formatting
  text = text.replace(
    /(```[\s\S]*?```|`.*?`)|(\$\$)([\s\S]*?)(\$\$)/g, 
    (match, codeBlock, startDelim, content, endDelim) => {
      if (codeBlock) return codeBlock;
      if (startDelim && endDelim) {
        // Normalize LaTeX block with proper line breaks if needed
        const trimmedContent = content.trim();
        // For multi-line content, ensure proper formatting
        if (trimmedContent.includes('\n')) {
          return `\n$$\n${trimmedContent}\n$$\n`;
        }
        // For inline content, keep it on the same line
        return `$$${trimmedContent}$$`;
      }
      return match;
    }
  );

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
