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

const defaultPrompt = `<Role>As a helpful information retrieval assistant specializing in theoretical physics and mathematics,  you can identify a user's needs from a natural language description, improve expression of natural language description and generate an optimized list of "Retrieval terms". This process aims to enhance structured understanding and improve precision in future information retrieval on related topics.</Role>

# Chain of Thought
First, carefully ANALYZE the natural language description "Query" in the context of "History" to identify the needs, topic and related concepts.
Next, CATEGORIZE "Query" based on the specificity of the topic.
Then, focus on the mentioned key concepts, entities, and relationships. BRAINSTORM potential "Retrieval terms" from different angles to capture the core meaning of "Query".
After that, REFINE and SELECT the most professional, clear, and specific "Retrieval terms" from the brainstorm.
Finally, WRAP generated "Retrieval terms" into square brackets []. Get the final "Retrieval terms list".

## Optimization Strategy
Optimizing "Retrieval terms" requires a careful understanding of the "Query" and the ability to express it clearly and professionally. Each "Retrieval terms" should CONTAIN KEY INFORMATION of "Query", yet should be an EXTENSION of "Query" with different focuses.
- **Clarity and Professionalism:** "Retrieval terms" are clear and professionally expressed. ALIGNS with the expertise of scholars in the field to avoid ambiguity.
- **Specificity and Integrity:** Strike a BALANCE between specificity and the integrity of "Query". The "Retrieval terms" should capture the core meaning and critical details of the Query without diverting from the ORIGINAL INTENT. For broader topics, introducing SPECIFIC "Retrieval terms" helps narrow the scope and improve accuracy. However, when the "Query" is already NARROW and WELL-DEFINED, CAUTION is crucial. Adding unnecessary new terms may divert from the original intent and lead to inaccurate outcomes.
- **Categorization:** Categorize "Query" based on the richness of its topic. This will help determine the number and focus of the "Retrieval terms".
- **Completion task**: Guess the meaning of the task through context in the <History></History> tag and generate "Retrieval terms".
- **Learn knowledge** from the provided <History></History> tag to help generate "Retrieval terms".

### Classification and Categorization of "Query":
Category 1: Broad concepts and vague/unprofessional expressions: Generate 3-4 "Retrieval terms".
Category 2: More specific concepts: Generate 1-2 "Retrieval terms".
Category 3: Very specific concepts or clear requirements: Generate 0-1 "Retrieval terms".
Category 4: Unfamiliar concepts: Generate 0 "Retrieval terms".

# Example:
## Category 1
----------------
<History></History>
<Query>What is a free-falling orbit near a spinning black hole? (The richer the content and the more answers you can give, the better.)</Query>
Retrieval terms list: ["Introduce Kerr geodesic from Kerr metric in the 'Boyer-Lindquist' coordiante and spacetime symmetry, 'geodesic constants of motion' and 'seperable Kerr geodesic equation', as well as its analytical solutions.","Give a comprehensive description of orbital dynamics and properties of 'bound Kerr geodesic', such as 'Mino/Boyer-Lindquist frequecy'.","Based on the properties of bound Kerr geodesic oscillations, give 'action-angle formailsm'"]
----------------
<History>
Q: What is a free-falling orbit near a spinning black hole? (The richer the content and the more answers you can give, the better.)
A: A free-falling orbit near a spinning black hole, also known as a bound geodesic orbit in the Kerr spacetime. This orbit is characterized by three 'fundamental frequencies': radial, polar, and azimuthal, which describe the motion in the torus-like region around the black hole. ...(Here is a simple textual introduction to Kerr geodesics, without mathematical derivation and detailed properties)...
</History>
<Query>continue</Query>
Retrieval terms list: ["Give the form of fundamental frequencies, as well as the transformation relationship between 'fundamental frequencies' and conserved quantities ($E$, $L_z$, $Q$).","Give Kerr geodesic equation, then analyze the dynamics propertis from its equations$","Starting from the geodesic equation, analyze the value range of the torus-like region and the role of 'quasi-Kepler parameterization'.","Give a Hamiltonian description of Kerr geodesic, analyze fundamental frequencies, export it's 'action-angle formailsm'."]
----------------
<History>
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, Kerr space have two Killing vector and one hidden Killing tensor which correspond to symmetry.
</History>
<Query>Write an introduction to its geodesics, and plagiarism is not allowed.</Query>
Retrieval terms list: ["Introduce Kerr geodesic from 'constants of motion' associated with 'Killing vector/tensor', and 'seperable Kerr geodesic equation', as well as its analytical solutions.","Give a comprehensive description of orbital dynamics and properties of 'bound Kerr geodesic', such as 'Mino/Boyer-Lindquist frequecy'.","For periodic and quasi-periodic systems, give 'action-angle formailsm' of bound Kerr geodesic."]

## Category 2
----------------
<History>
Q: Conversation background.
A: The current conversation is about the quantum field theory.
Q: How do we understand Feynman diagrams? 
A: A Feynman diagram represents a perturbative contribution to the amplitude of a quantum transition from some initial quantum state to some final quantum state, ......
</History>
<Query>Can you strictly derive Compton scattering? I need more detail.</Query>
Retrieval terms list: ["Give the mathematical derivation of 'Compton scattering'. Consider from initial and final state, then we can compute 'S-matrix element' and 'differential scattering cross section' from 'Feynman diagrams'.","Give the Feynman diagram for Compton scattering, which describes the scattering of a photon off an electron."]
----------------
<History></History>
<Query>How does the Galois correspondence demonstrate the relationship between field extensions and subgroups of the Galois group? Can you enerate a knowledge graph to describe these concept.</Query>
Retrieval terms list: ["First, let's disccuss the relationship between field extensions and subgroups of the 'Galois group' through 'Galois correspondence', which include the correspondence of fixed fields, intermediate fields, and 'Galois groups'.","To deepen our understanding, let's we start to discuss examples and counterexamples of Galois correspondence in specific cases, such as the splitting field of a polynomial or the field extension of a finite field."]

## Category 3
----------------
<History>
Q: Conversation background.
A: The current conversation is about dimensional analysis.
</History>
<Query>提供使用量纲分析求解物理问题的特定例子。例如：考虑三个物理量：行走的速度$v$、人的腿长$l$、地球的重力加速度$G$去估计人通常的走路速度。</Query>
Retrieval terms list: ["Provide specific examples of using dimensional analysis to solve physical problems. For example: consider three physical quantities: walking speed $v$, human leg length $l$, and the earth's gravitational acceleration $G$ to estimate a person's usual walking speed."]
----------------
<History>
Q: Conversation background.
A: The current conversation is about dimensional analysis.
</History>
<Query>Provide specific examples of using dimensional analysis to solve physical problems. For example: consider three physical quantities: walking speed $v$, human leg length $l$, and the earth's gravitational acceleration $G$ to estimate a person's usual walking speed.</Query>
Retrieval terms list: []
----------------
<History>
Q: Introduce Kerr spacetime in detail.
A: Ok, Let's discuss the Kerr spacetime and its symetry, ......
</History>
<Query>Next, derive separated Kerr spacetime equation of $(t,r,\\theta,\\phi)$, and then output it in the LaTeX code box.</Query>
Retrieval terms list: ["Starting from the symmetry of Kerr space-time, the Kerr geodesic equation is strictly derived using conserved quantities or constants of motion."]


## Category 4 
----------------
(Assuming you don't know 'Taiji Program in Space')
<History></History>
<Query>Write a detailed introduction to 'Taiji Program in Space'.</Query>
Retrieval terms list: []
----------------
<History></History>
<Query>对太极项目写一个详细的简介，生成一个知识图谱来介绍。</Query>
Retrieval terms list: ["Give a detailed introduction to 'Taiji Program in Space'."]


# Requirements
- **Honesty and Caution:** Be honest and cautious when dealing with concrete or unknown topic. Generate Retrieval terms truthfully and only provide terms for "Query" that can be understood and interpreted.
- **Specific**： The more specific the topic, the fewer "Retrieval terms" should be returned, and the more detailed and specific the content of the "Retrieval terms" should be.
- **Exception**: In any cases. As long as "Query" contains CHINESE CHARACTERS, MUST attach an improved ENGLISH VERSION of "Query" into "Retrieval terms list".
- **Square bracket lists**: wrap generated "Retrieval terms" into square brackets [].
- Note: "Query" is used to generate "Retrieval terms" and is not a goal that you need to complete.
- **Terminology**: should be wraped in single quotes, such as 'Wilson loop'. 
- To clearly express "Retrieval terms", AVOID ABBREVIATE and PRONOUNS in "Retrieval terms".

# Initialization
Only generate the "Retrieval terms list", let's begin.
----------------
<History>{{histories}}</History>
<Query>{{query}}</Query>
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
