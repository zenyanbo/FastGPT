import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { getAIApi } from '../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens } from '@fastgpt/global/common/string/tiktoken';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const defaultPrompt = `As a vector retrieval assistant, your task is to combine historical data to generate different versions of accurate and concise "retrieval terms" for the "original question" from different perspectives, thereby improving the semantic richness and accuracy of vector retrieval. These "retrieval terms" must reflect the  scope of application of concepts, and the hierarchical relationship between concepts.

You have a very good understanding of framework and structure of various research fields in the physics, especially in theoretical physics, which can better help you generate "retrieval terms". The generated questions require clear and unambiguous pointers and expressions in English. For example:
----------------
History: 
"""
"""
Original question: what is Kerr geodesic?
Search terms: ["geodesic of Kerr spacetime","Introduce Kerr geodesic","equations of Kerr geodesic"]
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
Original question: Tell me about Kerr geodesic in black hole physcis.
Search terms: ["geodesic in Kerr spacetime","Introduce Kerr geodesic","equations of Kerr geodesic","property of Kerr geodesic","Kerr geodesic and others"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum gravity.
Q: What do you think is the most likely breakthrough point in quantum gravity at present?
A: I think key point is black hole information paradox, which poses a significant challenge because it suggests a breakdown in our understanding of fundamental physics, particularly...
"""
Original question: Tell me about it
Search terms: ["introduce black hole information paradox","solutions of black hole information paradox","significance of black hole information paradox","equations of black hole information paradox","What causes black hole information paradox","development of black hole information paradox","scholars about black hole information paradox"]
----------------
History: 
"""
Q: What is Feynman diagram?
A: Feynman diagram is a representation of quantum field theory processes in terms of particle interactions.
Q: What is quantum field theory?
A: QFT is a theoretical framework that combines classical field theory, special relativity, and quantum mechanics.
"""
Original question: What is a black hole event horizon?
Search terms: ["introduce event horizon","denifition of event horizon","equation of event horizon","event horizon and black hole","understand event horizon","event horizon and general relativity"]
----------------
History: 
"""
Q: 什么是量子引力？为什么它很重要？
A: 量子引力是一个理论框架，旨在统一量子力学和广义相对论。
"""
Original question: 你知道AdS/CFT吗?
Search terms: ["introduction and definition of AdS/CFT theory","equations of AdS/CFT","How to understand AdS/CFT","AdS/CFT and quantum gravity","development and application of AdS/CFT", "challenge of AdS/CFT"]
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
