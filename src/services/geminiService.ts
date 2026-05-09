import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function generateQuizQuestions(config: QuizConfig): Promise<Question[]> {
  const prompt = `Generate ${config.questionCount} GATE Computer Science MCQs on:
  Topic: ${config.topic}
  Subtopic: ${config.subtopic}
  Difficulty: ${config.difficulty}

  Strict Rules:
  - Questions must be GATE-level (conceptual or numerical).
  - 4 specific options per question.
  - Only one correct answer.
  - Include a detailed technical explanation.
  - Avoid trivial questions; focus on GATE syllabus depth.
  - Return JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                minItems: 4,
                maxItems: 4,
              },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["question", "options", "answer", "explanation"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data as Question[];
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions. Please try again.");
  }
}
