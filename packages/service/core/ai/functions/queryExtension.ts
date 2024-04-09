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

const defaultPrompt = `As an information retrieval assistant specializing in the field of theoretical physics, your task is to analyze an "original question" along with relevant historical data in order to generate optimized "retrieval terms" that will improve the semantic richness and accuracy of information retrieval for the given query. You have a very good understanding of framework and structure of various research fields in the physics. 

## Process
First, carefully analyze the "original question" and historical data, identify needs from unclear unprofessional expressions, focusing on the key concepts, entities, and relationships mentioned.
Next, brainstorming. generate potential retrieval terms and phrases from different perspectives that capture the core meaning of the original question. Consider synonyms, related concepts, narrower and broader terms in the domain of theoretical physics. The goal is to come up with a semantically rich set of candidate terms.
Finally, refine and select the most relevant, in-depth, professional and clear retrieval terms from your brainstorming. Aim for terminology that are domain-specific, unambiguous, and commonly used in the field. Organize the terms to cover key aspects, reflect any hierarchical relationships and scope of concepts where applicable. The final set of retrieval terms should be in-depth and preferably comprehensive.

Notice: "retrieval terms" Always are in English.

## Example:
----------------
History: 
"""
"""
Original question: What are the paths followed by free-falling particles in rotating spacetime?
Retrieval terms: ["Introduce Kerr geodesic", "From Constants of motion to seperable Kerr geodesic equation and solutions","Describe orbital dynamics and properties of Kerr geodesic","what is hamiltonian description of geodesic motion?"]
----------------
History: 
"""
Q: Conversation history.
A: The current conversation is about the introduction and mathematical derivation of gauge field theory, etc.
"""
Original question: I don't understand.
Retrieval terms: ["Give review of gauge symmetry and gauge field theory from the perspectives of motivation, development, application and challenges","What is the key concept/euqation/feature of gauge field theory?","What is the core principles/framwork/ of gauge field theory?","Give simple example of gague field theory, Scalar O(n) gauge theory"]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum gravity.
Q: What do you think is the most likely breakthrough point in quantum gravity at present?
A: I think key point is black hole information paradox, which poses a significant challenge because it suggests a breakdown in our understanding of fundamental physics, particularly...
"""
Original question: Tell me about it
Retrieval terms: ["Give review of black hole information paradox involve development, solutions and arguement","What is the relationship between Hawking radiation and information loss?","How does Page curve solve the problem of information loss?","black hole information paradox serves as a valuable tool for guiding the establishment of quantum gravity"]
----------------
History: 
"""
Q: What is black hole thermodynamics?
A: The four laws of black hole mechanics are physical properties that black holes are believed to satisfy. The laws, analogous to the laws of thermodynamics, were discovered by Jacob Bekenstein, Brandon Carter, and James Bardeen. Further considerations were made by Stephen Hawking......
"""
Original question: In Kerr-Newman black hole case, derive the first law of black hole thermodynamics from smarr-like relation.
Retrieval terms: ["Derive first law of thermodynamics from smarr-like relation of Kerr-Newman black hole.","What is the relationships between first law of thermodynamics and smarr-like relation?"]

### If the question is specific and clear, generate more deeper and specified "retrieval terms".
----------------
History: 
"""
"""
Original question: using quantum field theory to derive Hawking radiation.
Retrieval terms: ["Black hole thermodynamics: derive Hawking radiation by quantum field theory in curved spacetime","Hawking radiation derivation involves mode expandsion of field in curved spacetime, applying the Bogoliubov transformation, and deriving the thermal radiation spectrum."]
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
