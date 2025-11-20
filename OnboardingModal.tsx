import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles, Zap, Code, PenTool, Globe, User } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    // Step 0: Welcome
    {
      title: "Welcome to Nova",
      subtitle: "Your advanced AI companion for everything.",
      content: (
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-pulse-slow">
            <Sparkles className="text-white w-12 h-12" />
          </div>
          <p className="text-center text-gray-300 max-w-sm leading-relaxed">
            Nova is designed to help you write, code, analyze images, and browse the web with real-time intelligence.
          </p>
        </div>
      )
    },
    // Step 1: Personas & Tools
    {
      title: "Powerful Personas",
      subtitle: "Adapt Nova to your specific needs.",
      content: (
        <div className="grid grid-cols-2 gap-4 py-2">
           <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center text-center">
             <div className="p-2 bg-primary-900/30 rounded-lg text-primary-400 mb-2"><Zap size={20}/></div>
             <h4 className="font-bold text-sm text-white">Gen-Z Mode</h4>
             <p className="text-xs text-gray-400 mt-1">Slang, memes, and pure chaos.</p>
           </div>
           <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center text-center">
             <div className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400 mb-2"><Code size={20}/></div>
             <h4 className="font-bold text-sm text-white">Pro Coder</h4>
             <p className="text-xs text-gray-400 mt-1">Clean code & debugging.</p>
           </div>
           <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center text-center">
             <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400 mb-2"><PenTool size={20}/></div>
             <h4 className="font-bold text-sm text-white">Pro Writer</h4>
             <p className="text-xs text-gray-400 mt-1">Emails, essays & editing.</p>
           </div>
           <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center text-center">
             <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400 mb-2"><Globe size={20}/></div>
             <h4 className="font-bold text-sm text-white">Web Search</h4>
             <p className="text-xs text-gray-400 mt-1">Real-time factual data.</p>
           </div>
        </div>
      )
    },
    // Step 2: The Creator
    {
      title: "Meet the Creator",
      subtitle: "Built by Lawson Morris.",
      content: (
        <div className="flex flex-col space-y-4 py-2">
          <div className="flex items-center space-x-4 bg-gray-800/80 p-4 rounded-2xl border border-gray-700">
             <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-white" size={24} />
             </div>
             <div>
               <h3 className="font-bold text-white text-lg">Lawson Morris</h3>
               <p className="text-xs text-gray-400">Full Stack Developer</p>
             </div>
          </div>

          <div className="space-y-2">
             <a href="https://lawsonmorris.co.uk" target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500 hover:bg-gray-800 transition-all group">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-300 group-hover:text-white">lawsonmorris.co.uk</span>
                   <Globe size={14} className="text-gray-500 group-hover:text-primary-400"/>
                </div>
             </a>
             <a href="https://flightfeed.uk" target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500 hover:bg-gray-800 transition-all group">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-300 group-hover:text-white">flightfeed.uk</span>
                   <Zap size={14} className="text-gray-500 group-hover:text-yellow-400"/>
                </div>
                <p className="text-xs text-gray-500 mt-1">The ultimate app for drone pilots.</p>
             </a>
          </div>
          
          <div className="text-center text-xs text-gray-500 pt-2">
            Special shoutout to <span className="text-primary-400 font-semibold">Finn</span> (@finn1456) & <span className="text-emerald-400 font-semibold">Dom</span> (@domlovestts).
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-600/10 rounded-full blur-[150px] animate-pulse-slow" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Step Content */}
          <div className="flex-1 p-8 flex flex-col">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{steps[step].title}</h2>
                <p className="text-gray-400">{steps[step].subtitle}</p>
             </div>
             
             <div className="flex-1 flex flex-col justify-center animate-[fadeIn_0.3s_ease-out]">
               {steps[step].content}
             </div>
          </div>

          {/* Footer / Navigation */}
          <div className="p-6 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
             {/* Dots Indicator */}
             <div className="flex space-x-2">
               {steps.map((_, idx) => (
                 <div 
                   key={idx} 
                   className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-primary-500' : 'w-1.5 bg-gray-700'}`} 
                 />
               ))}
             </div>

             <button 
               onClick={handleNext}
               className="flex items-center space-x-2 bg-white text-black hover:bg-gray-200 font-bold py-2.5 px-6 rounded-full transition-colors shadow-lg shadow-white/10"
             >
               <span>{step === steps.length - 1 ? "Get Started" : "Next"}</span>
               {step === steps.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};