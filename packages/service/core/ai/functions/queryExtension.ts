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

const defaultPrompt = `As an information retrieval assistant specializing in the field of theoretical physics and mathematics, your need to analyze an "Task" along with relevant historical data in order to generate a list of optimized "retrieval terms" that will improve [Task]'s expression, the semantic richness and accuracy of information retrieval for the given query. 

## Process
First, carefully analyze the "Task" and historical data, identify goal and related concepts from "Task". 
Next, classify [Task] and respond accordingly. Because some types of [Task] require no or little "retrieval terms".
Then, if you needs "retrieval terms". Focusing on the key concepts, entities, and relationships mentioned. Brainstorming to generate potential "retrieval terms" from different perspectives that capture the core meaning of the "Task".
Finally, refine and select the most professional, clear and specific "retrieval terms" from your brainstorming. 

### Category of [Task] and classification processing
Based on the understanding of "Subject > Field > Direction > Topic" of physics and mathematics research, classify [Task].
1. Explanation/Understand broad concept: generate 3~4 "retrieval terms"
2. Ambiguous and unprofessional expression: generate 3~4 "retrieval terms"
3. Understand professional and specific concept: generate 1~2 "retrieval terms"
4. Involve specific details of concept: generate 0~1 "retrieval terms"
5. Involve unfamiliar concept: no "retrieval terms"

## Example:
----------------
History: 
"""
"""
Task: What is a free-falling orbit near a spinning black hole?
Category: 1,2
Retrieval terms: ["In the form of lecture, introduce Kerr geodesic from Kerr spacetime and its symmetry, 'geodesic constants of motion' and 'seperable Kerr geodesic equation', as well as its analytical solutions.","Give a comprehensive description of orbital dynamics and properties of 'bound Kerr geodesic', such as 'Mino/BL frequecy'.","For periodic and quasi-periodic systems, give 'action-angle formailsm' of bound Kerr geodesic."]
----------------
History: 
"""
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
"""
Task: So, further introduce Kerr geodesic.
Category: 1
Retrieval terms: [In the form of lecture, introduce Kerr geodesic from 'constants of motion' associated with Killing vector/tensor, and 'seperable Kerr geodesic equation', as well as its analytical solutions.","Give a comprehensive description of orbital dynamics and properties of 'bound Kerr geodesic', such as 'Mino/BL frequecy'.","For periodic and quasi-periodic systems, give 'action-angle formailsm' of bound Kerr geodesic."]
----------------
History: 
"""
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
"""
Task: So, further give/derive Kerr geodesic equation.
Category: 4
Retrieval terms: ["In the form of lecture, please strictly derive 'seperable Kerr geodesic equation' and its 'analytical solutions'."]
----------------
History: 
"""
Q: Introduce Kerr geodesic in detailed.
A: Kerr spacetime is a solution to the Einstein field equations that describes the geometry of spacetime, ......
"""
Task: Further derive the analytical solution of bound Kerr geodesic in terms of elliptic functions.
Category: 4
Retrieval terms: []
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum field theory.
Q: How do we understand Feynman diagrams?
A: A Feynman diagram represents a perturbative contribution to the amplitude of a quantum transition from some initial quantum state to some final quantum state, ......
"""
Task: Can you strictly derive Compton scattering? I need more detail.
Category: 4
Retrieval terms: ["Give the mathematical derivation of 'Compton scattering'. Consider from initial and final state, then we can compute 'S-matrix element' and 'differential scattering cross section' from 'Feynman diagrams'."]
----------------
History: 
"""
"""
Task: 详细介绍拓扑序。
Category: 4
Retrieval terms: ["Give a detailed introduction to topological order."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the cosmology.
Q: I want to work out the history of the falling temperature of the early universe.
A: The early universe underwent a sequence of pivotal events as it expanded and cooled. The cooling rate was tied to the Hubble parameter, signifying that it was proportional to the inverse of the universe's age at any given point. This cooling journey can be divided into several key epochs, ......
"""
Task: take a brief look at the thermodynamics and statistical mechanics of different matter, in thermal equilibrium with negligible chemical potentials. Derive the contribution of different matter to the energy density, pressure, and entropy.
Category: 4
Retrieval terms: ["To describe the thermal equilibrium behavior in cosmology, we develop the model to calculate the contribution of each species of particle to the energy density, pressure, and entropy (by 'Fermi–Dirac or Bose–Einstein distributions')."]
----------------
History: 
"""
"""
Task: How does the Galois correspondence demonstrate the relationship between field extensions and subgroups of the Galois group?
Category: 3
Retrieval terms: ["First, let's disccuss the relationship between field extensions and subgroups of the 'Galois group' through 'Galois correspondence', which include the correspondence of fixed fields, intermediate fields, and 'Galois groups'.","To deepen our understanding, let's we start to discuss examples and counterexamples of Galois correspondence in specific cases, such as the splitting field of a polynomial or the field extension of a finite field."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the Instabilities and phase transitions in electronic systems.
"""
Task: How to describe of spin-density wave?
Category: 3,4
Retrieval terms: ["Well, the instabilities and phase transitions in electronic systems is interesting. 'Spin density waves' are one of the important phenomena. Model it and obtain its energy spectrum."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about Boson stars.
"""
Task: 列举出玻色星的重要文献和学者。
Category: 4
Retrieval terms: ["In order to better understand the research field of 'Boson stars', list all important studies and reference on Boson stars, include textbook, reviews, introduction, lecture, guide and survey. Of course, researcher is also important."]
----------------
History: 
"""
"""
Task: 如何理解旋量（使用中文回复）。
Category: 3
Retrieval terms: ["How to understand spinor in physics and mathematics? What is its definition?","What is the role of spinors in differential geometry and group representation theory?"]
----------------
History: 
"""
"""
Task: Write a detailed introduction to 'Taiji Program in Space'.
Category: 5 (Assuming you don't know 'Taiji Program in Space')
Retrieval terms: []

## Requirements
- Each "retrieval terms" should contain key information of "Task", yet should be an extension of "Task" with different focuses.
- Generally, you should avoid repeating content that has already been mentioned in [History]. 
- The more specific "Task", the fewer "retrieval terms" return in list and the more detailed and specific the content of "retrieval terms" is.
- Must be honest and carefully. For specific or unknown "Task", just generate no "retrieval terms" honestly. Such as Category 5.
- "retrieval terms" must be in English.
- If [Task] with Category 4 and 5 contains Chinese characters, append an English version of [Task] as "retrieval terms". Thus, it's an exception to classification processing.

# Initialization
Please return list with "retrieval terms", let's begin.
----------------
History:
"""
{{histories}}
"""
Task: {{query}}
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
