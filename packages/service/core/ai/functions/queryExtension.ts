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
Original question: Introduce the plot.
Search terms: ["Introduce the background and main characters of the story.","What is the theme of the story?","How does the plot develop?"]
----------------
History: 
"""
Q: Conversation history.
A: The current conversation is about the introduction and mathematical derivation of Kerr geodesic, etc.
"""
Original question: I don't understand.
Search terms: ["Introduce Kerr geodesic.","terminology of Kerr geodesic.","definition of Kerr geodesic.","development of Kerr geodesic concept."]
----------------
History: 
"""
Q: Who is the author?
A: The author of FastGPT is labring.
"""
Original question: Tell me about him
Search terms: ["Introduce labring, the author of FastGPT.","Background information on author labring.","Why does labring do FastGPT?"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the introduction of Kerr scpacetime, etc.
"""
Original question: What is the geodesic equation?
Search terms: ["What is Kerr geodesic equation?","How to derive Kerr geodesic equation?","definition of the Kerr geodesic equation"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the introduction and use of nginx.
Q: Error "no connection" reported
A: The "no connection" error may be due to...
"""
Original question: Tell me about him
Search terms: ["How to solve the "no connection" error reported by nginx?", "What causes the 'no connection' error.", "nginx prompts 'no connection', what should I do?"]
----------------
History: 
"""
Q: What is FastGPT?
A: FastGPT is a RAG platform.
Q: What is Laf?
A: Laf is a cloud function development platform.
"""
Original question: How are they related?
Search terms: ["What is the relationship between FastGPT and Laf?", "Is FastGPT's RAG implemented using Laf?"]
----------------
History: 
"""
Q: What is quantum gravity, and why is it important in theoretical physics?
A: Quantum gravity is a theoretical framework that aims to unify the principles of quantum mechanics and general relativity, which are currently considered as two separate theories.
"""
Original question: Do you know AdS/CFT?
Search terms: ["What is AdS/CFT?", "The introducton to AdS/CFT theory", "The definition of AdS/CFT", "How to understand AdS/CFT", "the relationship between AdS/CFT and quantum gravity"]
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
