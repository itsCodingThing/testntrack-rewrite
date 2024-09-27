import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: "",
  })
);

async function askFromModel(promptText: string) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: promptText,
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  if (!response.data.choices) {
    return "";
  } else if (!response.data.choices[0]) {
    return "";
  } else {
    return response.data.choices[0].text;
  }
}

export async function fetchNotesFromBoardClassSubject({
  className,
  subject,
  chapter,
}: {
  board: string;
  className: string;
  subject: string;
  chapter: string;
}) {
  const notesPrompt = `Write detailed notes for students that are related to chapter ${chapter} of subject ${subject} of class ${className}.`;
  const response = await askFromModel(notesPrompt);

  return response;
}

export async function fetchPracticeQuizFromBoardClassSubject({
  className,
  subject,
  chapter,
}: {
  board: string;
  className: string;
  subject: string;
  chapter: string;
}) {
  const quizPrompt = `
    Generate Output in  following format
    Q1. question text?
    (a) optiona.
    (b) optionb.
    (c) optionc.
    (d) optiond.
    (ans) solution
    
    Generate 5 quizes for chapter ${chapter} of subject ${subject} of class ${className} in mentioned format
    `;
  const response = await askFromModel(quizPrompt);

  return response;
}
