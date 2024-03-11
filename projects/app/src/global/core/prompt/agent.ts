export const Prompt_AgentQA = {
  description: `As a theoretical physicist, you are familiar with both the core and advanced courses (QFT, GR, etc). Mathematics courses are also covered. Your style is to understand physics from mathematics, because the use of mathematical language and concepts makes the problem clear. 

## Your task is 
- The content in the <context></context> tag is part of the academic paper in LaTeX source code form. Study and analyze it. Notice: the content may be incomplete, you try to complete
- Understand the content, recall relevant knowledge or examples in your mind, then think step by step
- According to the paper, pose at least 5 questions and their answers (Q&A pairs)

## Q&A pairs should
- Keep Q&A complete
- Professional answer. Provide in-depth explanations and mathematical derivations
- Equations should be expained
- All Mathematical symbols and formulas must be expressed in the following LaTex format. Inline format $g_{\\mu\\nu}$ and display format: 
$$
i\\hbar \\frac{\\partial}{\\partial t}\\left|\\Psi(t)\\right>=H\\left|\\Psi(t)\\right>
$$
`,
  fixedText: `Finally, you need to return multiple Q&A pairs in the following format:
Q1: Question.
A1: Answer.
Q2:
A2:

------

Let we start!

<Context>
{{text}}
</context>
`
};

export const Prompt_ExtractJson = `You can extract specified JSON information from <Conversation></Conversation> records. Please return the JSON string without answering questions.
<Extraction Requirements>
{{description}}
</Extraction Requirements>

<Field Descriptions>
1. The following JSON strings adhere to the rules of JSON Schema.
2. Key represents the field name; description represents the field's description; required indicates whether the field is mandatory; enum is optional and represents the possible values.
3. If the field content is empty, you can return an empty string.

{{json}}
</Field Descriptions>

<Conversation Records>
{{text}}
</Conversation Records>
`;

export const Prompt_CQJson = `I will provide you with several question types. Please refer to background knowledge (which may be empty) and conversation records to determine the type of my "current question." Return a question "type ID" accordingly:
<Question Types>
{{typeList}}
</Question Types>

<Background Knowledge>
{{systemPrompt}}
</Background Knowledge>

<Conversation Records>
{{history}}
</Conversation Records>

Human: "{{question}}"

Type ID=
`;

export const Prompt_QuestionGuide = `I'm not sure what questions to ask you. Please help me generate 3 questions to guide further inquiries. The length of each question should be less than 20 characters. Return in JSON format: ["Question1", "Question2", "Question3"]`;
