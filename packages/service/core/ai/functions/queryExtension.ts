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

const defaultPrompt = `The task is to assist users in refining their natural language queries into improved reformulations for more effective information retrieval in theoretical physics and mathematics.

# INPUT
The input will be a natural language query from the user. This query may be vague, ambiguous, or contain colloquialisms. The format of the input include <HISTORY></HISTORY> and <QUERY></QUERY> tags. The <HISTORY> section provides the context of the conversation, including the user's previous queries and the result of information retrieval. The <QUERY> section contains the user's current query that you need to analyze and extend.

# STEPS
1. **ANALYZE QUERY:** Carefully examine the user's natural language query to understand the core concepts and information needs. Identify keywords, entities, and relationships between them in the context of historical conversation.
2. **GENERATE ALTERNATIVE DESCRIPTIONS:** Based on the analysis, BRAINSTORM potential ALTERNATIVE REFORMULATIONS from different angles to capture the core meaning and critical details of the query.
3. **BALANCE SPECIFICITY AND INTEGRITY:** Strike a balance between specificity and integrity of reformulation. For broader topics, introduce more specific Reformulations to narrow the scope and improve accuracy. However, when the query is already narrow and well-defined, exercise caution to avoid diverting from the original intent.
4. **FILTER AND RANK REFORMULATIONS:** Filter out reformulations that are too vague, ambiguous, or unrelated to the original query. Rank the remaining reformulations based on their relevance, specificity, and likelihood of yielding effective search results.
5. WRAP the remain Reformulations into square brackets []. Then output it.

# OUTPUT FORMAT
The output is only a standard list consist of alternative natural language descriptions. Similar to the following format, ["Reformulation 1","Reformulation 2","Reformulation 3",......]

# EXAMPLES
----------------
<HISTORY></HISTORY>
<QUERY>如何从 $SO(3)$ 群推导得到CG系数？</QUERY>
Reformulation list: ["Introduce the 'Clebsch-Gordan' coefficients from the 'group theory' perspective, and derive the 'Clebsch-Gordan' coefficients from the 'tensor product' of 'irreducible representations' of $SO(3)$ group.","Introduce the 'Wigner-Eckart' theorem and its relationship with 'Clebsch-Gordan' coefficients."]
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
Reformulation list: ["Review Kerr geodesic from Kerr metric and its symmetry, geodesic constants of motion and seperable Kerr geodesic equation, as well as its analytical solutions.","Analyze the orbital dynamics and properties of 'bound Kerr geodesic' from Kerr geodesic equations.","Discuss the properties of bound Kerr geodesic oscillations and introduce 'action-angle formalism'."]
----------------
<HISTORY></HISTORY>
<QUERY>Solve the following differential equation: $\\frac{dy}{dx} + 2y = e^{-x}$</QUERY>
Reformulation list: ["Solve the first-order linear ordinary differential equation $dy/dx + 2y = e^(-x)$ using the method of integrating factors. Derive the general solution of the differential equation and find the particular solution if an initial condition is given."]
----------------
<HISTORY></HISTORY>
<QUERY>What is quantum mechanics?</QUERY>
Reformulation list: ["Introduce quantum mechanics comprehensively. The response should include the following:\n1. Mathematical Foundations\n2. Postulates of Quantum Mechanics\n3. Fundamental Concepts\n4. Specific Systems and Applications\n5. Advanced Topics","Describe the Foundational Postulates and Mathematical Formalism of 'quantum mechanics', such as the definition of Hilbert space and state vector, operator as the quantization of observables, and the probabilistic interpretation of observables, the time evolution of quantum states, and measurement postulate (Born rule)","Explain the Key Features, Concepts and Phenomena of quantum mechanics, including 'wave-particle duality', quantum superposition, quantum entanglement, quantum measurement, and 'uncertainty principle'.","Discuss the different formalisms of quantum mechanics, including 'wave mechanics', 'matrix mechanics', 'Dirac notation', and 'path integral formulation'.", "Illustrate the 'quantum harmonic oscillator' as a fundamental model in quantum mechanics and its solutions in 'position space' and 'momentum space'.","Discuss the big, open and tight problem from the historical development and latest progress in quantum mechanics.","Introduce the Extensions and Applications of Quantum Mechanics, including but not limited to Quantum Field Theory, Quantum Statistical Mechanics, Quantum Computing."]
----------------
<HISTORY></HISTORY>
<QUERY>Consider the matrix $A = \\begin{pmatrix} 2 & 1 \\\\ -1 & 2 \\end{pmatrix}$. Find the eigenvalues and eigenvectors of matrix $A$.</QUERY>
Reformulation list: ["Find the eigenvalues of the matrix $A$ by solving the characteristic equation $det(A - λI) = 0$, where $λ$ represents the eigenvalues and $I$ is the identity matrix. Then Determine the eigenvectors corresponding to each eigenvalue by solving the equation $(A - λI)v = 0$, where $v$ represents the eigenvector."]
----------------
( Here assuming you don't know 'Taiji Program'. )
<HISTORY></HISTORY>
<QUERY>Write a detailed introduction to 'Taiji Program in Space'.</QUERY>
Reformulation list: []
----------------
<HISTORY></HISTORY>
<QUERY>对太极项目写一个详细的简介，生成一个知识图谱来介绍。</QUERY>
Reformulation list: ["Write a detailed introduction to 'Taiji Program in Space'."]
----------------
<HISTORY></HISTORY>
<QUERY>GeneralRelativity</QUERY>
Reformulation list: ["Comprehensively outline General Relativity, including its fundamental principles, mathematical formalism, key predictions, and experimental verifications. Discuss topics such as spacetime curvature, the Einstein field equations, and applications to black holes and cosmology.","Explain the mathematical foundations of General Relativity using tensor calculus and differential geometry, and how these tools are used to formulate the Einstein field equations and describe gravitational phenomena.","Discuss the experimental confirmations of General Relativity, including gravitational lensing, gravitational waves, time dilation, and the precession of planetary orbits, highlighting their significance in modern physics.", "Explore the implications of General Relativity in cosmology, such as models of the expanding universe, dark matter, dark energy, and the cosmic microwave background radiation.", "Examine current challenges and open questions in General Relativity, including efforts to reconcile it with quantum mechanics, the nature of singularities, and the development of a quantum theory of gravity."]

# NOTES
- Ensure alternative reformulations capture the core meaning and critical details of the query without diverting from the original intent. Therefore, pay attention to the following two points. 1. Exercise caution when generating reformulations for narrow and well-defined queries to avoid introducing unnecessary specificity. 2. Filter out reformulations that are too vague, ambiguous, or unrelated to the original query.
- Alternative reformulations MUST be CORRECT, REASONABLE, CONSISTENT, INSIGHTFUL and VALUABLE.
- Generally, it is enough to generate about 3 iterms in the output list, or less, but the maximum number should not exceed 6 iterms.
- Each reformulation should be context-independent, semantically complete and self-contained.
- Mathematical formulas should be wrapped in $ or $$.
- For clarity, AVOID ABBREVIATE and PRONOUNS in these reformulations.
- As long as "Query" contains CHINESE CHARACTERS, MUST ATTACH an improved ENGLISH VERSION of "Query" into list (regardless of the case). Note, the correspondence between Chinese and English professional terms.
- The examples provided are ideal and simplified. Actual situations will be significantly more complex.
- It is best to use some common cognitive skills of physicists to come up with some insightful statements, including but not limited to analysis (qualitative, quantitative, first principles), critical thinking, modeling (assumption, approximation, estimation), etc.

# INITIALIZATION
Only generate a list including reformulations without any additional tag, format, text or explanations.
----------------
<HISTORY>{{histories}}</HISTORY>
<QUERY>{{query}}</QUERY>
Reformulation list: `;

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
