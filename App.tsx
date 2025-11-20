import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { LoginScreen } from './LoginScreen';
import { Sidebar } from './Sidebar';
import { SettingsModal } from './SettingsModal';
import { OnboardingModal } from './OnboardingModal';
import { Message, Role, Attachment, AiModel, Persona, User, ChatSession } from './types';
import { streamMessage, generateChatTitle } from './geminiService';
import { storageService } from './storageService';
import { Plus, Menu, Loader2, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // App State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [model, setModel] = useState<AiModel>(AiModel.FLASH);
  const [persona, setPersona] = useState<Persona>(Persona.STANDARD);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Auth & Splash Screen
  useEffect(() => {
    // Simulate initial app load time for splash screen effect
    const initApp = async () => {
      // Ensure at least 2.5s splash screen for the "popup" feel
      await new Promise(resolve => setTimeout(resolve, 2500)); 
      
      try {
        const storedUser = storageService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          refreshSessions(storedUser.id);
          
          // Check onboarding
          if (!storageService.hasSeenOnboarding()) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsAuthLoading(false);
        setShowSplash(false);
      }
    };

    initApp();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to reload sessions from storage
  const refreshSessions = (userId: string) => {
    const loadedSessions = storageService.getSessions(userId);
    setSessions(loadedSessions);
    
    // Select most recent if none selected
    if (loadedSessions.length > 0 && !currentSessionId) {
       loadSession(loadedSessions[0]);
    } else if (loadedSessions.length === 0) {
       handleNewChat(userId);
    }
  };

  const handleLogin = () => {
    const loggedInUser = storageService.getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
      refreshSessions(loggedInUser.id);
      
      // Check onboarding status on login
      if (!storageService.hasSeenOnboarding()) {
        setShowOnboarding(true);
      }
    }
  };

  const handleOnboardingComplete = () => {
    storageService.completeOnboarding();
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    setIsSettingsOpen(false);
    setShowOnboarding(false); // Reset local view state
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setModel(session.model);
    setPersona(session.persona || Persona.STANDARD); // Backwards compatibility
    setIsSidebarOpen(false);
  };

  const handleNewChat = (userId = user?.id) => {
    if (!userId) return;
    const newSession = storageService.createSession(userId, model, persona);
    setSessions(prev => [newSession, ...prev]);
    loadSession(newSession);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    if (window.confirm("Are you sure you want to delete this chat?")) {
      const updated = storageService.deleteSession(user.id, sessionId);
      setSessions(updated);
      
      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          loadSession(updated[0]);
        } else {
          handleNewChat();
        }
      }
    }
  };

  const handleSend = async (text: string, attachments: Attachment[]) => {
    if (!user || !currentSessionId) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      attachments: attachments,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const currentSession = sessions.find(s => s.id === currentSessionId);
    const isNewConversation = currentSession && currentSession.messages.length <= 1;

    if (currentSession) {
       // Temporary title for immediate feedback
       let newTitle = currentSession.title;
       if (isNewConversation) {
         newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
       }
       
       const updatedSession = {
         ...currentSession,
         messages: updatedMessages,
         updatedAt: Date.now(),
         title: newTitle,
         model: model, // Update latest used settings
         persona: persona 
       };
       storageService.saveSession(updatedSession);
       setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
    }

    const botMsgId = (Date.now() + 1).toString();
    const placeholderBotMsg: Message = {
        id: botMsgId,
        role: Role.MODEL,
        text: '', 
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, placeholderBotMsg]);

    try {
        let accumulatedText = '';
        let accumulatedGrounding: any = null;

        await streamMessage(
            updatedMessages,
            text,
            attachments,
            model,
            persona,
            useWebSearch,
            (chunkText, grounding) => {
                accumulatedText += chunkText;
                if (grounding) accumulatedGrounding = grounding;
                
                setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId 
                        ? { 
                            ...msg, 
                            text: accumulatedText,
                            groundingMetadata: accumulatedGrounding || msg.groundingMetadata 
                          } 
                        : msg
                ));
            }
        );

        setMessages(currentMsgs => {
            const finalMsg = currentMsgs.find(m => m.id === botMsgId);
            if (finalMsg && currentSessionId) {
               const sessionToUpdate = storageService.getSessions(user.id).find(s => s.id === currentSessionId);
               if (sessionToUpdate) {
                 sessionToUpdate.messages = currentMsgs;
                 sessionToUpdate.updatedAt = Date.now();
                 storageService.saveSession(sessionToUpdate);
                 setSessions(storageService.getSessions(user.id));
               }
            }
            return currentMsgs;
        });

        // Generate better title if it was a new conversation
        if (isNewConversation) {
            generateChatTitle(text).then((aiTitle) => {
                if (!currentSessionId) return;
                const sessionToUpdate = storageService.getSessions(user.id).find(s => s.id === currentSessionId);
                if (sessionToUpdate) {
                    sessionToUpdate.title = aiTitle;
                    storageService.saveSession(sessionToUpdate);
                    setSessions(storageService.getSessions(user.id));
                }
            });
        }

    } catch (error) {
        console.error("Streaming error", error);
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
                ? { ...msg, text: msg.text + "\n\n*Error: Something went wrong. Please try again.*", isError: true } 
                : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;
    
    const lastMsgIndex = messages.length - 1;
    const lastMsg = messages[lastMsgIndex];
    
    // Only regenerate if last message is from Model
    if (lastMsg.role !== Role.MODEL) return;

    // Find the user message that triggered this (usually the one before)
    const prevUserMsg = messages[lastMsgIndex - 1];
    
    if (!prevUserMsg || prevUserMsg.role !== Role.USER) {
        console.error("Cannot regenerate: Previous message was not from user.");
        return;
    }

    // 1. Remove the last AI message from UI immediately
    const historyForStream = messages.slice(0, -1); // [..., UserMsg]
    setMessages(historyForStream);
    
    setIsLoading(true);
    
    // 2. Create placeholder for new response
    const botMsgId = (Date.now() + 1).toString();
    const placeholderBotMsg: Message = {
        id: botMsgId,
        role: Role.MODEL,
        text: '', 
        timestamp: Date.now()
    };
    
    // 3. Update UI with placeholder
    const newMessagesWithPlaceholder = [...historyForStream, placeholderBotMsg];
    setMessages(newMessagesWithPlaceholder);

    // 4. Start Streaming
    try {
        let accumulatedText = '';
        let accumulatedGrounding: any = null;

        // Call streamMessage with the history up to user's prompt (UserMsg is last item in historyForStream)
        await streamMessage(
            historyForStream, 
            prevUserMsg.text,
            prevUserMsg.attachments || [],
            model,
            persona,
            useWebSearch,
            (chunkText, grounding) => {
                accumulatedText += chunkText;
                if (grounding) accumulatedGrounding = grounding;
                
                setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId 
                        ? { 
                            ...msg, 
                            text: accumulatedText,
                            groundingMetadata: accumulatedGrounding || msg.groundingMetadata 
                          } 
                        : msg
                ));
            }
        );

        // 5. Save to Storage
        setMessages(finalMsgs => {
            if (currentSessionId && user) {
               const sessionToUpdate = storageService.getSessions(user.id).find(s => s.id === currentSessionId);
               if (sessionToUpdate) {
                 sessionToUpdate.messages = finalMsgs;
                 sessionToUpdate.updatedAt = Date.now();
                 storageService.saveSession(sessionToUpdate);
                 // Force refresh sessions list to update preview/time
                 setSessions(storageService.getSessions(user.id));
               }
            }
            return finalMsgs;
        });

    } catch (error) {
        console.error("Regeneration error", error);
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
                ? { ...msg, text: msg.text + "\n\n*Error: Regeneration failed.*", isError: true } 
                : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  // Splash Screen View - Uses inline styles to guarantee visibility and prevent white screen
  if (showSplash) {
    return (
      <div 
        style={{ 
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#0b0f19',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
         <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px]" />
         <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px]" />
         
         <div className="relative z-10 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/40 mb-8 animate-bounce">
               <Sparkles className="text-white w-12 h-12" strokeWidth={2} />
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight mb-3">Nova AI</h1>
            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Created by Lawson Morris</p>
            <div className="mt-10">
              <Loader2 className="text-primary-500 animate-spin" size={32} />
            </div>
         </div>
         
         <div className="absolute bottom-8 text-[10px] text-gray-700 font-mono uppercase tracking-widest">
            v1.0.0 • Nova AI
         </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans selection:bg-primary-500/30 overflow-hidden relative">
      
      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user} 
        onLogout={handleLogout} 
      />

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* Sidebar (Desktop) */}
      <div className="hidden lg:flex w-72 h-full border-r border-gray-800">
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={loadSession}
          onNewChat={() => handleNewChat()}
          onDeleteSession={handleDeleteSession}
          user={user}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTutorial={() => setShowOnboarding(true)}
        />
      </div>

      {/* Sidebar (Mobile Overlay) */}
      {isSidebarOpen && (
         <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="absolute inset-y-0 left-0 w-72 bg-gray-950 shadow-2xl animate-[slideInLeft_0.3s_ease-out]">
               <Sidebar 
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSelectSession={(id) => {
                    const s = sessions.find(s => s.id === id);
                    if (s) loadSession(s);
                    setIsSidebarOpen(false);
                  }}
                  onNewChat={() => {
                    handleNewChat();
                    setIsSidebarOpen(false);
                  }}
                  onDeleteSession={handleDeleteSession}
                  user={user}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onOpenTutorial={() => setShowOnboarding(true)}
               />
            </div>
         </div>
      )}

      <div className="flex-1 flex flex-col relative w-full min-w-0">
         {/* Mobile Header */}
         <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white">
              <Menu size={24} />
            </button>
            <span className="font-bold text-white">Nova AI</span>
            <button onClick={() => handleNewChat()} className="text-primary-500 hover:text-primary-400">
              <Plus size={24} />
            </button>
         </div>

         {/* Chat Area */}
         <div className="flex-1 overflow-y-auto p-4 pb-32">
            {messages.length === 0 && sessions.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-50">
                  <Sparkles size={48} />
                  <p>Start a new conversation</p>
               </div>
            )}
            
            {messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isLast={index === messages.length - 1}
                onRegenerate={handleRegenerate}
              />
            ))}
            <div ref={messagesEndRef} />
         </div>

         {/* Input Area */}
         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent p-4 pt-20">
            <InputArea 
               onSend={handleSend} 
               isLoading={isLoading}
               useWebSearch={useWebSearch}
               onToggleWebSearch={() => setUseWebSearch(!useWebSearch)}
               model={model}
               onModelChange={setModel}
               persona={persona}
               onPersonaChange={setPersona}
            />
         </div>
      </div>
    </div>
  );
};

export default App;