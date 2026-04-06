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
  return data.choices[0].message.content;
}

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

export async function parseNaturalLanguage(input: string, settings: AppState['settings']): Promise<ParsedItem[]> {
  const prompt = `Вы — эксперт по организации жизни. Разберите следующий ввод пользователя на структурированные сущности.
    Ввод: "${input}"
    
    Текущая дата: ${new Date().toISOString()}
    
    Правила:
    1. Определите, является ли это задачей (task), заметкой (note) или событием (event).
    2. Извлеките заголовок (title), описание (description), дедлайн (deadline в ISO), длительность (estimatedDuration в минутах), приоритет (priority: low, medium, high, critical), стоимость энергии (energyCost: 1-5) и теги (tags).
    3. Если присутствует несколько элементов, верните их в виде массива JSON.
    4. Присвойте оценку уверенности (confidence: 0-1) для каждого элемента.
    5. Если ввод — это быстрая мысль без четкого действия, пометьте как 'note'.
    6. Всегда отвечайте на русском языке в полях title и description.
    
    Ответьте ТОЛЬКО чистым JSON массивом объектов.`;

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
              type: { type: Type.STRING, enum: ['task', 'note', 'event'] },
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
    // Clean potential markdown from response
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse AI response", e, responseText);
    return [];
  }
}

export async function generateInsights(state: AppState): Promise<Partial<Insight>[]> {
  const settings = state.settings;
  const context = {
    tasks: state.tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, deadline: t.deadline })),
    lessons: state.lessons.map(l => ({ subject: l.subject, day: l.dayOfWeek, start: l.startTime })),
    notes: state.notes.map(n => ({ title: n.title, content: n.content.substring(0, 100) })),
    habits: state.habits.map(h => ({ title: h.title, completedCount: h.completedDates.length }))
  };

  const prompt = `Вы — персональный ИИ-ассистент Aura. Проанализируйте текущее состояние пользователя и предложите 2-3 инсайта или рекомендации по продуктивности, здоровью или обучению.
    
    Контекст: ${JSON.stringify(context)}
    Текущая дата: ${new Date().toISOString()}
    
    Правила:
    1. Будьте краткими, но полезными.
    2. Используйте русский язык.
    3. Категории: productivity, health, learning, general.
    4. Предлагайте конкретные действия (например, "Перенесите задачу X на утро, так как у вас свободное окно").
    5. Ответьте ТОЛЬКО чистым JSON массивом объектов.`;

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
              category: { type: Type.STRING, enum: ['productivity', 'health', 'learning', 'general'] }
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
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to generate insights", e, responseText);
    return [];
  }
}
