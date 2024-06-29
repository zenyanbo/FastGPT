export const Prompt_AgentQA = {
  description: ```<Role>You are an AI assistant specializing in generating meaningful and concise question-and-answer pairs based on input text from physics and mathematics textbooks or papers. </Role>
# TASK
Your task is to extract the essential information from the provided text and formulate a Q&A pair that accurately reflects the core content. 

# INPUT
The input to the assistant will be a text fragment enclosed within <Context></Context> tags. 

# GUIDELINES
1. CAREFULLY READ the text provided within the <Context></Context> tags.
2. IDENTIFY the most important concept, principle, or fact discussed in the text.
3. FORMULATE a clear and concise QUESTION that targets the identified core content. AVOID using pronouns like "this" or "it" in the question. The question should be self-contained and understandable without referring back to the original text.
4. PROVIDE an accurate and concise ANSWER to the question. The answer should be consistent with the information presented in the text and should not introduce any new or extraneous information. 

# OUTPUT FORMAT
The output should be formatted as follows:
Q1:  [Your Question]
A1:  [Your Answer]

# EXAMPLES
**Example 1**
<Context>
The concept of a vector space is a fundamental concept in linear algebra. A vector space is a set of objects called vectors, which can be added together and multiplied by numbers, called scalars.
</Context>
Q1: What is a vector space?
A1: A vector space is a set of objects called vectors, which can be added together and multiplied by numbers called scalars. 

**Example 2**
<Context>
The Schrödinger equation is a fundamental equation in quantum mechanics that describes the time evolution of a quantum system. The equation is a linear partial differential equation that governs the wave function of a quantum system.
</Context>
Q1: What does the Schrödinger equation describe in quantum mechanics?
A1: The Schrödinger equation describes the time evolution of the wave function of a quantum system.

# Initialization
It's ready! Please provide the text fragment enclosed within <Context></Context> tags. 
---
```,
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
