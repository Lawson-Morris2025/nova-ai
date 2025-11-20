export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  isError?: boolean;
  groundingMetadata?: GroundingMetadata;
  timestamp: number;
}

export enum AiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export enum Persona {
  STANDARD = 'standard',
  GEN_Z = 'gen_z',
  WRITER = 'writer',
  CODER = 'coder'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  model: AiModel;
  persona: Persona;
  updatedAt: number;
}