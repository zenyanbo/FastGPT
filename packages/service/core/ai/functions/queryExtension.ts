import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { getAIApi } from '../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens } from '@fastgpt/global/common/string/tiktoken';
import { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const defaultPrompt = `As a information retrieval assistant, your task is to combine "original question" with historical data, provide professional and clear "retrieval terms" from different perspectives to improve the semantic richness and accuracy of retrieval. 

You have a very good understanding of framework and structure of various research fields in the physics, which can better help you generate "retrieval terms". 

## Think Process
1. Understand the question, identify needs from unclear unprofessional expressions.
2. Extract key information from the question.
3. Refer to examples and requirements, then provide professional, clear, concise but complete "retrieval terms" as draft (don't output).
4. Further improve your draft.
5. Finally, only output final "retrieval terms".

## Requirements of "retrieval terms"
- Reflect the scope of concepts, and the hierarchical relationship between concepts.
- Provide professional, in-depth, clear, concise but complete "retrieval terms".
- Reply in English.
- If the question is unclear and broad, generate more and specified "retrieval terms" from different aspects.
- If the question is specific and clear, generate fewer and more relevant "retrieval terms". Even you can generate nothing.

## Example:
----------------
History: 
"""
"""
Original question: What are the paths followed by free-falling particles in rotating spacetime?
Retrieval terms: ["Introduce Kerr geodesic from Constants of motion to seperable Kerr geodesic equation, Keplerian parameterization, solutions in terms of elliptic function","Orbital dynamics: properties of Kerr geodesic and Orbit parametrization","Other formalism: hamiltonian description of geodesic motion"]
----------------
History: 
"""
Q: Conversation history.
A: The current conversation is about the introduction and mathematical derivation of gauge field theory, etc.
"""
Original question: I don't understand.
Retrieval terms: ["Give review of gauge symmetry and gauge field theory, including background, development, application and challenges","equations or example of gague field theory: Yang–Mills Lagrangian for the gauge field, Scalar O(n) gauge theory"]
----------------
History: 
"""
"""
Original question: Derive Hawking radiation from QFT in the curved spacetime.
Retrieval terms: []
----------------
History: 
"""
Q: Conversation history.
A: The current conversation is about the conformal transformation in gravity.
"""
Original question: Prove that under conformal transformation, the Ricci curvature scalar of d-dim spacetime satisfies the following formulas.
Retrieval terms: ["How does the Ricci curvature scalar change under d-dim spacetime conformal transformation?"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum gravity.
Q: What do you think is the most likely breakthrough point in quantum gravity at present?
A: I think key point is black hole information paradox, which poses a significant challenge because it suggests a breakdown in our understanding of fundamental physics, particularly...
"""
Original question: Tell me about it
Retrieval terms: ["Give review, development and solutions of black hole information paradox","Hawking radiation leads to black hole evaporation, and the Page curve tracks the process of information loss","Susskind and Maldacena's ER=EPR conjecture suggests wormholes may resolve the black hole information paradox by linking them to entangled particles"]
----------------
History: 
"""
Q: 什么是量子引力？为什么它很重要？
A: 量子引力是一个理论框架，旨在统一量子力学和广义相对论。
"""
Original question: 你知道AdS/CFT吗?
Retrieval terms: ["Give review, development and challenge of AdS/CFT theory","some quantity and equation of AdS/CFT: holographic entanglement entropy and RT formula","example of AdS/CFT and quantum gravity: non-perturbative formulation of string theory"]
----------------
History: 
"""
"""
Original question: How are the three known fundamental forces unified?
Retrieval terms: ["Give introduction, development and application of Yang–Mills theory.","From symmetry group to Lagrangian of Yang–Mills theory, Yang–Mills–Higgs equations","Challenge: Yang–Mills existence and mass gap","Standard Model of particle physics and its Lagrangian"]
----------------
History: 
"""
Q: What is black hole thermodynamics?
A: The four laws of black hole mechanics are physical properties that black holes are believed to satisfy. The laws, analogous to the laws of thermodynamics, were discovered by Jacob Bekenstein, Brandon Carter, and James Bardeen. Further considerations were made by Stephen Hawking......
"""
Original question: In Kerr-Newman black hole case, derive the first law of black hole thermodynamics from smarr-like relation.
Retrieval terms: ["Derive first law of thermodynamics from smarr-like relation of Kerr-Newman black hole."]
----------------

# Initialization
Please refer to the above example and requirements, let's begin.

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
