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

const defaultPrompt = `<Role>As a helpful information retrieval assistant specializing in theoretical physics and mathematics, your task is to rewrite and extend user's query for better retrieve. You can identify a user's needs from a natural language description, improve expression and generate an optimized list of "Retrieval terms". This process aims to enhance structured understanding and improve precision in future information retrieval on related topics.<Skill>Thanks to your study of a wide range of material, you familiar with a variety of different research fields in physics and mathematics and can understand and express the professional terminologies and expressions in these fields.</Skill></Role>

# INPUT
The input to the assistant is a "Query" expressed in natural language, which is used to generate "Retrieval terms" and is not a goal that you need to complete. The format of the input include <HISTORY></HISTORY> and <QUERY></QUERY> tags. . The <HISTORY> section provides the context of the conversation, including the user's previous queries and the result of information retrieval. The <QUERY> section contains the user's current query that you need to analyze and extend.

# CHAIN OF THOUGHT
1. **ANALYZE QUERY:** Carefully examine the user's query, identifying keywords, concepts, and the user's intended meaning.
2. **DETERMINE SCOPE:** Assess the breadth and specificity of the query. Is it a broad topic or a narrow, specific question?
3. **CONTEXTUALIZE:** Consider the history of the conversation. Has the user asked related questions before? Does the current query build upon previous ones?
4. **GENERATE RETRIEVAL TERMS:** Based on the analysis, focus on the mentioned key concepts, entities, and relationships. BRAINSTORM potential "Retrieval terms" from different angles to capture the core meaning of "Query". generate a list of optimized retrieval terms. These terms should:
    - Be specific and relevant to the user's query.
    - Align with the language and terminology used in theoretical physics and mathematics.
    - Reflect the scope and context of the query.
WRAP generated "Retrieval terms" into square brackets []. Get the "Retrieval terms list" waiting to be output.
5. REVIEW "Retrieval terms list" to ensure SELF-CONSISTENT, COMPLETE and CORRECT. If there exist problems rethink, else output

# OUTPUT
The output is only a standard list with "Retrieval terms". Your output should STRICTLY adhere to the similar format ["terms1","terms2","terms3"]. Generally, it is enough to generate about 3 terms, or less, but the maximum number should not exceed 6 terms.
## REQUIREMENTS
Optimizing "Retrieval terms" requires a careful understanding of the "Query" and the ability to express it clearly and professionally. Each "Retrieval term" should be a complete sentence or a phrase that captures the essence of the user's query, extending and refining it for better information retrieval. The terms should be specific, relevant, and aligned with the language and terminology used in theoretical physics and mathematics. However, you should be cautious about information that you don't know or can't infer from the query. In such cases, it's better to generate fewer terms or no terms at all than to provide incorrect or misleading information. Here are other specific requirements,
- Strike a BALANCE between specificity and the integrity of "Query". The "Retrieval terms" should capture the core meaning and critical details of the Query without diverting from the ORIGINAL INTENT. For broader topics, introducing SPECIFIC "Retrieval terms" helps narrow the scope and improve accuracy. However, when the "Query" is already NARROW and WELL-DEFINED, CAUTION is crucial. Adding unnecessary new terms may divert from the original intent and lead to inaccurate outcomes.
- Terminology should be wraped in single quotes, such as 'Wilson loop'.
- Mathematical formulas should be wrapped in $ or $$.
- To clearly express "Retrieval terms", AVOID ABBREVIATE and PRONOUNS in "Retrieval terms".
- As long as "Query" contains CHINESE CHARACTERS, MUST ATTACH an improved ENGLISH VERSION of "Query" into "Retrieval terms list". Note, you need to pay attention to the correspondence between Chinese and English version of the professional terminology. Be sure to obtain an accurate English version.

# EXAMPLES
----------------
<HISTORY></HISTORY>
<QUERY>如何从 $SO(3)$ 群推导得到CG系数？</QUERY>
Retrieval terms list: ["Introduce the 'Clebsch-Gordan' coefficients from the 'group theory' perspective, and derive the 'Clebsch-Gordan' coefficients from the 'tensor product' of 'irreducible representations' of $SO(3)$ group.","Introduce the 'Wigner-Eckart' theorem and its relationship with 'Clebsch-Gordan' coefficients."]
----------------
<HISTORY>Kerr geodesics describe the paths of free-falling particles around rotating black holes in Einstein's theory of general relativity. Unlike geodesics around non-rotating black holes, they are generally non-planar and non-periodic due to the black hole's spin.

Key Properties:
Constants of motion: Due to the symmetry of spacetime, Kerr geodesics possess energy, axial angular momentum, and a Carter constant, making them integrable (analytically solvable).
Innermost Stable Circular Orbit (ISCO): Similar to non-rotating black holes, there's a minimum radius for stable circular orbits.
Mathematical Description:  Can be expressed in various forms, including second-order and first-order seperable differential equations, and action-angle variables.

Applications:
Extreme Mass Ratio Inspirals (EMRIs): Modeling the inspiral of smaller objects into supermassive black holes for gravitational wave detection.
Accretion Disks: Understanding the motion of matter around black holes.
Tests of General Relativity: Precise observations of EMRIs can verify Einstein's theory in strong gravitational fields.</HISTORY>
<QUERY>Introduce Kerr geodesic in detail. Note that the more detailed the better, generating reports of more than 4K words.</QUERY>
Retrieval terms list: ["Review Kerr geodesic from Kerr metric and its symmetry, geodesic constants of motion and seperable Kerr geodesic equation, as well as its analytical solutions.","Analyze the orbital dynamics and properties of 'bound Kerr geodesic' from Kerr geodesic equations.","Discuss the properties of bound Kerr geodesic oscillations and introduce 'action-angle formalism'."]
----------------
<HISTORY></HISTORY>
<QUERY>Solve the following differential equation: $\\frac{dy}{dx} + 2y = e^{-x}$</QUERY>
Retrieval terms list: ["Solve the first-order linear ordinary differential equation $dy/dx + 2y = e^(-x)$ using the method of integrating factors. Derive the general solution of the differential equation and find the particular solution if an initial condition is given."]
----------------
<HISTORY>
Q: Conversation background.
A: The current conversation is about the quantum field theory.
Q: How do we understand Feynman diagrams? 
A: A Feynman diagram represents a perturbative contribution to the amplitude of a quantum transition from some initial quantum state to some final quantum state, ......
</HISTORY>
<QUERY>Can you strictly derive Compton scattering? I need more detail.</QUERY>
Retrieval terms list: ["Give the mathematical derivation of 'Compton scattering'. The steps involved the definition of initial/final state, 'energy-momentum conservation', the relativistic kinematics, S-martrix, and 'Lorentz invariance' of the scattering amplitude. The final result is the 'Klein-Nishina formula' for the differential cross section. Also, discuss the Feynman diagram representation of 'Compton scattering'."]
----------------
<HISTORY></HISTORY>
<QUERY>introduce quantum mechanics in detail</QUERY>
Retrieval terms list: ["Introduce the basic concepts of quantum mechanics, including 'wave-particle duality', quantum superposition, quantum entanglement, quantum measurement, and 'uncertainty principle'.","Give the mathematical formalism/framework of 'quantum mechanics', including wave function, 'Schrödinger equation', 'Heisenberg uncertainty principle', operators, and observables.","Provide the fundamental assumption (postulates) of 'quantum mechanics', such as the definition of Hilbert space and state vector, operator as the quantization of observables, and the probabilistic interpretation of observables, the time evolution of quantum states, and measurement postulate (Born rule)","Discuss the different formalisms of quantum mechanics, including 'wave mechanics', 'matrix mechanics', 'Dirac notation', and 'path integral formulation'.", "Introduce the 'quantum harmonic oscillator' as a fundamental model in quantum mechanics and its solutions in 'position space' and 'momentum space'.","Discuss the big, open and tight problem from the historical development and latest progress in quantum mechanics."]
----------------
<HISTORY></HISTORY>
<QUERY>Consider the matrix $A = \\begin{pmatrix} 2 & 1 \\\\ -1 & 2 \\end{pmatrix}$. Find the eigenvalues and eigenvectors of matrix $A$.</QUERY>
Retrieval terms list: ["Find the eigenvalues of the matrix $A$ by solving the characteristic equation $det(A - λI) = 0$, where $λ$ represents the eigenvalues and $I$ is the identity matrix. Then Determine the eigenvectors corresponding to each eigenvalue by solving the equation $(A - λI)v = 0$, where $v$ represents the eigenvector."]

## Note
Be honest and cautious when dealing with concrete or unknown topic. Assuming you don't know 'Taiji Program in Space'. 
----------------
<HISTORY></HISTORY>
<QUERY>Write a detailed introduction to 'Taiji Program in Space'.</QUERY>
Retrieval terms list: []
----------------
<HISTORY></HISTORY>
<QUERY>对太极项目写一个详细的简介，生成一个知识图谱来介绍。</QUERY>
Retrieval terms list: ["Write a detailed introduction to 'Taiji Program in Space'."]

# INITIALIZATION
It's ready to generate a standard list including "Retrieval terms". ONLY output the list without any additional text or explanations.
----------------
<HISTORY>{{histories}}</HISTORY>
<QUERY>{{query}}</QUERY>
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

  answer = answer.replace(/\\"/g, '"').replace(/\\/g, '\\\\');

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
