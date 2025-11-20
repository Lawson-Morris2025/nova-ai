import React, { useState } from 'react';
import { Sparkles, Loader2, Mail, Check, ShieldCheck, AlertCircle, User as UserIcon, FileText, X, Info } from 'lucide-react';
import { storageService } from './storageService';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRobotVerified, setIsRobotVerified] = useState(false);
  const [isVerifyingRobot, setIsVerifyingRobot] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaptchaClick = () => {
    if (isRobotVerified || isVerifyingRobot) return;
    
    setIsVerifyingRobot(true);
    // Simulate verification delay
    setTimeout(() => {
      setIsVerifyingRobot(false);
      setIsRobotVerified(true);
    }, 1500);
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (isRegistering) {
      if (name.trim().length < 2) {
        setError("Please enter a valid name.");
        return;
      }
      if (!termsAccepted) {
        setError("You must accept the Terms and Conditions to create an account.");
        return;
      }
    }
    if (!isRobotVerified) {
      setError("Please verify that you are not a robot.");
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        await storageService.register(name, email, password);
      } else {
        await storageService.loginWithEmail(email, password);
      }
      onLogin();
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-950 items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4 animate-[bounce_2s_infinite_3s]">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Nova</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isRegistering ? "Create a private, local account" : "Sign in to continue"}
          </p>
          
          {/* Local Storage Disclaimer */}
          <div className="mt-3 flex items-start gap-2 text-left bg-blue-900/20 border border-blue-800/50 p-2.5 rounded-lg">
            <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-blue-200/80 leading-tight">
              <strong>Note:</strong> Nova runs entirely in your browser. Accounts are stored locally on this device for privacy and are not synced to the cloud.
            </p>
          </div>
        </div>

        {/* Email Login/Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field (Only for Registration) */}
          {isRegistering && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-gray-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-gray-600"
              />
            </div>
          </div>

          {/* Simulated Captcha */}
          <div 
            onClick={handleCaptchaClick}
            className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all select-none ${
              isRobotVerified 
                ? 'bg-emerald-900/10 border-emerald-800' 
                : 'bg-gray-950 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className={`w-6 h-6 rounded border flex items-center justify-center mr-3 transition-colors ${
              isRobotVerified 
                ? 'bg-emerald-500 border-emerald-500' 
                : 'bg-gray-800 border-gray-600'
            }`}>
              {isVerifyingRobot && <Loader2 className="animate-spin text-gray-400" size={14} />}
              {isRobotVerified && <Check className="text-white" size={16} />}
            </div>
            <span className={`text-sm ${isRobotVerified ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
              {isRobotVerified ? "Verified human" : "I am not a robot"}
            </span>
            <div className="ml-auto">
                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="captcha" className="w-8 opacity-50 grayscale" />
            </div>
          </div>

           {/* Terms Checkbox (Registration Only) */}
           {isRegistering && (
            <div className="flex items-start space-x-3 px-1 animate-[fadeIn_0.3s_ease-out]">
              <div 
                onClick={() => setTermsAccepted(!termsAccepted)}
                className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
                  termsAccepted 
                    ? 'bg-primary-600 border-primary-600' 
                    : 'bg-gray-950 border-gray-600 hover:border-gray-500'
                }`}
              >
                {termsAccepted && <Check className="text-white" size={12} />}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-primary-400 hover:text-primary-300 underline">Terms and Conditions</button> and acknowledge that AI can make mistakes.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle size={14} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin mx-auto" /> : (isRegistering ? "Create Account" : "Sign In")}
          </button>

          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setPassword('');
                setIsRobotVerified(false);
                setTermsAccepted(false);
              }}
              className="text-xs text-gray-500 hover:text-primary-400 transition-colors"
            >
              {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>

        {/* Terms Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTermsModal(false)} />
            <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FileText size={20} className="mr-2 text-primary-500" />
                  Terms & Conditions
                </h3>
                <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-4 markdown-content">
                <p><strong>1. Introduction</strong><br/>By creating an account, you agree to use Nova AI responsibly.</p>
                
                <p><strong>2. AI Limitations</strong><br/>Nova is powered by artificial intelligence. It may occasionally generate incorrect, misleading, or offensive information. Always verify important information.</p>
                
                <p><strong>3. Data Privacy</strong><br/>Your chat history and account details are encrypted and stored <strong>locally on your device</strong> within your browser. We do not have access to your password or private conversations.</p>
                
                <p><strong>4. User Conduct</strong><br/>You agree not to use Nova AI for any illegal activities, harassment, or to generate harmful content.</p>
                
                <p><strong>5. Disclaimer</strong><br/>This service is provided "as is" without any warranties. The creator (Lawson Morris) is not liable for damages resulting from the use of this application.</p>
              </div>
              <div className="p-4 border-t border-gray-800 bg-gray-900">
                <button 
                  onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  I Accept
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};