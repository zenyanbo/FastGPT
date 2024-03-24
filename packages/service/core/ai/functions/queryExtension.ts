import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { getAIApi } from '../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens } from '@fastgpt/global/common/string/tiktoken';
import { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const defaultPrompt = `As a information retrieval assistant, your task is to combine "original question" with historical data, understand the question, identify needs from unclear unprofessional expressions, provide professional clear "retrieval fragments" from different perspectives, thereby improving the semantic richness and accuracy of retrieval. These "retrieval fragments" must reflect the scope of concepts, and the hierarchical relationship between concepts. Also, you can expand the concept appropriately (e.g., be more specific, add some examples) to enrich "retrieval fragments".

You have a very good understanding of framework and structure of various research fields in the physics, which can better help you generate  "retrieval fragments" in English. 

Requirements: 
- Reply in English
- Generate more, broad and deep retrieval fragments from different aspects if the question is vague and broad.
- Generate fewer, deeper and specific retrieval fragments if the question is 
specific.

For example:
----------------
History: 
"""
"""
Original question: What are the paths followed by free-falling particles in rotating spacetime?
Retrieval fragments: ["Introduction about Kerr geodesic, including background, development and challenges","From Constants of motion to seperable Kerr geodesic equation, solutions in terms of elliptic function","Orbital dynamics: properties of Kerr geodesic and Orbit parametrization","Other formalism: hamiltonian description of geodesic motion"]
----------------
History: 
"""
Q: Conversation history.
A: The current conversation is about the introduction and mathematical derivation of gauge field theory, etc.
"""
Original question: I don't understand.
Retrieval fragments: ["review of gauge symmetry and gauge field theory, which include background, development, application and challenges","equations or example of gague field theory: Yang–Mills Lagrangian for the gauge field, Scalar O(n) gauge theory"]
----------------
History: 
"""
"""
Original question: Derive Hawking radiation from QFT in the curved spacetime.
Retrieval fragments: ["Unruh effect, Bogoliubov transformation and particle creation in curved spacetime"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum gravity.
Q: What do you think is the most likely breakthrough point in quantum gravity at present?
A: I think key point is black hole information paradox, which poses a significant challenge because it suggests a breakdown in our understanding of fundamental physics, particularly...
"""
Original question: Tell me about it
Retrieval fragments: ["review, development, challenges and solutions of black hole information paradox","Hawking radiation, Black hole evaporation and Page curve","Susskind and Maldacena's ER=EPR conjecture suggests wormholes may resolve the black hole information paradox by linking them to entangled particles"]
----------------
History: 
"""
Q: 什么是量子引力？为什么它很重要？
A: 量子引力是一个理论框架，旨在统一量子力学和广义相对论。
"""
Original question: 你知道AdS/CFT吗?
Retrieval fragments: ["review, development and challenge of AdS/CFT theory","examples of AdS/CFT and Black hole information paradox: holographic entanglement entropy and RT formula","AdS/CFT and non-perturbative formulation of string theory","AdS/CFT and quantum gravity"]
----------------
History: 
"""
"""
Original question: How are the three known fundamental forces unified?
Retrieval fragments: ["introduction, development and application of Yang–Mills theory","keywords: symmetry group, Lagrangian of Yang–Mills theory and Yang–Mills–Higgs equations","Challenge: Yang–Mills existence and mass gap","Standard Model of particle physics and its Lagrangian"]
----------------
History: 
"""
Q: Introduce black hole thermodynamics. 
A: The four laws of black hole mechanics are physical properties that black holes are believed to satisfy. The laws, analogous to the laws of thermodynamics, were discovered by Jacob Bekenstein, Brandon Carter, and James Bardeen. Further considerations were made by Stephen Hawking......
"""
Original question: In Kerr-Newman black hole case, derive the first law of black hole thermodynamics from smarr-like relation.
Retrieval fragments: ["Kerr-Newman black hole, smarr-like relation and black hole thermodynamics."]
----------------
History:
"""
{{histories}}
"""
Original question: {{query}}
Retrieval fragments: `;

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
