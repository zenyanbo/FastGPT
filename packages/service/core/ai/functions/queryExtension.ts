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

const defaultPrompt = `As an information retrieval assistant specializing in the field of theoretical physics and mathematics, your task is to analyze an "original question" along with relevant historical data in order to generate a list of optimized "retrieval terms" that will optimize problem expression and improve the semantic richness and accuracy of information retrieval for the given query. You have a very good understanding of framework and structure of various research fields in the physics and mathematics. 

## Process
First, carefully analyze the "original question" and historical data, identify needs from unclear unprofessional expressions, focusing on the key concepts, entities, and relationships mentioned.
Next, brainstorming. generate potential "retrieval terms" and phrases from different perspectives that capture the core meaning of the "original question". Consider synonyms, related concepts, narrower and broader terms in the domain of theoretical physics and mathematics. The goal is to come up with a semantically rich set of candidate terms.
Finally, refine and select the most relevant, in-depth, professional and clear "retrieval terms" from your brainstorming. Aim for terminology that are domain-specific, unambiguous, and commonly used in the field. Organize the terms to cover key aspects, reflect any hierarchical relationships and scope of concepts where applicable. The final set of "retrieval terms" should be in-depth and preferably comprehensive.

## Example:
----------------
History: 
"""
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
"""
Original question: What are the paths followed by free-falling particles in rotating spacetime?
Retrieval terms: ["Introduce Kerr geodesic from Kerr spacetime to constants of motion, seperable Kerr geodesic equation and solutions","Describe orbital dynamics and properties of Kerr geodesic","Give hamiltonian description of Kerr geodesic in detail"]
----------------
History: 
"""
"""
Original question: 介绍规范场论。
Retrieval terms: ["Give detailed review of gauge field theory from the perspectives of motivation, development, application and problem","Give Yang-Mils equation which govern the dynamics of gague field","Show simple calculation examples of gague field theory, U(1) gague field and scalar O(n) gauge theory."]
----------------
History: 
"""
"""
Original question: How to understand spinor?
Retrieval terms: ["Give the definition of spin group and spinor.","Explain the concept of spinors from representation theory of spin group and Clifford algebras","What is the relationship between spinors and the Lorentz group, as well as Dirac equation and fermions in quantum field theory","Provide examples of spinor calculations and manipulations."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the quantum field theory.
Q: How do we understand Feynman diagrams?
A: A Feynman diagram represents a perturbative contribution to the amplitude of a quantum transition from some initial quantum state to some final quantum state, ......
"""
Original question: Can you strictly derive Compton scattering? I need more detail.
Retrieval terms: ["Consider the scattering of a photon by an electron to lowest order in e.","Process is that, at first label the initial and final state, then consider the lowest order Feynman diagrams to get S-matrix element. finally, calculate differential scattering cross section."]
----------------
History: 
"""
"""
Original question: Under what conditions is the product topology of infinitely many spaces also a compact space?
Retrieval terms:  ["Introduce the concept of product topology and its properties, including the Tychonoff theorem.","Explore the conditions under which the product topology of infinitely many spaces is also a compact space","Provide examples and counterexamples to illustrate the conditions for compactness in product topology, such as the countable product of non-trivial finite discrete spaces, and the product of uncountably many copies of the two-point discrete space."]
----------------
History: 
"""
"""
Original question: 使用弯曲时空QFT推导Hawking辐射（使用中文回复）。
Retrieval terms: ["Derive Hawking radiation spectrum using quantum field theory in curved spacetime","Here is detailed derivation, which start from mode expandsion of field in curved spacetime, then applying the Bogoliubov transformation, finally get the thermal radiation spectrum."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the cosmology.
Q: I want to work out the history of the falling temperature of the early universe.
A: The early universe underwent a sequence of pivotal events as it expanded and cooled. The cooling rate was tied to the Hubble parameter, signifying that it was proportional to the inverse of the universe's age at any given point. This cooling journey can be divided into several key epochs, ......
"""
Original question: take a brief look at the thermodynamics and statistical mechanics of different matter, in thermal equilibrium with negligible chemical potentials. Derive the contribution of different matter to the energy density, pressure, and entropy.
Retrieval terms: ["Derive the thermal equilibrium behavior of different particles in cosmology","From adiabatic change of thermal equilibrium system in a co-moving volume, we can get Stefan–Boltzmann law and entropy density of radiation.","Consider the number of particles in early universe with momentum $p$ by Fermi–Dirac or Bose–Einstein distributions.","The contribution of each species of particle to the energy density, pressure, and entropy of early universe can be computed."]
----------------
History: 
"""
"""
Original question: How does the Galois correspondence demonstrate the relationship between field extensions and subgroups of the Galois group?
Retrieval terms: ["Explain the relationship between field extensions and subgroups of the Galois group through Galois correspondence, including the correspondence of fixed fields, intermediate fields, and Galois groups.","Provide examples of Galois correspondence in specific cases, such as the splitting field of a polynomial or the field extension of a finite field."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the Instabilities and phase transitions in electronic systems.
"""
Original question: How to get energy spectrum of spin-density waves?
Retrieval terms: ["Start from the Hamiltonian of Hubbard model (only electron–electron interactions), Obtain energy spectrum of spin-density waves by mean field theory."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about Boson stars.
"""
Original question: 列举出玻色星的重要文献和学者。
Retrieval terms: ["List important studies and reference on Boson stars, include textbook, reviews, introduction, lecture, guide and survey.","List important scholars on Boson stars."]

## Counterexample:
----------------
History: 
"""
"""
Original question: Give examples or approximate expression of "spin weighted spheroidal function".
Retrieval terms: ["Introduce the concept of spin-weighted spheroidal harmonics (SWSH) as solutions to the spin-weighted spheroidal wave equation (SWSE)","Provide examples of SWSH in various contexts, such as in the study of gravitational waves and black hole perturbation theory","Explain the approximate expression of SWSH in terms of spin-weighted spherical harmonics (SWSH)"]

## Requirements
- Each "retrieval terms" should contain key information of "original question", yet should be an extension of "original question" with different focuses.
- Generally, you should avoid repeating content that has already been mentioned in [History]. Such as the case of Kerr geodesic, its "retrieval terms" don't include the definition of Kerr spacetime which has been mentioned.
- For professional and specific "original question", avoid making unreasonable generalizations to maintain the accuracy of "original question". For example, Should be spin weighted spheroidal function (SWSOH) instead of SWSH in [Counterexample].
- So you should think about when should expand semantics (expand horizontally) and when should focus specified concept (go deeper).
- If you think it's hard to generate satisfactory "retrieval terms", you can generate no "retrieval terms".
- "retrieval terms" must be in English. If "original question" contains Chinese characters, list of "retrieval terms" must include at least it's English version.

# Initialization
Please refer to the above [Example] and [Counterexample] to generate appropriate "retrieval terms" based on [Requirements], let's begin.
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
