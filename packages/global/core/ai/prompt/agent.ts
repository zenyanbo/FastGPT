export const Prompt_AgentQA = {
  description: `As an expert in the fields of physics, mathematics and computer science, you uniquely synthesizes the profound intuition of a physicist, the rigorous logic of a mathematician, and the computational and pratical thinking of a computer scientist.
  
  The input <Context></Context> tag contains a text passage. Study and analyze it, and organize your learning results:
- Raise questions and provide answers for each question.
- Answers should be detailed and complete, preserving original descriptions when possible, with appropriate extensions.
- Answers can include plain text, links, code, tables, formulas, media links, and other Markdown elements.
- Raise at most 50 questions.
- Generate questions and answers in the same language as the source text.
`,
  fixedText: `Please organize your learning results in the following format:
<Context>
Text
</Context>
Q1: Question.
A1: Answer.
Q2:
A2:

------

Let's begin!

<Context>
{{text}}
</Context>
`
};

export const getExtractJsonPrompt = ({
  schema,
  systemPrompt,
  memory
}: {
  schema?: string;
  systemPrompt?: string;
  memory?: string;
}) => {
  const list = [
    '【历史记录】',
    '【用户输入】',
    systemPrompt ? '【背景知识】' : '',
    memory ? '【历史提取结果】' : ''
  ].filter(Boolean);
  const prompt = `## 背景
用户需要执行一个函数，该函数需要一些参数，需要你结合${list.join('、')}，来生成对应的参数

## 基本要求

- 严格根据 JSON Schema 的描述来生成参数。
- 不是每个参数都是必须生成的，如果没有合适的参数值，不要生成该参数，或返回空字符串。
- 需要结合历史记录，一起生成合适的参数。

${
  systemPrompt
    ? `## 特定要求
${systemPrompt}`
    : ''
}

${
  memory
    ? `## 历史提取结果
${memory}`
    : ''
}

## JSON Schema

${schema}

## 输出要求

- 严格输出 json 字符串。
- 不要回答问题。`.replace(/\n{3,}/g, '\n\n');

  return prompt;
};
export const getExtractJsonToolPrompt = ({
  systemPrompt,
  memory
}: {
  systemPrompt?: string;
  memory?: string;
}) => {
  const list = [
    '【历史记录】',
    '【用户输入】',
    systemPrompt ? '【背景知识】' : '',
    memory ? '【历史提取结果】' : ''
  ].filter(Boolean);
  const prompt = `## 背景
用户需要执行一个叫 "request_function" 的函数，该函数需要你结合${list.join('、')}，来生成对应的参数

## 基本要求

- 不是每个参数都是必须生成的，如果没有合适的参数值，不要生成该参数，或返回空字符串。
- 需要结合历史记录，一起生成合适的参数。最新的记录优先级更高。
- 即使无法调用函数，也要返回一个 JSON 字符串，而不是回答问题。

${
  systemPrompt
    ? `## 特定要求
${systemPrompt}`
    : ''
}

${
  memory
    ? `## 历史提取结果
${memory}`
    : ''
}`.replace(/\n{3,}/g, '\n\n');

  return prompt;
};

export const getCQSystemPrompt = ({
  systemPrompt,
  memory,
  typeList
}: {
  systemPrompt?: string;
  memory?: string;
  typeList: string;
}) => {
  const list = [
    systemPrompt ? '【背景知识】' : '',
    '【历史记录】',
    memory ? '【上一轮分类结果】' : ''
  ].filter(Boolean);
  const CLASSIFY_QUESTION_SYSTEM_PROMPT = `## 角色
你是一个"分类助手"，可以结合${list.join('、')}，来判断用户当前问题属于哪一个分类，并输出分类标记。

${
  systemPrompt
    ? `## 背景知识
${systemPrompt}`
    : ''
}

${
  memory
    ? `## 上一轮分类结果
${memory}`
    : ''
}

## 分类清单

${typeList}

## 分类要求

1. 分类结果必须从分类清单中选择。
2. 连续对话时，如果分类不明确，且用户未变更话题，则保持上一轮分类结果不变。
3. 存在分类冲突或模糊分类时， 主语指向的分类优先级更高。

## 输出格式

只需要输出分类的 id 即可，无需输出额外内容。`.replace(/\n{3,}/g, '\n\n');

  return CLASSIFY_QUESTION_SYSTEM_PROMPT;
};

export const QuestionGuidePrompt = `You are an AI assistant tasked with predicting the user's next question based on the conversation history. Your goal is to generate 3 potential questions that will guide the user to continue the conversation. When generating these questions, adhere to the following rules:

1. Use the same language as the user's last question in the conversation history.
2. Keep each question under 20 characters in length.

Analyze the conversation history provided to you and use it as context to generate relevant and engaging follow-up questions. Your predictions should be logical extensions of the current topic or related areas that the user might be interested in exploring further.

Remember to maintain consistency in tone and style with the existing conversation while providing diverse options for the user to choose from. Your goal is to keep the conversation flowing naturally and help the user delve deeper into the subject matter or explore related topics.`;

export const QuestionGuideFooterPrompt = `Please strictly follow the format rules: \nReturn questions in JSON format: ['Question 1', 'Question 2', 'Question 3']. Your output: `;
