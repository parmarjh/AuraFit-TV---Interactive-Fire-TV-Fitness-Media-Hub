import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Search Grounding endpoint using gemini-3.5-flash and googleSearch tool
app.post('/api/gemini/search-grounding', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemInstruction =
      'You are AuraFit TV Smart Assistant on Amazon Fire TV. ' +
      'Answer questions about fitness, live sports science, exercise recovery, workout routines, and optimal home gym conditions. ' +
      'Use Google Search to provide up-to-date and accurate information. ' +
      'Keep answers crisp, informative, and well-structured for reading on a 10-foot television screen.';

    const contents = context
      ? `Context: ${context}\n\nUser Question: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || 'No response generated.';
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    const webSearchQueries = groundingMetadata?.webSearchQueries || [];

    // Extract citation URLs and titles
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web?.title || 'Web Citation',
        uri: chunk.web?.uri,
      }));

    res.json({
      text,
      sources,
      queries: webSearchQueries,
    });
  } catch (error: any) {
    console.error('Gemini Search Grounding error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate grounded response',
    });
  }
});

// Automated Routine & Environmental Optimization with Search Grounding
app.post('/api/gemini/optimize-automation', async (req, res) => {
  try {
    const { currentTemp, heartRate, workoutType } = req.body;
    const prompt =
      `Based on current sports medicine literature and climate science retrieved via Google search, ` +
      `what is the optimal indoor room temperature, fan airflow level (1-3), and cooldown protocol ` +
      `for an athlete doing ${workoutType || 'high-intensity training'} with heart rate at ${heartRate || 140} BPM? ` +
      `Current room temp is ${currentTemp || 71}°F. Provide recommended thermostat setting (°F), recommended fan speed (1-3), and concise scientific justification.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];

    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web?.title || 'Web Citation',
        uri: chunk.web?.uri,
      }));

    res.json({
      text,
      sources,
    });
  } catch (error: any) {
    console.error('Optimize automation error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to optimize automation',
    });
  }
});

// Full-Stack Dev & Prod static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
