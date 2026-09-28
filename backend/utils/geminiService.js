import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "FATAL ERROR: GEMINI_API_KEY is not set in the environment variables."
  );
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3-flash-preview",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

/**
 * Call Gemini with multi-model fallback and retry
 */
export const callGemini = async (prompt, config = {}) => {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const text =
          response.text ||
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          "";

        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] Model ${model} failed (${err.status || err.message}): trying next fallback...`);
        // If 503 or 429, slight delay before trying next model
        if (err.status === 503 || err.status === 429) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw lastError || new Error("Gemini API call failed across all models");
};

/**
 * Helper to safely extract JSON from AI response
 */
const safeParseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    // Try to find JSON array or object inside markdown fences
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) || text.match(/(\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

/**
 * @param {string} text
 * @param {number} count
 * @returns {Promise<Array<{question:string,answer:string,difficulty:string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
  const prompt = `Generate exactly ${count} educational flashcards from the text in JSON format.
Return a JSON array of objects with the following schema:
[
  {
    "question": "Clear, specific question",
    "answer": "Concise, accurate answer",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Text:
${text.substring(0, 15000)}`;

  try {
    const rawResponse = await callGemini(prompt, {
      responseMimeType: "application/json",
    });

    const parsed = safeParseJSON(rawResponse);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validCards = parsed
        .filter((c) => c && c.question && c.answer)
        .map((c) => ({
          question: String(c.question).trim(),
          answer: String(c.answer).trim(),
          difficulty: ["easy", "medium", "hard"].includes(String(c.difficulty).toLowerCase())
            ? String(c.difficulty).toLowerCase()
            : "medium",
        }));

      if (validCards.length > 0) {
        return validCards.slice(0, count);
      }
    }
  } catch (err) {
    console.warn("[Gemini Flashcards] JSON mode failed, falling back to text parsing:", err.message);
  }

  // Fallback: Text line parsing
  try {
    const textPrompt = `Generate exactly ${count} educational flashcards from the following text.
Format each flashcard as:
Q:[Question]
A:[Answer]
D:[easy, medium, or hard]
---
Text:
${text.substring(0, 15000)}`;

    const generatedText = await callGemini(textPrompt);
    const flashcards = [];
    const cards = generatedText.split(/---|\n\s*\n/).filter((c) => c.trim());

    for (const card of cards) {
      const lines = card.trim().split("\n");
      let question = "",
        answer = "",
        difficulty = "medium";

      for (const line of lines) {
        const trimmed = line.trim().replace(/^[-*•]\s*/, "");
        if (/^Q:/i.test(trimmed) || /^Question:/i.test(trimmed)) {
          question = trimmed.replace(/^Q(uestion)?:?\s*/i, "").trim();
        } else if (/^A:/i.test(trimmed) || /^Answer:/i.test(trimmed)) {
          answer = trimmed.replace(/^A(nswer)?:?\s*/i, "").trim();
        } else if (/^D:/i.test(trimmed) || /^Difficulty:/i.test(trimmed)) {
          const diff = trimmed.replace(/^D(ifficulty)?:?\s*/i, "").trim().toLowerCase();
          if (["easy", "medium", "hard"].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && answer) {
        flashcards.push({ question, answer, difficulty });
      }
    }

    if (flashcards.length > 0) {
      return flashcards.slice(0, count);
    }
  } catch (error) {
    console.error("Gemini Flashcards error:", error);
  }

  // Fallback: Generate smart cards from sentences if AI fails
  const sentences = text
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

  const fallbackCards = sentences.slice(0, count).map((sentence, idx) => ({
    question: `What is the key takeaway from: "${sentence.substring(0, 60)}..."?`,
    answer: sentence,
    difficulty: idx % 3 === 0 ? "easy" : idx % 3 === 1 ? "medium" : "hard",
  }));

  if (fallbackCards.length > 0) return fallbackCards;
  throw new Error("Failed to generate flashcards");
};

/**
 * @param {string} text
 * @param {number} numQuestions
 * @returns {Promise<Array<{question:string,options:Array,correctAnswer:string,explanation:string,difficulty:string}>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions from the text in JSON format.
Return a JSON array of objects with the following schema:
[
  {
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Exact text of the correct option",
    "explanation": "Brief explanation of why it is correct",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Text:
${text.substring(0, 15000)}`;

  try {
    const rawResponse = await callGemini(prompt, {
      responseMimeType: "application/json",
    });

    const parsed = safeParseJSON(rawResponse);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validQuestions = parsed
        .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
        .map((q) => {
          let opts = q.options.map((o) => String(o).trim());
          // Ensure 4 options
          while (opts.length < 4) {
            opts.push(`None of the above`);
          }
          opts = opts.slice(0, 4);

          let corr = String(q.correctAnswer || "").trim();
          if (!opts.includes(corr)) {
            corr = opts[0];
          }

          return {
            question: String(q.question).trim(),
            options: opts,
            correctAnswer: corr,
            explanation: String(q.explanation || "Correct based on the document.").trim(),
            difficulty: ["easy", "medium", "hard"].includes(String(q.difficulty).toLowerCase())
              ? String(q.difficulty).toLowerCase()
              : "medium",
          };
        });

      if (validQuestions.length > 0) {
        return validQuestions.slice(0, numQuestions);
      }
    }
  } catch (err) {
    console.warn("[Gemini Quiz] JSON mode failed, falling back to text parsing:", err.message);
  }

  // Fallback: Text parsing
  try {
    const textPrompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question as:
Q:[Question]
O1:[Option 1]
O2:[Option 2]
O3:[Option 3]
O4:[Option 4]
C:[Correct option - exactly as written in options]
E:[Brief explanation]
D:[easy, medium, or hard]
---
Text:
${text.substring(0, 15000)}`;

    const generatedText = await callGemini(textPrompt);
    const questions = [];
    const questionBlocks = generatedText.split(/---|\n\s*\n/).filter((q) => q.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split("\n");
      let question = "",
        options = [],
        correctAnswer = "",
        explanation = "",
        difficulty = "medium";

      for (const line of lines) {
        const trimmed = line.trim();
        if (/^Q:/i.test(trimmed) || /^Question:/i.test(trimmed)) {
          question = trimmed.replace(/^Q(uestion)?:?\s*/i, "").trim();
        } else if (/^O\d:/i.test(trimmed) || /^[A-D]\)/i.test(trimmed) || /^Option\s*\d:/i.test(trimmed)) {
          options.push(trimmed.replace(/^(O\d:|[A-D]\)|Option\s*\d:)\s*/i, "").trim());
        } else if (/^C:/i.test(trimmed) || /^Correct:/i.test(trimmed)) {
          correctAnswer = trimmed.replace(/^C(orrect)?:?\s*/i, "").trim();
        } else if (/^E:/i.test(trimmed) || /^Explanation:/i.test(trimmed)) {
          explanation = trimmed.replace(/^E(xplanation)?:?\s*/i, "").trim();
        } else if (/^D:/i.test(trimmed) || /^Difficulty:/i.test(trimmed)) {
          const diff = trimmed.replace(/^D(ifficulty)?:?\s*/i, "").trim().toLowerCase();
          if (["easy", "medium", "hard"].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && options.length >= 2) {
        while (options.length < 4) options.push("None of the above");
        options = options.slice(0, 4);
        if (!options.includes(correctAnswer)) correctAnswer = options[0];

        questions.push({
          question,
          options,
          correctAnswer,
          explanation: explanation || "Based on the text content.",
          difficulty,
        });
      }
    }

    if (questions.length > 0) {
      return questions.slice(0, numQuestions);
    }
  } catch (error) {
    console.error("Gemini Quiz text parsing error:", error);
  }

  throw new Error("Failed to generate quiz");
};

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
  const prompt = `Provide a comprehensive, structured summary of the following document.
Highlight key takeaways, main concepts, and important details using clear headings and bullet points.

Document Content:
${text.substring(0, 20000)}`;

  try {
    const generatedText = await callGemini(prompt);
    return generatedText;
  } catch (error) {
    console.error("Gemini Summary error:", error);
    // Fallback: structured summary from content
    const firstLines = text.split("\n").filter((l) => l.trim().length > 20).slice(0, 8);
    return `### Document Summary\n\n${firstLines.map((l) => `* ${l.trim()}`).join("\n")}`;
  }
};

/**
 * @param {string} question
 * @param {Array<Object>} chunks
 * @returns {Promise<string>}
 */
export const chatWithContext = async (question, chunks) => {
  const context = chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.content}`)
    .join("\n\n");

  const prompt = `You are an AI learning assistant helping a student understand this document.
Based on the following document context, provide an accurate, clear, and helpful answer to the question.
If the answer cannot be found in the context, politely state that it is not covered in the document.

Context:
${context}

Question: ${question}

Answer:`;

  try {
    const generatedText = await callGemini(prompt);
    return generatedText;
  } catch (error) {
    console.error("Gemini Chat error:", error);
    throw new Error("Failed to process chat request");
  }
};

/**
 * @param {string} concept
 * @param {string} context
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
  const prompt = `Explain the concept of "${concept}" based on the following document context.
Provide a clear, educational explanation that is easy to understand.
Include key definitions, how it works, and examples if relevant.

Context:
${context.substring(0, 10000)}

Explanation:`;

  try {
    const generatedText = await callGemini(prompt);
    return generatedText;
  } catch (error) {
    console.error("Gemini Explain Concept error:", error);
    throw new Error("Failed to explain concept");
  }
};
