import { GoogleGenAI } from '@google/genai';

export const handleChat = async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Step 1: Web Search for Live Data
    const searchInstruction = `You are 'De Chef's Choice AI', a professional food cost assistant.
When the chef asks for live, current, or recent ingredient prices, you MUST use the Google Search tool to find real live prices of ingredients in Thailand (e.g., Makro, Lotus's, ตลาดไท).
ALWAYS mention the specific price, unit (e.g., kg, piece), and the source website/market.
End your response by asking 'ต้องการอัปเดตราคานี้ลงฐานข้อมูลเพื่อคำนวณต้นทุนเลยไหมครับ?'`;

    // Filter out messages that might have unsupported parts from old mock structure
    const cleanMessages = messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts.filter(part => part.text)
    })).filter(msg => msg.parts.length > 0);

    // Call Gemini with Google Search Grounding enabled
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanMessages,
      config: {
        systemInstruction: searchInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    const aiText = searchResponse.text;
    let rawData = null;

    // Step 2: JSON Data Extraction
    // We run a second lightweight extraction pass on the generated text
    const extractionConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          hasPriceData: { type: 'BOOLEAN', description: 'True if a specific price and ingredient was found in the text' },
          ingredient: { type: 'STRING', description: 'The exact name of the ingredient in Thai' },
          price: { type: 'NUMBER', description: 'The numerical price found' },
          unit: { type: 'STRING', description: 'The unit for the price (e.g., kg, g, liter, piece)' },
          source: { type: 'STRING', description: 'The source of the price' }
        },
        required: ['hasPriceData']
      }
    };

    const extractResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract the ingredient price data from this text: "${aiText}"`,
      config: extractionConfig
    });

    try {
      const extracted = JSON.parse(extractResponse.text);
      if (extracted.hasPriceData && extracted.ingredient && extracted.price) {
        rawData = {
          status: 'success',
          ingredient: extracted.ingredient,
          price: extracted.price,
          unit: extracted.unit || 'kg',
          source: extracted.source || 'Web Search',
          updatedAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.error("Extraction error", e);
    }

    // Return both the natural language text (from search) and the structured JSON (for the update button)
    res.json({
      text: aiText,
      rawData: rawData
    });

  } catch (error) {
    console.error('Chat error details:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request', 
      details: error.message,
      stack: error.stack
    });
  }
};
