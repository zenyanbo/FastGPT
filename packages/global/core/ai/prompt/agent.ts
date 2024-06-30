export const Prompt_AgentQA = {
  description: `<Role>You are an AI assistant specializing in generating meaningful and detailed question-and-answer pairs based on input text from physics and mathematics textbooks or papers. </Role>
# TASK
Your task is to extract the essential information from the provided text and formulate a Q&A pair that accurately reflects the core content. 

# INPUT
The input to the assistant will be a text fragment enclosed within <Context></Context> tags. 

# GUIDELINES
1. CAREFULLY READ the provided text within the <Context></Context> tags.
2. IDENTIFY the most important concept, principle, equations, or arguments in the text.
3. FORMULATE a clear and detailed question that targets this core concept. AVOID using pronouns like "this" that refer back to the text; the question should be understandable standalone.
4. GENERATE a detailed, accurate and comprehensive answer to your question, ensuring it covers the essential information from the text. 
5. The answer should be SELF-CONTAINED and not rely on the reader having access to the original text.
6. Ensure the answer incorporates relevant mathematical expressions and equations presented in the text.

# OUTPUT FORMAT
The output should be formatted as follows:
Q1:  [Your Question]
A1:  [Your Answer]
## LaTeX Format Requirements
- INLINE FORMAT: wrap LaTeX expressions into single dollar signs $, e.g., $g_{\\mu\\nu}$.
- DISPLAY FORMAT, wrap LaTeX expressions into double dollar signs $$, e.g., 
$$
i\\hbar \\frac{\\partial}{\\partial t}\\left|\\Psi(t)\\right>=H\\left|\\Psi(t)\\right>
$$.

# Example for reference
<Context>
The Lagrangian of a simple harmonic oscillator is given by 
$$
L = \\frac{1}{2}m\\dot{x}^2 - \\frac{1}{2}kx^2,
$$
where $m$ is the mass, $k$ is the spring constant, and $x$ is the displacement from equilibrium. Using the Euler-Lagrange equation 
$$
\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot{x}} - \\frac{\\partial L}{\\partial x} = 0,
$$
we can derive the equation of motion for the oscillator.
</Context>
Q1: What is the equation of motion for a simple harmonic oscillator, derived from its Lagrangian?
A1: The Lagrangian of a simple harmonic oscillator is given by 
$$
L = \\frac{1}{2}m\\dot{x}^2 - \\frac{1}{2}kx^2,
$$
where $m$ is the mass, $k$ is the spring constant, and $x$ is the displacement from equilibrium. Applying the Euler-Lagrange equation,
$$
\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot{x}} - \\frac{\\partial L}{\\partial x} = 0,
$$
we obtain
$$
\\frac{d}{dt}(m\\dot{x}) + kx = 0.
$$
This simplifies to the equation of motion for the simple harmonic oscillator:
$$
m\\ddot{x} + kx = 0.
$$

# Initialization
It's ready! Please provide the text fragment enclosed within <Context></Context> tags. Remember to ONLY output Q&A pair without any additional text or explanations.
---
`,
  fixedText: `
<Context>
{{text}}
</Context>
`
};

export const Prompt_ExtractJson = `你可以从 <对话记录></对话记录> 中提取指定 JSON 信息，你仅需返回 JSON 字符串，无需回答问题。
<提取要求>
{{description}}
</提取要求>

<字段说明>
1. 下面的 JSON 字符串均按照 JSON Schema 的规则描述。
2. key 代表字段名；description 代表字段的描述；enum 是可选值，代表可选的 value。
3. 如果没有可提取的内容，忽略该字段。
4. 本次需提取的JSON Schema：{{json}}
</字段说明>

<对话记录>
{{text}}
</对话记录>
`;

export const Prompt_CQJson = `我会给你几个问题类型，请参考背景知识（可能为空）和对话记录，判断我“本次问题”的类型，并返回一个问题“类型ID”:
<问题类型>
{{typeList}}
</问题类型>

<背景知识>
{{systemPrompt}}
</背景知识>

<对话记录>
{{history}}
</对话记录>

Human："{{question}}"

类型ID=
`;
