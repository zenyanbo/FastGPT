import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { getAIApi } from '../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens } from '@fastgpt/global/common/string/tiktoken';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const defaultPrompt = `As a vector retrieval assistant, your task is to combine historical data to generate different versions of "retrieval terms" for the "original question" from different perspectives, thereby improving the semantic richness and accuracy of vector retrieval. The generated questions should have clear and unambiguous target objects and use the same language as the original question. For example:
History: 
"""
"""
Original question: what is Kerr geodesic?
Search terms: ["Introduce Kerr spacetime","Introduce geodesic","Introduce Kerr geodesic","equations of Kerr geodesic","definitions of Kerr geodesic", "development of Kerr geodesic"， "application of Kerr geodesic"]
----------------
History: 
"""
Q: Conversation history.
A: The current conversation is about the introduction and mathematical derivation of gauge field theory, etc.
"""
Original question: I don't understand.
Search terms: ["Introduce gauge symmetry","Introduce gauge field theory","framework of gauge field theory","terminology of gauge field theory","definition of gauge field theory"，"equations of gauge field theory","development of gauge field theory", "application of gauge field theory"]
----------------
History: 
"""
Q: Who is action-angle coordinates?
A: In classical mechanics, action-angle variables are a set of canonical coordinates that are useful in characterizing the nature of commuting flows in integrable systems when the conserved energy level set is compact, and the commuting flows are complete.
"""
Original question: Tell me about Kerr geodesic
Search terms: ["geodesic in Kerr spacetime","Introduce Kerr geodesic", "equations of Kerr geodesic", "action-angle and Kerr geodesic", "Kerr geodesic in action-angle"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the introduction and use of SciML.
Q: Error "Interrupted. Larger maxiters is needed" reported. 
A: The error may be due to...
"""
Original question: Tell me about it
Search terms: ["How to solve the 'Interrupted. Larger maxiters is needed' error reported by SciML", "What causes the 'Interrupted. Larger maxiters is needed' error.", "SciML prompts 'Interrupted. Larger maxiters is needed', what should I do?"]
----------------
History: 
"""
Q: What is FastGPT?
A: FastGPT is a RAG platform.
Q: What is Laf?
A: Laf is a cloud function development platform.
"""
Original question: How are they related?
Search terms: ["the relationship between FastGPT and Laf", "Is FastGPT's RAG implemented using Laf?"]
----------------
History: 
"""
Q: 什么是量子引力？为什么它很重要？
A: 量子引力是一个理论框架，旨在统一量子力学和广义相对论。
"""
Original question: 你知道AdS/CFT吗?
Search terms: ["introducton to quantum gravity", "introducton to AdS/CFT theory","definitions of AdS/CFT","equations of AdS/CFT", "How to understand AdS/CFT", "relationship between AdS/CFT and quantum gravity","AdS/CFT theory in quantum gravity","development of AdS/CFT", "application of AdS/CFT", "challenge of AdS/CFT"]
----------------
History:
"""
{{histories}}
"""
Original question: {{query}}
Search terms: `;

export const queryExtension = async ({
  chatBg,
  query,
  histories = [],
  model
}: {
  chatBg?: string;
  query: string;
  histories: ChatItemType[];
  model: string;
}): Promise<{
  rawQuery: string;
  extensionQueries: string[];
  model: string;
  tokens: number;
}> => {
  const systemFewShot = chatBg
    ? `Q: Conversation history.
A: ${chatBg}
`
    : '';
  const historyFewShot = histories
    .map((item) => {
      const role = item.obj === 'Human' ? 'Q' : 'A';
      return `${role}: ${item.value}`;
    })
    .join('\n');
  const concatFewShot = `${systemFewShot}${historyFewShot}`.trim();

  const ai = getAIApi({
    timeout: 480000
  });

  const messages = [
    {
      role: 'user',
      content: replaceVariable(defaultPrompt, {
        query: `${query}`,
        histories: concatFewShot
      })
    }
  ];
  const result = await ai.chat.completions.create({
    model: model,
    temperature: 0.01,
    // @ts-ignore
    messages,
    stream: false
  });

  let answer = result.choices?.[0]?.message?.content || '';
  if (!answer) {
    return {
      rawQuery: query,
      extensionQueries: [],
      model,
      tokens: 0
    };
  }

  answer = answer.replace(/\\"/g, '"');

  try {
    const queries = JSON.parse(answer) as string[];

    return {
      rawQuery: query,
      extensionQueries: queries,
      model,
      tokens: countGptMessagesTokens(messages)
    };
  } catch (error) {
    console.log(error);
    return {
      rawQuery: query,
      extensionQueries: [],
      model,
      tokens: 0
    };
  }
};
