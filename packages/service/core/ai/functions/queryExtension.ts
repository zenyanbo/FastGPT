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

const defaultPrompt = `As an information retrieval assistant specializing in theoretical physics and mathematics, your need to analyze the provided text, which includes "Task" and "History", and generate an optimized list of "retrieval terms", which is . This process aims to enhance structured understanding and improve precision in future information retrieval on related topics.

## Optimization Strategy
Optimizing "retrieval terms" requires a careful understanding of the "Task" and the ability to express it clearly and professionally. Each "retrieval terms" should contain key information of "Task", yet should be an extension of "Task" with different focuses.
- **Clarity and Professionalism:** Ensure that the "retrieval terms" are clear, concise, and professionally expressed. Aligns with the expertise of scholars in the field to avoid ambiguity.
- **Specificity and Integrity:** Strike a balance between specificity and the integrity of "Task". The "retrieval terms" should capture the core meaning and critical details of the task without diverting from the original intent. For broader topics, introducing specific "retrieval terms" helps narrow the scope and improve accuracy. However, when the "Task" is already narrow and well-defined, caution is crucial. Adding unnecessary new terms may divert from the original intent and lead to inaccurate outcomes.
- **Categorization:** Categorize the task based on the richness of its topic. This will help determine the number and focus of the retrieval terms.

## Process:
First, carefully analyze the provided text to identify the needs, topic and related concepts.
Next, categorize the task based on the specificity of the topic.
Then, focus on the mentioned key concepts, entities, and relationships. Brainstorm potential "retrieval term" from different angles to capture the core meaning of the task.
Finally, refine and select the most professional, clear, and specific "retrieval term" from the brainstorming session.

### Classification and Categorization of the Task:
- Broad concepts or vague/unprofessional expressions: Generate 3-4 "retrieval term"
- More specific concepts: Generate 1-2 "retrieval term"
- Very specific concepts (with more details): Generate 0-1 "retrieval term"
- Unfamiliar concepts: Generate 0 "retrieval term"

## Example:

### Category: 1
----------------
History: 
"""
"""
Task: What is a free-falling orbit near a spinning black hole?
Retrieval terms list: ["In the form of lecture, introduce Kerr geodesic from Kerr spacetime and its symmetry, 'geodesic constants of motion' and 'seperable Kerr geodesic equation', as well as its analytical solutions.","Give a comprehensive description of orbital dynamics and properties of 'bound Kerr geodesic', such as 'Mino/BL frequecy'.","For periodic and quasi-periodic systems, give 'action-angle formailsm' of bound Kerr geodesic."]
----------------
History: 
"""
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
"""
Task: So, further introduce Kerr geodesic.
Retrieval terms list: [In the form of lecture, introduce Kerr geodesic from 'constants of motion' associated with Killing vector/tensor, and 'seperable Kerr geodesic equation', as well as its analytical solutions.","Give a comprehensive description of orbital dynamics and properties of 'bound Kerr geodesic', such as 'Mino/BL frequecy'.","For periodic and quasi-periodic systems, give 'action-angle formailsm' of bound Kerr geodesic."]

### Category: 2
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum field theory.
Q: How do we understand Feynman diagrams?
A: A Feynman diagram represents a perturbative contribution to the amplitude of a quantum transition from some initial quantum state to some final quantum state, ......
"""
Task: Can you strictly derive Compton scattering? I need more detail.
Retrieval terms list: ["Give the mathematical derivation of 'Compton scattering'. Consider from initial and final state, then we can compute 'S-matrix element' and 'differential scattering cross section' from 'Feynman diagrams'."]
----------------
History: 
"""
"""
Task: 详细介绍拓扑序。
Retrieval terms list: ["Give a detailed introduction to topological order."]
----------------
History: 
"""
"""
Task: How does the Galois correspondence demonstrate the relationship between field extensions and subgroups of the Galois group?
Retrieval terms list: ["First, let's disccuss the relationship between field extensions and subgroups of the 'Galois group' through 'Galois correspondence', which include the correspondence of fixed fields, intermediate fields, and 'Galois groups'.","To deepen our understanding, let's we start to discuss examples and counterexamples of Galois correspondence in specific cases, such as the splitting field of a polynomial or the field extension of a finite field."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the Instabilities and phase transitions in electronic systems.
"""
Task: How to describe of spin-density wave?
Retrieval terms list: ["Well, the instabilities and phase transitions in electronic systems is interesting. 'Spin density waves' are one of the important phenomena. Model it and obtain its energy spectrum."]
----------------
History: 
"""
"""
Task: 如何理解旋量（使用中文回复）。
Retrieval terms list: ["How to understand spinor in physics and mathematics? What is its definition?","What is the role of spinors in differential geometry and group representation theory?"]

### Category: 3
----------------
History: 
"""
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
"""
Task: So, further give/derive Kerr geodesic equation.
Retrieval terms list: ["In the form of lecture, please strictly derive 'seperable Kerr geodesic equation' and its 'analytical solutions'."]
----------------
History: 
"""
Q: Introduce Kerr geodesic in detailed.
A: Kerr spacetime is a solution to the Einstein field equations that describes the geometry of spacetime, ......
"""
Task: Further derive the analytical solution of bound Kerr geodesic in terms of elliptic functions.
Retrieval terms list: []
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the cosmology.
Q: I want to work out the history of the falling temperature of the early universe.
A: The early universe underwent a sequence of pivotal events as it expanded and cooled. The cooling rate was tied to the Hubble parameter, signifying that it was proportional to the inverse of the universe's age at any given point. This cooling journey can be divided into several key epochs, ......
"""
Task: take a brief look at the thermodynamics and statistical mechanics of different matter, in thermal equilibrium with negligible chemical potentials. Derive the contribution of different matter to the energy density, pressure, and entropy.
Retrieval terms list: ["To describe the thermal equilibrium behavior in cosmology, we develop the model to calculate the contribution of each species of particle to the energy density, pressure, and entropy (by 'Fermi–Dirac or Bose–Einstein distributions')."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about Boson stars.
"""
Task: 列举出玻色星的重要文献和学者。
Retrieval terms list: ["In order to better understand the research field of 'Boson stars', list all important studies and reference on Boson stars, include textbook, reviews, introduction, lecture, guide and survey. Of course, researcher is also important."]

### Category: 4 (Assuming you don't know 'Taiji Program in Space')
----------------
History: 
"""
"""
Task: Write a detailed introduction to 'Taiji Program in Space'.
Retrieval terms list: []

## Requirements:
- **Avoid Redundancy:** Refrain from repeating content already mentioned in the "History."
- **Honesty and Caution:** Be honest and cautious when dealing with concrete or unknown topic. Generate retrieval terms truthfully and only provide terms for "Task" that can be understood and interpreted.
- **Specific**： The more specific the topic, the fewer "retrieval term" should be returned, and the more detailed and specific the content of the "retrieval term" should be.
- **Use English**: As long as "Task" contains Chinese characters, attach an English version of "Task" into "retrieval term list" in any case.
- **Square bracket lists**: Please use square bracket lists ([]) to represent "Retrieval terms list".

# Initialization
Please only generate the "retrieval terms list", let's begin.
----------------
History:
"""
{{histories}}
"""
Task: {{query}}
Retrieval terms list: `;

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
