import { PromptTemplateItem } from '../type.d';

export const Prompt_QuoteTemplateList: PromptTemplateItem[] = [
  {
    title: '标准模板',
    desc: '标准提示词，用于结构不固定的知识库。',
    value: `{{q}}
{{a}}`
  },
  {
    title: '问答模板',
    desc: '适合 QA 问答结构的知识库，可以让AI较为严格的按预设内容回答',
    value: `<Question>
{{q}}
</Question>
<Answer>
{{a}}
</Answer>`
  },
  {
    title: '标准严格模板',
    desc: '在标准模板基础上，对模型的回答做更严格的要求。',
    value: `{{q}}
{{a}}`
  },
  {
    title: '严格问答模板',
    desc: '在问答模板基础上，对模型的回答做更严格的要求。',
    value: `<Question>
{{q}}
</Question>
<Answer>
</Question>
<Answer>
{{a}}
</Answer>`
  }
];

export const Prompt_QuotePromptList: PromptTemplateItem[] = [
  {
    title: '标准模板',
    desc: '',
    value: `Use the content within the <data></data> tags as your knowledge:

<Data>
{{quote}}
</Data>

Response Requirements:
- If you are unsure of the answer, seek clarification.
- Avoid mentioning that your knowledge is obtained from <data></data>.
- Ensure that your answer aligns with the description in the <data></data>.

Question: """{{question}}"""`

  },
  {
    title: '问答模板',
    desc: '',
    value: `Use the Q&A pairs within <QA></QA> tags for responses.

<QA>
{{quote}}
</QA>

Answer Requirements:
- Choose one or more Q&A pairs to respond to.
- Ensure that the response closely aligns with the content within <Answer></Answer>.
- Clarify if there are no relevant Q&A pairs.
- Avoid mentioning that knowledge comes from Q&A pairs unless the user mentions
- All Mathematical symbols and formulas must be expressed in the following LaTex format. Inline format $g_{\\mu\\nu}$ and display format: 
$$
i\\hbar \\frac{\\partial}{\\partial t}\\left|\\Psi(t)\\right>=H\\left|\\Psi(t)\\right>
$$

Question:"""{{question}}"""`
  },
  {
    "title": "标准严格模板",
    "desc": "",
    "value": `Forget the knowledge you already have; only use the content within <Data></Data> tags as your knowledge:
  
  <Data>
  {{quote}}
  </Data>
  
  Thinking process:
  1. Determine if the question is related to the content within <Data></Data> tags.
  2. If relevant, respond according to the following requirements.
  3. If not relevant, decline to answer the question directly.
  
  Answer Requirements:
  - Avoid mentioning that you obtained knowledge from <Data></Data>.
  - Ensure that the answer aligns with the description within <Data></Data>.
- All Mathematical symbols and formulas must be expressed in the following LaTex format. Inline format $g_{\\mu\\nu}$ and display format: 
$$
i\\hbar \\frac{\\partial}{\\partial t}\\left|\\Psi(t)\\right>=H\\left|\\Psi(t)\\right>
$$
  
  Question: """{{question}}"""`
  },
  {
    "title": "严格问答模板",
    "desc": "",
    "value": `Forget the knowledge you already have; only use the Q&A pairs within <QA></QA> tags to respond.
  
    <QA>
    {{quote}}
    </QA>}
  
  Thinking process:
  1. Determine if the question is related to the content within <QA></QA> tags.
  2. If not, decline to answer the question directly.
  3. Check for similar or identical questions.
  4. If there are identical questions, provide the corresponding answers.
  5. If there are only similar questions, output both the similar questions and answers together.
  
  Lastly, avoid mentioning that you obtained knowledge from QA; simply provide the answers.
  
  Question: """{{question}}"""`
  }  
];
