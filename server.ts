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

// IPTV M3U Playlist Proxy & Parser Endpoint
app.get('/api/iptv/playlist', async (req, res) => {
  try {
    const targetUrl = (req.query.url as string) || 'https://iptv-org.github.io/iptv/index.m3u';
    const limit = Math.min(1000, parseInt(req.query.limit as string) || 300);
    const category = (req.query.category as string) || '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AuraFit-FireTV-IPTV/1.0',
        'Accept': '*/*',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Remote playlist returned HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const m3uText = await response.text();
    const lines = m3uText.split(/\r?\n/);
    const channels: any[] = [];
    let currentChannel: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        const extinf = line.substring(8);
        const tvgIdMatch = extinf.match(/tvg-id="([^"]*)"/i);
        const tvgNameMatch = extinf.match(/tvg-name="([^"]*)"/i);
        const tvgLogoMatch = extinf.match(/tvg-logo="([^"]*)"/i);
        const groupMatch = extinf.match(/group-title="([^"]*)"/i);

        const lastComma = extinf.lastIndexOf(',');
        let channelName = lastComma !== -1 ? extinf.substring(lastComma + 1).trim() : '';
        if (!channelName && tvgNameMatch) {
          channelName = tvgNameMatch[1];
        }

        currentChannel = {
          id: `chan-${channels.length + 1}`,
          name: channelName || `Channel ${channels.length + 1}`,
          logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
          group: groupMatch ? groupMatch[1] : 'General',
          tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
        };
      } else if (!line.startsWith('#') && currentChannel) {
        if (line.startsWith('http://') || line.startsWith('https://')) {
          const matchCategory =
            !category ||
            category.toLowerCase() === 'all' ||
            (currentChannel.group && currentChannel.group.toLowerCase().includes(category.toLowerCase()));

          if (matchCategory) {
            channels.push({
              ...currentChannel,
              streamUrl: line,
            });

            if (channels.length >= limit) {
              break;
            }
          }
        }
        currentChannel = null;
      }
    }

    res.json({
      url: targetUrl,
      totalChannels: channels.length,
      channels,
    });
  } catch (error: any) {
    console.error('IPTV Playlist Fetch Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to fetch M3U playlist',
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
