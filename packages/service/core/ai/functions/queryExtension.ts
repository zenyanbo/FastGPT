import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { getAIApi } from '../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens } from '@fastgpt/global/common/string/tiktoken';
import { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';
import { chatValue2RuntimePrompt } from '@fastgpt/global/core/chat/adapt';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const defaultPrompt = `As an information retrieval assistant specializing in the field of theoretical physics and mathematics, your task is to analyze an "original question" along with relevant historical data in order to generate optimized "retrieval terms" that will improve the semantic richness and accuracy of information retrieval for the given query. You have a very good understanding of framework and structure of various research fields in the physics and mathematics. 

## Process
First, carefully analyze the "original question" and historical data, identify needs from unclear unprofessional expressions, focusing on the key concepts, entities, and relationships mentioned.
Next, brainstorming. generate potential retrieval terms and phrases from different perspectives that capture the core meaning of the "original question". Consider synonyms, related concepts, narrower and broader terms in the domain of theoretical physics and mathematics. The goal is to come up with a semantically rich set of candidate terms.
Finally, refine and select the most relevant, in-depth, professional and clear retrieval terms from your brainstorming. Aim for terminology that are domain-specific, unambiguous, and commonly used in the field. Organize the terms to cover key aspects, reflect any hierarchical relationships and scope of concepts where applicable. The final set of retrieval terms should be in-depth and preferably comprehensive.

Notice: "retrieval terms" Always are in English.

## Example:
----------------
History: 
"""
"""
Original question: What are the paths followed by free-falling particles in rotating spacetime?
Retrieval terms: ["Give in-depth introduction to Kerr geodesic which start from Kerr spacetime to constants of motion, seperable Kerr geodesic equation and solutions","Describe orbital dynamics and properties of Kerr geodesic","Give hamiltonian description of Kerr geodesic in detail"]
----------------
History: 
"""
Q: Conversation history.
A: 现在的对话是关于规范场论的介绍和数学推导。
"""
Original question: 我不理解。
Retrieval terms: ["Give detailed review of gauge field theory from the perspectives of motivation, development, application and challenges","Introduce Yang-Mils equation which govern the dynamics of gague field","Framwork of gauge field theory is based on the principle of local gague symmetry, which states the Lagrangian of system must be invariant under local transformations of a continuous symmetry group","Give simple calculation examples of gague field theory, U(1) gague field and scalar O(n) gauge theory"]
----------------
History: 
"""
"""
Original question: How do homomorphisms between rings reveal relationships between their algebraic structures and corresponding ideals?
Retrieval terms: ["Introduce algebraic structures and their relationships under ring homomorphisms, include subrings, quotient rings, and isomorphisms","Ideals and their behavior under ring homomorphisms: preserving ideal properties, homomorphic images of ideals, and ideal correspondence.","Here are some examples of ring homomorphisms and their impact on algebraic structures and ideals, which has polynomial rings, matrix rings, and group rings."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum gravity.
Q: What do you think is the most likely breakthrough point in quantum gravity at present?
A: I think key point is black hole information paradox, which poses a significant challenge because it suggests a breakdown in our understanding of fundamental physics, particularly...
"""
Original question: Introduce black hole information paradox.
Retrieval terms: ["Give review of black hole information paradox which involves development, solutions and arguement","The key concept of information paradox include Hawking radiation, Page curve, entanglement entropy and AdS/CFT correspondence.","Considering black hole information paradox from the perspective of establishment of quantum gravity."]
----------------
History: 
"""
"""
Original question: Under what conditions is the product topology of infinitely many spaces also a compact space?
Retrieval terms: ["Introduce the concept of product topology and its properties, including the Tychonoff theorem which states that the product of any collection of compact spaces is compact in the product topology.","Explore the conditions under which the product topology of infinitely many spaces is also a compact space, including the role of compactness in each individual space and the interplay between them.","Provide examples and counterexamples to illustrate the conditions for compactness in product topology, such as the countable product of non-trivial finite discrete spaces, and the product of uncountably many copies of the two-point discrete space."]
----------------
History: 
"""
Q: What is black hole thermodynamics?
A: The four laws of black hole mechanics are physical properties that black holes are believed to satisfy. The laws, analogous to the laws of thermodynamics, were discovered by Jacob Bekenstein, Brandon Carter, and James Bardeen. Further considerations were made by Stephen Hawking......
"""
Original question: In Kerr-Newman black hole case, derive the first law of black hole thermodynamics from smarr-like relation.
Retrieval terms: ["Give a derivation in detail, which obtain first law of thermodynamics from smarr-like relation of Kerr-Newman black hole.","Give an in-depth review about first law of thermodynamics and smarr-like relation."]
----------------
History: 
"""
"""
Original question: 使用弯曲时空QFT推导Hawking辐射（使用中文回复）。
Retrieval terms: ["In the context of black hole thermodynamics, derive Hawking radiation using quantum field theory in curved spacetime.","Here is detailed derivation. First, start from mode expandsion of field in curved spacetime, then applying the Bogoliubov transformation, finally deriving the thermal radiation spectrum."]
----------------
History: 
"""
"""
Original question: How does the Galois correspondence demonstrate the relationship between field extensions and subgroups of the Galois group?
Retrieval terms: ["Explain the relationship between field extensions and subgroups of the Galois group through Galois correspondence, including the correspondence of fixed fields, intermediate fields, and Galois groups.","Provide examples of Galois correspondence in specific cases, such as the splitting field of a polynomial or the field extension of a finite field.","Discuss the significance of Galois correspondence in the study of field extensions and Galois groups, and its applications in algebraic number theory and algebraic geometry."]
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
      return `${role}: ${chatValue2RuntimePrompt(item.value).text}`;
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
      extensionQueries: Array.isArray(queries) ? queries : [],
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
