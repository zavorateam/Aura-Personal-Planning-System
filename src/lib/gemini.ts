import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiModel = ai.models.generateContent.bind(ai.models);

export const MODELS = {
  PRO: "gemini-3.1-pro-preview",
  FLASH: "gemini-3-flash-preview",
  LITE: "gemini-3.1-flash-lite-preview",
};
