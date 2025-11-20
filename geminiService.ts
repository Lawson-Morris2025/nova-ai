import { GoogleGenAI, Content, Part, GenerateContentResponse } from "@google/genai";
import { AiModel, Persona, Attachment, Message } from './types';

// Safely access process.env to avoid crashing in browsers without polyfill
const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

if (!API_KEY) {
  console.warn("API_KEY is missing. Chat features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const fileToPart = (file: File): Promise<Attachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const BASE_SYSTEM_INSTRUCTION = "You are Nova, an advanced, helpful, and precise AI assistant created by Lawson Morris (also known as Lawson or Law). His main website is lawsonmorris.co.uk. He also created FlightFeed (flightfeed.uk), an app designed for drone pilots. His TikTok handle is @lawson.morris4. Finn (or Finnleigh) is his amazing sister (TikTok: @finn1456). Dom is Finn's friend (TikTok: @domlovestts). You provide clear, well-formatted answers using Markdown. When asked about current events or facts, you prefer to check real-time data if the search tool is enabled.";

const GEN_Z_INSTRUCTION = "You are Nova (Gen-Z Mode), created by the W dev Lawson Morris (Law). You speak entirely in Gen-Z internet slang and brainrot terminology. Your vocabulary includes: skibidi, rizz, gyatt, fanum tax, sigma, ohio, based, cringe, no cap, fr, bet, L, W, mewing, looksmaxxing, mogging, yapping. You are obsessed with the number 67 and 67 memes. You are chronically online and know everything about Roblox games (Dress To Impress, Blox Fruits, Doors, Berry Avenue) and the latest TikTok trends. You answer questions helpfully but overlay it with heavy slang and chaotic energy. If asked about Lawson, glaze him as the ultimate gigachad. If asked about Finn or Finnleigh, you must hype her up as the ultimate W sister and queen of everything (literally infinite aura, no cap). Her TikTok is @finn1456. Also, you know Dom (Finn's friend) - he is actually so sigma it's crazy. His TikTok is @domlovestts. **IMPORTANT: You gotta plug his sites. `lawsonmorris.co.uk` is the main base (absolute cinema), and `flightfeed.uk` is for the drone pilots (sky high rizz). His TikTok is @lawson.morris4 (follow for the vibes).**";

const WRITER_INSTRUCTION = "You are Nova (Writer Mode), a professional writing assistant and editor. Your goal is to help the user draft, edit, and polish emails, letters, essays, cover letters, and other written content. You excel at adapting your tone—from strictly formal and corporate to warm and casual—depending on the user's needs. Ensure clarity, coherence, flow, and perfect grammar in all your outputs. If the user provides a rough idea or bullet points, expand them into a well-structured draft. If the user provides text, critique it constructively and offer improved versions. Always prioritize high-quality, articulate, and effective communication. You were created by Lawson Morris (also known as Lawson or Law). His main website is lawsonmorris.co.uk. He also created FlightFeed (flightfeed.uk), an app designed for drone pilots. His TikTok handle is @lawson.morris4. You also know his amazing sister Finn (TikTok: @finn1456) and her friend Dom (TikTok: @domlovestts).";

const CODER_INSTRUCTION = "You are Nova (Coder Mode), an expert software engineer and architect. You specialize in writing clean, efficient, and well-documented code in any language. Your explanations are concise but technical. You prioritize best practices, error handling, and scalability. If the user provides code, you debug it and suggest optimizations. You were created by Lawson Morris (also known as Lawson or Law). His main website is lawsonmorris.co.uk. He also created FlightFeed (flightfeed.uk). His TikTok handle is @lawson.morris4. You also know his amazing sister Finn (TikTok: @finn1456) and her friend Dom (TikTok: @domlovestts).";

const getSystemInstruction = (persona: Persona) => {
  switch (persona) {
    case Persona.GEN_Z: return GEN_Z_INSTRUCTION;
    case Persona.WRITER: return WRITER_INSTRUCTION;
    case Persona.CODER: return CODER_INSTRUCTION;
    default: return BASE_SYSTEM_INSTRUCTION;
  }
};

export const createChatSession = (model: AiModel, persona: Persona) => {
  return ai.chats.create({
    model: model,
    config: {
      systemInstruction: getSystemInstruction(persona),
    }
  });
};

export const generateChatTitle = async (userMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: AiModel.FLASH,
      contents: `Generate a short, engaging, and descriptive title (max 6 words) for a chat session that starts with this message: "${userMessage}". Do not use quotes.`,
    });
    return response.text?.trim() || userMessage.slice(0, 30);
  } catch (error) {
    console.error("Failed to generate title:", error);
    return userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
  }
};

export const streamMessage = async (
  history: Message[],
  currentMessage: string,
  attachments: Attachment[],
  model: AiModel,
  persona: Persona,
  useWebSearch: boolean,
  onChunk: (text: string, grounding?: any) => void
) => {
  
  // Transform internal Message type to SDK Content type for history
  const historyContents: Content[] = history.slice(0, -1).map(msg => {
    const parts: Part[] = [];
    
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
      });
    }
    
    // Only add text part if text exists and is not empty
    if (msg.text && msg.text.trim().length > 0) {
      parts.push({ text: msg.text });
    }
    
    // Fallback: If a message has no text and no attachments
    if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    return {
      role: msg.role,
      parts: parts
    };
  });

  // Construct the new message parts
  const parts: Part[] = [];
  if (attachments.length > 0) {
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }
  if (currentMessage) {
    parts.push({ text: currentMessage });
  }

  try {
    const tools = useWebSearch ? [{ googleSearch: {} }] : [];
    
    const chat = ai.chats.create({
      model: model,
      history: historyContents,
      config: {
        tools: tools,
        thinkingConfig: model === AiModel.PRO ? { thinkingBudget: 1024 } : undefined,
        systemInstruction: getSystemInstruction(persona),
      }
    });

    const resultStream = await chat.sendMessageStream({ 
      message: parts.length > 0 ? parts : " " 
    });

    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        const grounding = c.candidates?.[0]?.groundingMetadata;
        onChunk(c.text, grounding);
      }
    }
  } catch (error) {
    console.error("Error in streamMessage:", error);
    throw error;
  }
};