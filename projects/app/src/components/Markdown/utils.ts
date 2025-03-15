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
  // First protect code blocks from any modification
  const codeBlocks: string[] = [];
  text = text.replace(/(```[\s\S]*?```|`[^`]*?`)/g, (match) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });

  // Handle all LaTeX notation systematically
  
  // 1. First convert \[...\] to $$...$$ format with proper line breaks
  text = text.replace(/\\\[([\s\S]*?[^\\])\\\]/g, '\n$$\n$1\n$$\n');
  
  // 2. Convert \(...\) to $...$ inline format
  text = text.replace(/\\\((.*?)\\\)/g, '$$$1$$');
  
  // 3. Standardize all $$ display math blocks
  // Start by ensuring there's a newline before and after every $$ block
  text = text.replace(/([^\n])\$\$/g, '$1\n$$');
  text = text.replace(/\$\$([^\n])/g, '$$\n$1');
  
  // 4. Ensure there are newlines between $$ and the content
  text = text.replace(/\$\$\n([^\n])/g, '$$\n\n$1');
  text = text.replace(/([^\n])\n\$\$/g, '$1\n\n$$');
  
  // Handle quote formatting and other cleanups
  text = text
    .replace(/\[quote:?\s*([a-f0-9]{24})\](?!\()/gi, '[$1](QUOTE)')
    .replace(/\[([a-f0-9]{24})\](?!\()/g, '[$1](QUOTE)');

  // Add spaces between URLs and Chinese punctuation
  text = text.replace(/(https?:\/\/[^\s，。！？；：、]+)([，。！？；：、])/g, '$1 $2');

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    text = text.replace(`__CODE_BLOCK_${i}__`, block);
  });
  
  return text;
};
