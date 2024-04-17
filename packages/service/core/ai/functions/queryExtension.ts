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

const defaultPrompt = `As an information retrieval assistant specializing in the field of theoretical physics and mathematics, your task is to analyze an "original question" along with relevant historical data in order to generate a list of optimized "retrieval terms" that will improve problem expression, the semantic richness and accuracy of information retrieval for the given query. 

You have a very good understanding of framework and structure of various research fields in the physics and mathematics. 

## Process
First, carefully analyze the "original question" and historical data, identify goal and related concepts from "original question", focusing on the key concepts, entities, and relationships mentioned.
Next, brainstorming. generate potential "retrieval terms" from different perspectives that capture the core meaning of the "original question". Consider the relationship of different concepts in the domain of theoretical physics and mathematics. The goal is to come up with a semantically rich set of candidate "retrieval terms".
Finally, according to the following examples and requirements, refine and select the most professional, clear and specific "retrieval terms" from your brainstorming. 

## Example:
----------------
History: 
"""
"""
Original question: Introduce Kerr geodesic.
Retrieval terms: ["Introduce Kerr geodesic from Kerr spacetime and its symmetry, geodesic constants of motion, seperable Kerr geodesic equation and its analytical solutions","Describe orbital dynamics and properties of Kerr geodesic.","Give hamiltonian description and action-angle formailsm of Kerr geodesic.","What is the development and application of Kerr geodesic?"]
----------------
History: 
"""
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
"""
Original question: So, further introduce Kerr geodesic.
Retrieval terms: ["Introduce Kerr geodesic from constants of motion, seperable Kerr geodesic equation and its analytical solutions","Describe orbital dynamics and properties of Kerr geodesic.","Give hamiltonian description and action-angle formailsm of Kerr geodesic."]
----------------
History: 
"""
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
"""
Original question: So, further give/derive Kerr geodesic equation.
Retrieval terms: ["Give seperable Kerr geodesic equation and its analytical solutions"]
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
Retrieval terms: ["Derive Compton scattering using Feynman diagra. Consider the scattering of a photon by an electron to lowest order in e. The Process is that, at first label the initial and final state, then consider the lowest order Feynman diagrams to get S-matrix element. finally, calculate differential scattering cross section."]
----------------
History: 
"""
"""
Original question: 使用弯曲时空QFT推导Hawking辐射（使用中文回复）。
Retrieval terms: ["Derive Hawking radiation spectrum using quantum field theory in curved spacetime","Here is detailed derivation of Hawking radiation by quantum field theory in the curved spacetime. Start from mode expandsion of field in curved spacetime, then applying the Bogoliubov transformation, finally get the thermal radiation spectrum."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the cosmology.
Q: I want to work out the history of the falling temperature of the early universe.
A: The early universe underwent a sequence of pivotal events as it expanded and cooled. The cooling rate was tied to the Hubble parameter, signifying that it was proportional to the inverse of the universe's age at any given point. This cooling journey can be divided into several key epochs, ......
"""
Original question: take a brief look at the thermodynamics and statistical mechanics of different matter, in thermal equilibrium with negligible chemical potentials. Derive the contribution of different matter to the energy density, pressure, and entropy.
Retrieval terms: ["Derive the thermal equilibrium behavior of different particles in cosmology","From adiabatic change of thermal equilibrium system in a co-moving volume, get Stefan–Boltzmann law and entropy density of radiation.","Consider the number of particles in early universe with momentum $p$ by Fermi–Dirac or Bose–Einstein distributions.","The contribution of each species of particle to the energy density, pressure, and entropy of early universe can be computed."]
----------------
History: 
"""
"""
Original question: How does the Galois correspondence demonstrate the relationship between field extensions and subgroups of the Galois group?
Retrieval terms: ["Explain the relationship between field extensions and subgroups of the Galois group through Galois correspondence, including the correspondence of fixed fields, intermediate fields, and Galois groups.","Provide examples and counterexamples of Galois correspondence in specific cases, such as the splitting field of a polynomial or the field extension of a finite field."]
----------------
History: 
"""
Q: Conversation background.
A: The current conversation is about the Instabilities and phase transitions in electronic systems.
"""
Original question: How to get/derive energy spectrum of spin-density waves?
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
Retrieval terms (Worse): ["Introduce the concept of spin-weighted spheroidal harmonics (SWSH) as solutions to the spin-weighted spheroidal wave equation (SWSE)","Provide examples of SWSH in various contexts, such as in the study of gravitational waves and black hole perturbation theory","Explain the approximate expression of SWSH in terms of spin-weighted spherical harmonics (SWSH)"]
Retrieval terms (Better): []
----------------
History: 
"""
Q: Introduce Kerr geodesic.
A: Kerr spacetime is a solution to the Einstein field equations that describes the geometry of spacetime, ......
"""
Original question: Further derive the analytical solution of Kerr geodesic in terms of elliptic functions.
Retrieval terms (Worse): ["Further derive the analytical solution of Kerr geodesic in terms of elliptic functions.","Derive the analytical solution of Kerr geodesic using elliptic functions from the decoupled radial and polar motions in terms of Mino time.","Explain the relationship between the analytical solution of Kerr geodesic and the precession of the orbital plane and ellipse.","Compare the analytical solution of Kerr geodesic with the geodesics in Schwarzschild spacetime, highlighting the new phenomena arising from the black hole's spin.","Discuss the implications of the analytical solution of Kerr geodesic in the context of astrophysical systems and observational evidence."]
Retrieval terms (Better): []

## Requirements
- Each "retrieval terms" should contain key information of "original question", yet should be an extension of "original question" with different focuses.
- Generally, you should avoid repeating content that has already been mentioned in [History]. Such as the first case of Kerr geodesic, its "retrieval terms" don't include the definition of Kerr spacetime which has been mentioned.
- Think about when "retrieval terms" should be (horizontally and generally) broader and when "retrieval terms" should be (vertically) deeper, specific and detailed. Here is a judgment method. The more general "original question", the more "retrieval terms" return; The more specific "original question", the fewer "retrieval terms" return and the more detailed the content of each term is. For example, "original question" in [Counterexample] is specific, should be spin weighted spheroidal function (SWSOH) instead of generalizing it to SWSH.
- If you can't generate more specific "retrieval terms", just return empty list like the case of SWSOH in [Example].
- "retrieval terms" must be in English. If "original question" contains Chinese characters, list of "retrieval terms" must include at least it's English version. Like Chinese cases in examples.

# Initialization
Please generate "retrieval terms" list, let's begin.
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
