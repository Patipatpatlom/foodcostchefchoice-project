import { GoogleGenAI } from '@google/genai';

// Mock function to simulate fetching live prices
const mockFetchLivePrice = (ingredientName) => {
  // Generate a realistic random price between 50 and 500
  const randomPrice = Math.floor(Math.random() * (500 - 50 + 1) + 50);
  const sources = ['Makro Click', 'Lotus\'s', 'DIT (ราคากลาง)', 'Talaad Thai'];
  const randomSource = sources[Math.floor(Math.random() * sources.length)];
  
  return {
    status: 'success',
    ingredient: ingredientName,
    price: randomPrice,
    unit: 'kg',
    source: randomSource,
    updatedAt: new Date().toISOString()
  };
};

export const handleChat = async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // The system prompt to enforce the persona and tool usage
    const systemInstruction = "You are 'De Chef's Choice AI', a professional food cost assistant. When the chef asks for live, current, or recent ingredient prices, NEVER hallucinate or guess the price. You MUST call the `fetchLivePrice` tool immediately. Once you get the tool response, summarize the ingredient name, price, unit, source, and date clearly for the chef. End your response by asking 'ต้องการอัปเดตราคานี้ลงฐานข้อมูลเพื่อคำนวณต้นทุนเลยไหมครับ?'";

    const config = {
      systemInstruction,
      tools: [{
        functionDeclarations: [{
          name: 'fetchLivePrice',
          description: 'Fetches live or updated market price for an ingredient',
          parameters: {
            type: 'OBJECT',
            properties: {
              ingredient_name: { type: 'STRING', description: 'Name of the ingredient to fetch price for' }
            },
            required: ['ingredient_name']
          }
        }]
      }]
    };

    // First API call
    let response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config
    });

    let rawData = null;

    // Check if the model decided to call the function
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === 'fetchLivePrice') {
        const ingredientName = call.args.ingredient_name;
        
        // Execute our mock tool
        rawData = mockFetchLivePrice(ingredientName);
        
        // Append the model's function call to the conversation history
        messages.push({
          role: 'model',
          parts: [{ functionCall: call }]
        });
        
        // Append the tool response back to the conversation
        messages.push({
          role: 'user', // In the new SDK, tool responses are often sent as 'user' role with functionResponse part
          parts: [{
            functionResponse: {
              name: call.name,
              response: rawData
            }
          }]
        });
        
        // Second API call to get the final text summary from the LLM
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: messages,
          config
        });
      }
    }

    // Send the final text and any raw data back to the frontend
    res.json({
      text: response.text,
      rawData: rawData
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
};
