import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, Mic, Sparkles, Loader2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssistantPage: React.FC = () => {
  const {
    t,
    chatMessages,
    sendChatMessage,
    isAiLoading,
    farm,
    soil,
    satellite,
    language,
    isAuthenticated,
    user,
  } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGenuinelyAuthenticated = Boolean(
    isAuthenticated && user && user.id && user.id !== 'usr-guest'
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiLoading) return;
    if (!isGenuinelyAuthenticated) return;
    sendChatMessage(inputText.trim());
    setInputText('');
  };

  const sampleQuestions = [
    'How often should I irrigate my current crop?',
    'What should I do about yellowing lower leaves?',
    'How can I improve soil nitrogen naturally?',
  ];

  return (
    <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100dvh-175px)] md:h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
          {t('assistant.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {t('assistant.subtitle')}
        </p>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white rounded-3xl border border-[#e8ece8] shadow-card flex flex-col overflow-hidden min-h-0">
        {/* Unauthenticated Guest State */}
        {!isGenuinelyAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-radial from-white to-[#fbfdfb]">
            <div className="w-16 h-16 rounded-3xl bg-agri-50 border border-agri-200 flex items-center justify-center text-agri-700 mb-4 shadow-sm">
              <Bot className="w-8 h-8 stroke-[2]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-agri-50 border border-agri-200/60 text-agri-800 text-xs font-semibold mb-3">
              <Lock className="w-3.5 h-3.5" />
              <span>Authentication Required</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Sign in to use GreenAgro AI Assistant
            </h2>

            <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
              Get personalized AI-powered farming guidance based on your farm, crops, soil, weather and satellite insights.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-agri-800 hover:bg-agri-900 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
              >
                <span>Login to Continue →</span>
              </Link>
              <Link
                to="/register"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all"
              >
                <span>Create Account</span>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-agri-600" /> Secure Farmer Data
              </span>
              <span>•</span>
              <span>Gemini 2.0 Flash</span>
            </div>
          </div>
        ) : (
          /* Authenticated Active Chat State */
          <>
            {/* Context Bar */}
            <div className="bg-[#f5f8f5] px-4 py-2.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-agri-600 animate-pulse"></span>
                <span className="font-semibold text-agri-950">Active Farm Context:</span>
                <span className="text-gray-500 hidden sm:inline">
                  {farm ? `${farm.name}${farm.primaryCrop ? ` • ${farm.primaryCrop}` : ''}` : 'No farm added yet'} • Soil: {soil ? `${soil.score}/100` : 'Not entered'} • NDVI: {satellite.ndvi !== null ? satellite.ndvi : 'Unconfigured'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-agri-800 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                Gemini 2.0 Flash
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#fafbfc]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white border border-[#e5e9e5] text-gray-900 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex items-center gap-2 text-xs text-agri-800 bg-white border border-agri-100 px-3.5 py-2.5 rounded-2xl w-fit shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-agri-600" />
                  <span>GreenAgro AI Assistant is consulting farm parameters...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Sample Questions */}
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(q)}
                  className="text-xs text-gray-600 hover:text-agri-900 bg-[#f4f7f4] hover:bg-agri-100 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border border-gray-200/50 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSubmit}
              className="p-2 sm:p-4 bg-white border-t border-gray-100 flex items-center gap-1.5 sm:gap-3 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'अपना प्रश्न हिंदी या अंग्रेजी में लिखें...'
                    : 'Type your question in Hindi or English...'
                }
                className="flex-1 bg-[#f4f7f4] border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600 transition-colors"
              />

              <button
                type="button"
                className="p-2 sm:p-3 text-gray-500 hover:text-agri-700 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-colors shrink-0 cursor-pointer"
                title="Voice Input (Speech-to-Text)"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() || isAiLoading}
                className="w-9 h-9 sm:w-11 sm:h-11 bg-agri-800 hover:bg-agri-900 disabled:opacity-40 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm transition-transform hover:scale-105 shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
