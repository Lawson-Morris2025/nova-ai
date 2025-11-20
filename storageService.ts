import { ChatSession, User, AiModel, Persona, Role } from './types';

const USER_KEY = 'nova_current_user';
const SESSIONS_KEY_PREFIX = 'nova_sessions_';
const USERS_DB_KEY = 'nova_users_db';
const ONBOARDING_KEY = 'nova_has_seen_onboarding';

interface StoredAuthData extends User {
  passwordHash: string;
  salt: string;
}

// --- Security Helpers (Web Crypto API) ---

const generateSalt = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const hashPassword = async (password: string, salt: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// -----------------------------------------

export const storageService = {

  // Onboarding
  hasSeenOnboarding: (): boolean => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch (e) {
      return false;
    }
  },

  completeOnboarding: (): void => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.error("Failed to save onboarding status", e);
    }
  },

  // Register New User (Secure)
  register: async (name: string, email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let users: StoredAuthData[] = [];
    try {
       users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]') as StoredAuthData[];
    } catch (e) {
       users = [];
    }
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Account already exists with this email.");
    }

    const salt = generateSalt();
    const hashedPassword = await hashPassword(password, salt);

    const newUser: StoredAuthData = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      passwordHash: hashedPassword,
      salt: salt,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
    };

    users.push(newUser);
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      
      // Auto login after register (strip sensitive data)
      const { passwordHash, salt: _, ...sessionUser } = newUser;
      localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    } catch (e) {
      throw new Error("Failed to save user data. Storage might be full or disabled.");
    }
  },

  // Email Login (Secure)
  loginWithEmail: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let users: StoredAuthData[] = [];
    try {
       users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]') as StoredAuthData[];
    } catch (e) {
       users = [];
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    // Verify password by hashing input with stored salt
    const inputHash = await hashPassword(password, user.salt);
    
    if (inputHash !== user.passwordHash) {
        throw new Error("Invalid email or password.");
    }

    const { passwordHash, salt, ...sessionUser } = user;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
    } catch (e) {
      console.error("Failed to save session", e);
    }
    return sessionUser;
  },

  logout: async (): Promise<void> => {
    try {
      localStorage.removeItem(USER_KEY);
      // Clear onboarding flag so it shows again on next login
      localStorage.removeItem(ONBOARDING_KEY);
    } catch (e) {
      console.error("Logout error", e);
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored user:", e);
      try { localStorage.removeItem(USER_KEY); } catch {}
      return null;
    }
  },

  getSessions: (userId: string): ChatSession[] => {
    try {
      const stored = localStorage.getItem(`${SESSIONS_KEY_PREFIX}${userId}`);
      if (!stored) return [];
      const sessions = JSON.parse(stored) as ChatSession[];
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
      console.error("Failed to parse sessions", e);
      return [];
    }
  },

  saveSession: (session: ChatSession) => {
    try {
      const sessions = storageService.getSessions(session.userId);
      const index = sessions.findIndex(s => s.id === session.id);
      
      if (index >= 0) {
        sessions[index] = session;
      } else {
        sessions.unshift(session);
      }
      
      localStorage.setItem(
        `${SESSIONS_KEY_PREFIX}${session.userId}`, 
        JSON.stringify(sessions)
      );
    } catch (e) {
      console.error("Failed to save session", e);
    }
  },

  deleteSession: (userId: string, sessionId: string) => {
    try {
      const sessions = storageService.getSessions(userId);
      const filtered = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(
        `${SESSIONS_KEY_PREFIX}${userId}`, 
        JSON.stringify(filtered)
      );
      return filtered;
    } catch (e) {
      console.error("Failed to delete session", e);
      return [];
    }
  },

  createSession: (userId: string, model: AiModel, persona: Persona = Persona.STANDARD): ChatSession => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      userId,
      title: 'New Conversation',
      messages: [{
        id: 'welcome',
        role: Role.MODEL,
        text: "# Hello, I'm Nova.\n\nI can help you with analysis, creative writing, coding, and researching the web.\n\nHow can I assist you today?",
        timestamp: Date.now()
      }],
      model,
      persona,
      updatedAt: Date.now()
    };
    storageService.saveSession(newSession);
    return newSession;
  }
};