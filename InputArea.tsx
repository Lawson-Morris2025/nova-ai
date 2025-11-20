import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2, Globe, Sparkles, User, Zap, ChevronUp, PenTool, Code, Mic, MicOff } from 'lucide-react';
import { Attachment, AiModel, Persona } from './types';
import { fileToPart } from './geminiService';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  useWebSearch: boolean;
  onToggleWebSearch: () => void;
  model: AiModel;
  onModelChange: (model: AiModel) => void;
  persona: Persona;
  onPersonaChange: (persona: Persona) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  useWebSearch, 
  onToggleWebSearch,
  model,
  onModelChange,
  persona,
  onPersonaChange
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Close persona menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (personaMenuRef.current && !personaMenuRef.current.contains(event.target as Node)) {
        setIsPersonaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  // Setup Speech Recognition (Safe Check)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setText(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } catch (e) {
        console.error("Speech Recognition failed to initialize", e);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition", e);
        setIsListening(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading || isUploading) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const newAttachments: Attachment[] = [];
      try {
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          if (file.type.startsWith('image/')) {
             const attachment = await fileToPart(file);
             newAttachments.push(attachment);
          }
        }
        setAttachments(prev => [...prev, ...newAttachments]);
      } catch (error) {
        console.error("File upload failed", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getPersonaLabel = (p: Persona) => {
    switch(p) {
      case Persona.GEN_Z: return "Gen-Z (Brainrot)";
      case Persona.WRITER: return "Pro Writer";
      case Persona.CODER: return "Pro Coder";
      case Persona.STANDARD: return "Nova Standard";
      default: return "Nova";
    }
  };

  const getPersonaIcon = (p: Persona) => {
    switch(p) {
      case Persona.GEN_Z: return <Zap size={14} className="text-yellow-400" />;
      case Persona.WRITER: return <PenTool size={14} className="text-purple-400" />;
      case Persona.CODER: return <Code size={14} className="text-emerald-400" />;
      default: return <User size={14} className="text-primary-400" />;
    }
  };

  const hasSpeechSupport = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-visible">
        
        {attachments.length > 0 && (
          <div className="flex gap-3 p-3 bg-gray-850 border-b border-gray-800 overflow-x-auto">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden group border border-gray-700">
                <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" alt="preview" />
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
           <div className="flex items-center space-x-2 flex-wrap gap-y-2">
             
             {/* Model Selector */}
             <div className="relative">
               <select 
                 value={model}
                 onChange={(e) => onModelChange(e.target.value as AiModel)}
                 className="appearance-none bg-gray-800 text-xs font-medium text-gray-300 py-1.5 pl-3 pr-8 rounded-lg border border-gray-700 focus:outline-none focus:border-primary-500 cursor-pointer hover:bg-gray-750 transition-colors"
                 disabled={isLoading}
               >
                 <option value={AiModel.FLASH}>Gemini Flash (Fast)</option>
                 <option value={AiModel.PRO}>Gemini Pro (Smart)</option>
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <Sparkles size={10} />
               </div>
             </div>

             {/* Persona Selector (Custom Popup) */}
             <div className="relative" ref={personaMenuRef}>
               <button 
                 onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                 className="flex items-center space-x-2 bg-gray-800 text-xs font-medium text-gray-300 py-1.5 px-3 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors"
                 disabled={isLoading}
               >
                 {getPersonaIcon(persona)}
                 <span>{getPersonaLabel(persona)}</span>
                 <ChevronUp size={10} className={`transform transition-transform ${isPersonaMenuOpen ? 'rotate-180' : ''}`} />
               </button>

               {/* Popup Menu */}
               {isPersonaMenuOpen && (
                 <div className="absolute bottom-full mb-2 left-0 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-[scale-in_0.1s_ease-out]">
                   <div className="p-1">
                     <button 
                       onClick={() => { onPersonaChange(Persona.STANDARD); setIsPersonaMenuOpen(false); }}
                       className={`w-full flex items-center space-x-3 px-3 py-2 text-xs text-left rounded-lg transition-colors ${persona === Persona.STANDARD ? 'bg-primary-900/30 text-primary-300' : 'text-gray-300 hover:bg-gray-800'}`}
                     >
                       <div className="p-1.5 bg-gray-800 rounded-md text-primary-400"><User size={14} /></div>
                       <div>
                         <div className="font-semibold">Nova Standard</div>
                         <div className="text-gray-500 text-[10px]">Helpful & Precise</div>
                       </div>
                     </button>

                     <button 
                       onClick={() => { onPersonaChange(Persona.WRITER); setIsPersonaMenuOpen(false); }}
                       className={`w-full flex items-center space-x-3 px-3 py-2 text-xs text-left rounded-lg transition-colors ${persona === Persona.WRITER ? 'bg-purple-900/30 text-purple-300' : 'text-gray-300 hover:bg-gray-800'}`}
                     >
                       <div className="p-1.5 bg-gray-800 rounded-md text-purple-400"><PenTool size={14} /></div>
                       <div>
                         <div className="font-semibold">Pro Writer</div>
                         <div className="text-gray-500 text-[10px]">Emails & Drafting</div>
                       </div>
                     </button>
                     
                     <button 
                       onClick={() => { onPersonaChange(Persona.CODER); setIsPersonaMenuOpen(false); }}
                       className={`w-full flex items-center space-x-3 px-3 py-2 text-xs text-left rounded-lg transition-colors ${persona === Persona.CODER ? 'bg-emerald-900/20 text-emerald-300' : 'text-gray-300 hover:bg-gray-800'}`}
                     >
                       <div className="p-1.5 bg-gray-800 rounded-md text-emerald-400"><Code size={14} /></div>
                       <div>
                         <div className="font-semibold">Pro Coder</div>
                         <div className="text-gray-500 text-[10px]">Code & Debugging</div>
                       </div>
                     </button>

                     <button 
                       onClick={() => { onPersonaChange(Persona.GEN_Z); setIsPersonaMenuOpen(false); }}
                       className={`w-full flex items-center space-x-3 px-3 py-2 text-xs text-left rounded-lg transition-colors ${persona === Persona.GEN_Z ? 'bg-yellow-900/20 text-yellow-300' : 'text-gray-300 hover:bg-gray-800'}`}
                     >
                       <div className="p-1.5 bg-gray-800 rounded-md text-yellow-400"><Zap size={14} /></div>
                       <div>
                         <div className="font-semibold">Gen-Z Brainrot</div>
                         <div className="text-gray-500 text-[10px]">Slang & Chaos</div>
                       </div>
                     </button>
                   </div>
                 </div>
               )}
             </div>

             {/* Web Search Toggle */}
             <button 
               onClick={onToggleWebSearch}
               className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                 useWebSearch 
                   ? 'bg-blue-900/30 text-blue-400 border-blue-800' 
                   : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750'
               }`}
               title="Enable Google Search Grounding"
             >
               <Globe size={12} />
               <span className="hidden sm:inline">Search</span>
             </button>
           </div>
        </div>

        {/* Text Input Area */}
        <div className="relative px-4 pb-4">
           <textarea
             ref={textareaRef}
             value={text}
             onChange={(e) => setText(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder={isLoading ? "Nova is thinking..." : (isListening ? "Listening..." : "Type a message...")}
             disabled={isLoading}
             className={`w-full bg-transparent text-gray-100 placeholder-gray-500 resize-none focus:outline-none py-3 pr-32 max-h-[200px] min-h-[56px] ${isListening ? 'animate-pulse placeholder-red-400' : ''}`}
             rows={1}
           />
           
           <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              {/* Mic Button */}
              {hasSpeechSupport && (
                 <button
                   onClick={toggleListening}
                   disabled={isLoading || isUploading}
                   className={`p-2 rounded-full transition-colors ${
                     isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700'
                   }`}
                   title="Voice Input"
                 >
                   {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                 </button>
              )}

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp, image/heic"
                multiple
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="p-2 text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
                title="Attach images"
              >
                <Paperclip size={18} />
              </button>
              
              <button 
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || isLoading || isUploading}
                className={`p-2 rounded-full transition-all ${
                   (!text.trim() && attachments.length === 0) || isLoading
                     ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                     : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20'
                }`}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
           </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-600 mt-3">
        Nova can make mistakes. Review generated info.
      </p>
    </div>
  );
};