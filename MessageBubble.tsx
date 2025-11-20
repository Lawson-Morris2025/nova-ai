import React, { useState } from 'react';
import { Message, Role } from './types';
import { User, Bot, Globe, FileImage, Copy, Check, RefreshCw } from 'lucide-react';

// Helper to parse inline formatting (bold, code, links)
const parseInline = (text: string) => {
  // Split by code (`...`), bold (**...**), and links ([...](...))
  // This regex captures the delimiters and content
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-gray-800 text-primary-300 px-1.5 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[') && part.includes('](')) {
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return <a key={idx} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">{linkMatch[1]}</a>;
      }
    }
    return part;
  });
};

// Code Block Component with Copy Feature
const CodeBlock: React.FC<{ language: string, code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg border border-gray-700 bg-gray-900/80 overflow-hidden shadow-sm group">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase font-mono">{language || 'text'}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>}
          <span className="text-[10px] uppercase">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="font-mono text-sm text-gray-300 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
};

// Lightweight Markdown Component
const SimpleMarkdown: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  if (!content) return null;

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-3 ${isUser ? 'text-white' : 'text-gray-100'}`}>
      {parts.map((part, index) => {
        // Render Code Block
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          const language = match ? match[1] : '';
          const code = match ? match[2] : part.replace(/```/g, '');
          return <CodeBlock key={index} language={language} code={code} />;
        }

        // Render Text Blocks (Paragraphs, Headers, Lists)
        if (!part.trim()) return null;
        
        return (
          <div key={index}>
            {part.split('\n').map((line, lineIdx) => {
              if (!line.trim()) return <div key={lineIdx} className="h-2"/>;
              
              // Headers
              if (line.startsWith('# ')) return <h1 key={lineIdx} className="text-xl font-bold mt-4 mb-2">{parseInline(line.slice(2))}</h1>;
              if (line.startsWith('## ')) return <h2 key={lineIdx} className="text-lg font-bold mt-3 mb-2">{parseInline(line.slice(3))}</h2>;
              
              // Bullet Lists
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return (
                  <div key={lineIdx} className="flex items-start ml-1 mb-1">
                    <span className="mr-2 text-gray-500">•</span>
                    <span className="flex-1">{parseInline(line.trim().substring(2))}</span>
                  </div>
                );
              }

              // Numbered Lists
              const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                 return (
                  <div key={lineIdx} className="flex items-start ml-1 mb-1">
                    <span className="mr-2 text-gray-500 font-mono text-xs mt-1">{numMatch[1]}.</span>
                    <span className="flex-1">{parseInline(numMatch[2])}</span>
                  </div>
                 );
              }

              // Standard Paragraph
              return <p key={lineIdx} className="mb-1 leading-relaxed">{parseInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isLast,
  onRegenerate
}) => {
  const isUser = message.role === Role.USER;
  const [isCopied, setIsCopied] = useState(false);

  // Extract sources if they exist
  const sources = message.groundingMetadata?.groundingChunks?.filter(c => c.web?.uri && c.web?.title) || [];

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-3xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'bg-primary-600' : 'bg-emerald-600'}`}>
          {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col min-w-0 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
          
          <div className={`relative px-5 py-4 rounded-2xl shadow-md group ${
            isUser 
              ? 'bg-primary-600 text-white rounded-tr-none' 
              : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none'
          }`}>
            
            {/* Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="relative group">
                     {att.mimeType.startsWith('image/') ? (
                       <img 
                         src={`data:${att.mimeType};base64,${att.data}`} 
                         alt="attachment" 
                         className="max-h-48 rounded-lg border border-gray-600 object-cover"
                       />
                     ) : (
                       <div className="flex items-center p-2 bg-gray-700 rounded-lg border border-gray-600">
                         <FileImage size={16} className="mr-2"/>
                         <span className="text-xs truncate max-w-[150px]">Attachment</span>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            )}

            {/* Text Content (Custom Markdown) */}
            <div className="text-sm sm:text-base">
              {message.text ? (
                <SimpleMarkdown content={message.text} isUser={isUser} />
              ) : (
                <div className="flex items-center space-x-1 h-6">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              )}
            </div>

            {/* Hover Message Tools - Only Copy for older messages */}
            {!isUser && message.text && !isLast && (
              <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopy}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700 rounded transition-all"
                  title="Copy response"
                >
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}

          </div>

          {/* Grounding Sources */}
          {sources.length > 0 && !isUser && (
            <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800 text-xs w-full">
              <div className="flex items-center text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                <Globe size={12} className="mr-1" />
                Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.web?.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center bg-gray-800 hover:bg-gray-700 text-blue-400 px-2 py-1 rounded transition-colors border border-gray-700 truncate max-w-full"
                  >
                    <span className="truncate max-w-[200px]">{source.web?.title || "Web Source"}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Regenerate & Copy Options (Only for last AI message) */}
          {!isUser && isLast && !message.isError && message.text && (
            <div className="flex items-center gap-2 mt-2 ml-1">
              <button 
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-all group"
                title="Regenerate response"
              >
                <RefreshCw size={13} className="group-hover:rotate-180 transition-transform duration-500" />
                <span>Regenerate</span>
              </button>
              
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-all"
                title="Copy full response"
              >
                {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}
          
          {/* Timestamp / Status */}
          <div className="mt-1 text-xs text-gray-500 px-1">
            {message.isError ? (
              <span className="text-red-500">Failed to send</span>
            ) : (
              new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            )}
          </div>

        </div>
      </div>
    </div>
  );
};