import { GoogleGenAI, Type } from "@google/genai";
import { Task, Priority, EnergyLevel, AppState, Insight } from "../types";

const geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function callOpenAiCompatible(baseUrl: string, apiKey: string, model: string, prompt: string) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey || 'no-key'}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    })
  });

  if (!response.ok) {
    throw new Error(`AI Provider error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/* =========================
   UTILS
========================= */

function cleanJson(text: string): string {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
}

function extractJson(text: string): string {
  const cleaned = cleanJson(text);

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');

  if (start !== -1 && end !== -1) {
    return cleaned.slice(start, end + 1);
  }

  return cleaned;
}

/* =========================
   NORMALIZERS
========================= */

function normalizeInsights(data: any[]): Partial<Insight>[] {
  return data.map(item => ({
    title: item.title || item.category || "Insight",
    content: item.content || item.insight || item.description || "",
    category: item.category || "general"
  }));
}

function normalizeParsedItems(data: any[]): ParsedItem[] {
  return data.map(item => ({
    type: item.type || 'note',
    title: item.title || "Без названия",
    description: item.description || item.note || "",
    deadline: item.deadline,
    estimatedDuration: item.estimatedDuration,
    priority: item.priority,
    energyCost: item.energyCost,
    tags: item.tags || [],
    isSubtask: item.isSubtask || false,
    confidence: typeof item.confidence === 'number' ? item.confidence : 0.5
  }));
}

/* =========================
   TYPES
========================= */

export interface ParsedItem {
  type: 'task' | 'note' | 'event';
  title: string;
  description?: string;
  deadline?: string;
  estimatedDuration?: number;
  priority?: Priority;
  energyCost?: EnergyLevel;
  tags?: string[];
  isSubtask?: boolean;
  confidence: number;
}

/* =========================
   PARSER
========================= */

export async function parseNaturalLanguage(input: string, settings: AppState['settings']): Promise<ParsedItem[]> {
  const prompt = `Вы — эксперт по организации жизни. Разберите ввод в JSON.

ВАЖНО:
Используйте ТОЛЬКО эти поля:
type, title, description, deadline, estimatedDuration, priority, energyCost, tags, isSubtask, confidence

Пример:
[
  {
    "type": "task",
    "title": "Сделать домашку",
    "description": "Математика",
    "priority": "high",
    "confidence": 0.9
  }
]

Ввод: "${input}"
Дата: ${new Date().toISOString()}

Ответ: ТОЛЬКО JSON массив.`;

  let responseText = "";

  if (settings.aiProvider === 'gemini') {
    const response = await geminiAi.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              deadline: { type: Type.STRING },
              estimatedDuration: { type: Type.NUMBER },
              priority: { type: Type.STRING },
              energyCost: { type: Type.NUMBER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              isSubtask: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER }
            },
            required: ["type", "title", "confidence"]
          }
        }
      }
    });
    responseText = response.text;
  } else {
    responseText = await callOpenAiCompatible(
      settings.aiBaseUrl || 'http://localhost:11434/v1',
      settings.aiApiKey || '',
      settings.aiModel || 'llama3',
      prompt
    );
  }

  try {
    const extracted = extractJson(responseText);
    const parsed = JSON.parse(extracted);
    return normalizeParsedItems(parsed);
  } catch (e) {
    console.error("Failed to parse AI response", e, responseText);
    return [];
  }
}

/* =========================
   INSIGHTS
========================= */

export async function generateInsights(state: AppState): Promise<Partial<Insight>[]> {
  const settings = state.settings;

  const context = {
    tasks: state.tasks.map(t => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      deadline: t.deadline
    })),
    lessons: state.lessons.map(l => ({
      subject: l.subject,
      day: l.dayOfWeek,
      start: l.startTime
    })),
    notes: state.notes.map(n => ({
      title: n.title,
      content: n.content.substring(0, 100)
    })),
    habits: state.habits.map(h => ({
      title: h.title,
      completedCount: h.completedDates.length
    }))
  };

  const prompt = `Ты — ИИ ассистент. Дай 2-3 инсайта.

ВАЖНО:
Используй ТОЛЬКО поля:
title, content, category

НЕ используй поле "insight".

Пример:
[
  {
    "title": "Перенос задач",
    "content": "Перенеси сложные задачи на утро",
    "category": "productivity"
  }
]

Контекст: ${JSON.stringify(context)}
Дата: ${new Date().toISOString()}

Ответ: ТОЛЬКО JSON массив.`;

  let responseText = "";

  if (settings.aiProvider === 'gemini') {
    const response = await geminiAi.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "content", "category"]
          }
        }
      }
    });
    responseText = response.text;
  } else {
    responseText = await callOpenAiCompatible(
      settings.aiBaseUrl || 'http://localhost:11434/v1',
      settings.aiApiKey || '',
      settings.aiModel || 'llama3',
      prompt
    );
  }

  try {
    const extracted = extractJson(responseText);
    const parsed = JSON.parse(extracted);
    return normalizeInsights(parsed);
  } catch (e) {
    console.error("Failed to generate insights", e, responseText);
    return [];
  }
}