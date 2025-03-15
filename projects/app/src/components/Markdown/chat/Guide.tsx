import React, { useMemo } from 'react';
import { Box, Link } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import RemarkGfm from 'remark-gfm';
import RemarkMath from 'remark-math';
import RehypeKatex from 'rehype-katex';
import RemarkBreaks from 'remark-breaks';
import { EventNameEnum, eventBus } from '@/web/common/utils/eventbus';

import 'katex/dist/katex.min.css';
import styles from '../index.module.scss';
import Image from '../img/Image';

function MyLink(e: any) {
  const href = e.href;
  const text = String(e.children);

  return !!href ? (
    <Link href={href} target={'_blank'}>
      {text}
    </Link>
  ) : (
    <Box as={'li'} mb={1}>
      <Box
        as={'span'}
        color={'primary.700'}
        textDecoration={'underline'}
        cursor={'pointer'}
        onClick={() => {
          eventBus.emit(EventNameEnum.sendQuestion, { text });
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

const Guide = ({ text }: { text: string }) => {
  const formatText = useMemo(() => {
    // First replace clickable links
    let processed = text.replace(/\[(.*?)\]($|\n)/g, '[$1]()');
    
    // Handle newlines outside of LaTeX blocks
    let result = '';
    let inMathBlock = false;
    const lines = processed.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count the number of '$$' in this line to track math block state
      const matches = line.match(/\$\$/g) || [];
      
      if (matches.length % 2 !== 0) {
        // Toggle the math block state when we encounter an odd number of '$$'
        inMathBlock = !inMathBlock;
      }
      
      // Append the current line
      result += line;
      
      // Only add &nbsp; if we're not inside a math block and there's a next line
      if (!inMathBlock && i < lines.length - 1) {
        result += '\n&nbsp;';
      } else if (i < lines.length - 1) {
        // Just add a normal newline in math blocks
        result += '\n';
      }
    }
    
    return result;
  }, [text]);

  return (
    <ReactMarkdown
      className={`markdown ${styles.markdown}`}
      remarkPlugins={[RemarkGfm, RemarkMath, RemarkBreaks]}
      rehypePlugins={[RehypeKatex]}
      components={{
        a: MyLink,
        p: 'div',
        img: Image
      }}
    >
      {formatText}
    </ReactMarkdown>
  );
};

export default React.memo(Guide);
