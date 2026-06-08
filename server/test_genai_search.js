import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const searchInstruction = "You are an assistant.";
  const messages = [{ role: 'user', parts: [{ text: "What is the price of salmon in Thailand?" }] }];
  
  ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: {
        systemInstruction: searchInstruction,
        tools: [{ googleSearch: {} }]
      }
    }).then(res => {
        console.log("Success:", res.text);
    }).catch(e => {
        console.log("Generate Error:", e.message);
    });
} catch(e) {
  console.log("Init Error:", e.message);
}
