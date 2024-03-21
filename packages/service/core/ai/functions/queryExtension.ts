import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { getAIApi } from '../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens } from '@fastgpt/global/common/string/tiktoken';
import { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const defaultPrompt = `As a information retrieval assistant, your task is to combine "original question" with historical data, understand the question, identify needs from unclear unprofessional expressions, provide professional precise "retrieval terms" from different perspectives, thereby improving the semantic richness and accuracy of retrieval. These "retrieval terms" must reflect the scope of concepts, and the hierarchical relationship between concepts. Also, you can expand the concept appropriately (e.g., be more specific, add some examples) to enrich "retrieval terms".

You have a very good understanding of framework and structure of various research fields in the physics, which can better help you generate "retrieval terms". "Retrieval terms" must be expressed in English. For example:
----------------
History: 
"""
"""
Original question: What are the paths followed by free-falling particles in rotating spacetime?
Search terms: ["introduce geodesic motion in Kerr spacetime","Constants of motion, seperable Kerr geodesic equation","properties of bound Kerr geodesic","Orbital dynamics in Kerr spacetime"]
----------------
History: 
"""
Q: Conversation history.
A: The current conversation is about the introduction and mathematical derivation of gauge field theory, etc.
"""
Original question: I don't understand.
Search terms: ["review of gauge symmetry and gauge field theory","equations about gauge field theory","example of gague field theory: Yang–Mills Lagrangian for the gauge field, Scalar O(n) gauge theory","development, application and background of gauge field theory"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum gravity.
Q: What do you think is the most likely breakthrough point in quantum gravity at present?
A: I think key point is black hole information paradox, which poses a significant challenge because it suggests a breakdown in our understanding of fundamental physics, particularly...
"""
Original question: Tell me about it
Search terms: ["review, development and solutions of black hole information paradox","Hawking radiation, Black hole evaporation and Page curve","Susskind, Maldacena, holographic complexity and ER=EPR"]
----------------
History: 
"""
Q: What is Feynman diagram?
A: Feynman diagram is a representation of quantum field theory processes in terms of particle interactions.
Q: What is quantum field theory?
A: QFT is a theoretical framework that combines classical field theory, special relativity, and quantum mechanics.
"""
Original question: What is a black hole event horizon?
Search terms: ["denifition of event horizon","gravitational collapse, black hole formation and event horizon","event horizon and causal structure","quantum gravity and event horizon"]
----------------
History: 
"""
Q: 什么是量子引力？为什么它很重要？
A: 量子引力是一个理论框架，旨在统一量子力学和广义相对论。
"""
Original question: 你知道AdS/CFT吗?
Search terms: ["review, development and challenge of AdS/CFT theory","holographic entanglement entropy and RT formula","basic formula and cacalculation examples of AdS/CFT","AdS/CFT and Black hole information paradox","AdS/CFT and quantum gravity","AdS/CFT and non-perturbative formulation of string theory"]
----------------
History: 
"""
"""
Original question: How are the three known fundamental forces unified?
Search terms: ["introduce Yang–Mills theory","symmetry group, Lagrangian of Yang–Mills theory","Yang–Mills–Higgs equations","Challenge: Yang–Mills existence and mass gap","Standard Model of particle physics and its Lagrangian"]
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
  ] as ChatCompletionMessageParam[];
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
