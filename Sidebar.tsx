import React from 'react';
import { MessageSquare, Plus, Zap, Trash2, Settings, BookOpen } from 'lucide-react';
import { ChatSession, User } from './types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  user: User;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat, 
  onDeleteSession,
  user,
  onOpenSettings,
  onOpenTutorial
}) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-950 p-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 px-2">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Zap className="text-white fill-white" size={18} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Nova <span className="text-primary-500">AI</span></h1>
      </div>

      {/* New Chat Button */}
      <button 
        onClick={onNewChat}
        className="flex items-center justify-center space-x-2 w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-xl border border-gray-800 transition-all mb-6 group shadow-sm"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300"/>
        <span className="font-medium">New Chat</span>
      </button>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Chats</div>
        <div className="space-y-1">
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group relative flex items-center space-x-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.id 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <MessageSquare size={16} className={currentSessionId === session.id ? 'text-primary-500' : 'text-gray-600'} />
              <span className="text-sm truncate flex-1 pr-6">
                {session.title || "New Conversation"}
              </span>
              
              {/* Delete Button (Visible on Hover) */}
              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm italic">
              No saved chats yet.
            </div>
          )}
        </div>
      </div>

      {/* Footer area */}
      <div className="mt-auto pt-4 border-t border-gray-800 space-y-2">
        
        {/* Tutorial Button */}
        <button 
          onClick={onOpenTutorial}
          className="flex items-center space-x-3 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors group"
        >
          <BookOpen size={18} className="group-hover:text-primary-400 transition-colors"/>
          <span className="text-sm font-medium">Tutorial & Intro</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-900/50 border border-gray-800 group hover:border-gray-700 transition-colors cursor-pointer" onClick={onOpenSettings}>
          <div className="flex items-center min-w-0">
            {user.avatar ? (
               <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full border border-gray-700" />
            ) : (
               <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm border border-gray-700">
                 {user.name.charAt(0).toUpperCase()}
               </div>
            )}
            
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-white truncate w-24">{user.name}</p>
              <p className="text-xs text-gray-500 truncate w-24">{user.email}</p>
            </div>
          </div>

          <div className="text-gray-500 group-hover:text-white transition-colors">
            <Settings size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};