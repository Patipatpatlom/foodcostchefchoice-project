import { GoogleGenAI } from '@google/genai';
try {
  const ai = new GoogleGenAI({ apiKey: 'fake_key' });
  console.log("Init OK");
} catch(e) {
  console.log("Init Error:", e.message);
}
