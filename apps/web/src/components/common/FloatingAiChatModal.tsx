import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Send,
  Mic,
  X,
  Sparkles,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingAiChatModal: React.FC = () => {
  const {
    isAiChatOpen,
    setIsAiChatOpen,
    isAuthenticated,
    isAuthLoading,
    user,
    chatMessages,
    sendChatMessage,
    isAiLoading,
    farm,
    weather,
    soil,
    satellite,
    language,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Strict authentication check
  const isGenuinelyAuthenticated = Boolean(
    isAuthenticated && user && user.id && user.id !== 'usr-guest'
  );

  // Mobile viewport height
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  // 🎤 VOICE INPUT / SPEECH TO TEXT
  // ═══════════════════════════════════════════════════════════════════

  const startVoiceInput = () => {
    if (isAiLoading) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        language === 'hi'
          ? 'Voice Input आपके browser में supported नहीं है। कृपया Chrome या Edge इस्तेमाल करें।'
          : 'Voice input is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    // Stop listening if already active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();

    // One voice command at a time
    recognition.continuous = false;

    // Show partial speech while user is speaking
    recognition.interimResults = true;

    // Hindi / English
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => {
      console.log('[Voice] Listening started');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript += event.results[i][0].transcript;
      }

      setInputText(transcript.trim());

      // Keep input focused
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Error:', event.error);

      setIsListening(false);
      recognitionRef.current = null;

      if (event.error === 'not-allowed') {
        alert(
          language === 'hi'
            ? 'Microphone permission allow करें और फिर दोबारा try करें।'
            : 'Please allow microphone permission and try again.'
        );
      }

      if (event.error === 'no-speech') {
        console.log('[Voice] No speech detected');
      }
    };

    recognition.onend = () => {
      console.log('[Voice] Listening stopped');

      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error('[Voice] Failed to start:', error);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  // Cleanup voice recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors
        }

        recognitionRef.current = null;
      }
    };
  }, []);

  // Stop voice recognition when chat closes
  useEffect(() => {
    if (!isAiChatOpen && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }

      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [isAiChatOpen]);

  // ═══════════════════════════════════════════════════════════════════
  // MOBILE VIEWPORT
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isAiChatOpen) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        'resize',
        handleViewportChange
      );

      window.visualViewport.addEventListener(
        'scroll',
        handleViewportChange
      );

      handleViewportChange();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          'resize',
          handleViewportChange
        );

        window.visualViewport.removeEventListener(
          'scroll',
          handleViewportChange
        );
      }
    };
  }, [isAiChatOpen]);

  // ═══════════════════════════════════════════════════════════════════
  // LOCK BACKGROUND SCROLL ON MOBILE
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isAiChatOpen) return;

    const isMobile = window.innerWidth < 768;

    if (!isMobile) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevDocOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
    };
  }, [isAiChatOpen, location.pathname]);

  // ═══════════════════════════════════════════════════════════════════
  // ESC KEY
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isAiChatOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAiChatOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAiChatOpen, setIsAiChatOpen]);

  // ═══════════════════════════════════════════════════════════════════
  // AUTO SCROLL CHAT
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (isAiChatOpen && isGenuinelyAuthenticated) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }, [
    chatMessages,
    isAiChatOpen,
    isGenuinelyAuthenticated,
  ]);

  // Clear text when logout
  useEffect(() => {
    if (!isGenuinelyAuthenticated) {
      setInputText('');
    }
  }, [isGenuinelyAuthenticated]);

  if (!isAiChatOpen) return null;

  // ═══════════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════════

  const handleLoginClick = () => {
    setIsAiChatOpen(false);

    sessionStorage.setItem(
      'ga_open_chat_after_login',
      'true'
    );

    navigate('/login', {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
        },
        openAiChat: true,
      },
    });
  };

  // ═══════════════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════════════

  const handleRegisterClick = () => {
    setIsAiChatOpen(false);

    sessionStorage.setItem(
      'ga_open_chat_after_login',
      'true'
    );

    navigate('/register', {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
        },
        openAiChat: true,
      },
    });
  };

  // ═══════════════════════════════════════════════════════════════════
  // MOBILE HEIGHT
  // ═══════════════════════════════════════════════════════════════════

  const mobileHeightStyle =
    viewportHeight && window.innerWidth < 768
      ? {
          maxHeight: `${Math.min(
            580,
            viewportHeight - 32
          )}px`,
        }
      : undefined;

  // ═══════════════════════════════════════════════════════════════════
  // STATE 1: AUTH LOADING
  // ═══════════════════════════════════════════════════════════════════

  if (isAuthLoading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/45 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none md:p-0 md:inset-auto md:right-6 md:bottom-6 md:w-[390px] md:block pointer-events-auto transition-all"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsAiChatOpen(false);
          }
        }}
        style={{ touchAction: 'none' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            touchAction: 'auto',
            ...mobileHeightStyle,
          }}
          className="relative w-full max-w-[400px] md:max-w-none md:w-[390px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e8ece8] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 md:zoom-in-100 duration-200"
        >
          <div className="bg-gradient-to-r from-agri-800 to-agri-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-none truncate">
                    GreenAgro AI Assistant
                  </h3>

                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                </div>

                <p className="text-[11px] text-agri-100 mt-0.5 truncate">
                  {language === 'hi'
                    ? 'पुष्टि की जा रही है...'
                    : 'Verifying session...'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAiChatOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Close GreenAgro AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-white min-h-[220px]">
            <div className="w-12 h-12 rounded-2xl bg-[#edf7ee] border border-agri-200 flex items-center justify-center text-agri-700 mb-3 shadow-2xs shrink-0">
              <Loader2 className="w-6 h-6 animate-spin text-agri-600" />
            </div>

            <h4 className="text-sm font-bold text-gray-900 mb-1">
              {language === 'hi'
                ? 'प्रमाणीकरण की पुष्टि हो रही है...'
                : 'Checking session...'}
            </h4>

            <p className="text-xs text-gray-500">
              {language === 'hi'
                ? 'कृपया प्रतीक्षा करें...'
                : 'Verifying your farming session...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATE 2: NOT AUTHENTICATED
  // ═══════════════════════════════════════════════════════════════════

  if (!isGenuinelyAuthenticated) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/45 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none md:p-0 md:inset-auto md:right-6 md:bottom-6 md:w-[390px] md:block pointer-events-auto transition-all"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsAiChatOpen(false);
          }
        }}
        style={{ touchAction: 'none' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            touchAction: 'auto',
            ...mobileHeightStyle,
          }}
          className="relative w-full max-w-[400px] md:max-w-none md:w-[390px] max-h-[min(560px,calc(100dvh-5rem))] md:max-h-none bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e8ece8] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 md:zoom-in-100 slide-in-from-bottom-3 duration-200"
        >
          <div className="bg-gradient-to-r from-agri-800 to-agri-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-none truncate">
                    GreenAgro AI Assistant
                  </h3>

                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                </div>

                <p className="text-[11px] text-agri-100 mt-0.5 truncate">
                  {language === 'hi'
                    ? 'एआई-संचालित कृषि सहायक'
                    : 'AI-Powered Agricultural Assistant'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAiChatOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Close GreenAgro AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center text-center bg-white overflow-y-auto overscroll-contain flex-1 min-h-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#edf7ee] border border-agri-200/80 flex items-center justify-center text-agri-700 mb-3 sm:mb-4 shadow-2xs shrink-0">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              {language === 'hi'
                ? 'ग्रीनएग्रो एआई सहायक का उपयोग करने के लिए लॉगिन करें'
                : 'Sign in to use GreenAgro AI Assistant'}
            </h4>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xs mb-5 font-normal">
              {language === 'hi'
                ? 'अपने खेत, फसलों, मिट्टी, मौसम और उपग्रह अंतर्दृष्टि के आधार पर व्यक्तिगत एआई-संचालित कृषि मार्गदर्शन प्राप्त करें।'
                : 'Get personalized AI-powered farming guidance based on your farm, crops, soil, weather and satellite insights.'}
            </p>

            <button
              type="button"
              onClick={handleLoginClick}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0"
            >
              <span>
                {language === 'hi'
                  ? 'आगे बढ़ने के लिए लॉगिन करें →'
                  : 'Login to Continue →'}
              </span>
            </button>

            <div className="mt-3.5 pt-3 border-t border-gray-100 w-full flex flex-col items-center gap-1 shrink-0">
              <span className="text-xs text-gray-500 font-medium">
                {language === 'hi'
                  ? 'ग्रीनएग्रो पर नए हैं?'
                  : 'New to GreenAgro?'}
              </span>

              <button
                type="button"
                onClick={handleRegisterClick}
                className="text-xs font-bold text-[#166534] hover:text-[#104e2a] hover:underline cursor-pointer bg-transparent border-0 p-0"
              >
                {language === 'hi'
                  ? 'खाता बनाएं'
                  : 'Create Account'}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />

              <span>
                {language === 'hi'
                  ? 'आपकी कृषि जानकारी आपके खाते में सुरक्षित रहती है।'
                  : 'Your farm intelligence stays private to your account.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATE 3: AUTHENTICATED
  // ═══════════════════════════════════════════════════════════════════

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim() || isAiLoading) return;

    if (!isGenuinelyAuthenticated) {
      setIsAiChatOpen(true);
      return;
    }

    // Stop voice recognition before sending
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }

      recognitionRef.current = null;
      setIsListening(false);
    }

    sendChatMessage(inputText.trim());

    setInputText('');
  };

  const quickPrompts = [
    language === 'hi'
      ? 'आज सिंचाई करनी चाहिए?'
      : 'Should I irrigate today?',

    language === 'hi'
      ? 'मिट्टी में नाइट्रोजन कैसे बढ़ाएं?'
      : 'How to boost soil nitrogen?',

    language === 'hi'
      ? 'पत्तियों पर धब्बे का क्या इलाज है?'
      : 'Treatment for leaf spots?',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/45 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none md:p-0 md:inset-auto md:right-6 md:bottom-6 md:w-[410px] md:h-[540px] md:block pointer-events-auto transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsAiChatOpen(false);
        }
      }}
      style={{ touchAction: 'none' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          touchAction: 'auto',
          ...mobileHeightStyle,
        }}
        className="relative w-full max-w-[420px] md:max-w-none md:w-[410px] h-[min(580px,calc(100dvh-5rem))] md:h-[540px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e8ece8] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 md:zoom-in-100 slide-in-from-bottom-3 duration-200"
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-agri-800 to-agri-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Bot className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-none truncate">
                  GreenAgro AI Assistant
                </h3>

                <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              </div>

              <p className="text-[11px] text-agri-100 mt-0.5 truncate">
                {farm
                  ? `${farm.name}${
                      farm.primaryCrop
                        ? ` • ${farm.primaryCrop}`
                        : ''
                    }`
                  : 'AI Agricultural Advisory'}

                {weather
                  ? ` (${weather.current.temp}°C)`
                  : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAiChatOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close GreenAgro AI Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured Context Badge */}
        <div className="bg-[#f2f7f3] px-3.5 py-1.5 border-b border-agri-100 flex items-center justify-between text-[11px] text-gray-600 shrink-0">
          <span className="font-medium text-agri-900 truncate">
            🌱 Soil:{' '}
            {soil ? `${soil.score}/100` : 'N/A'} • 🛰️
            NDVI:{' '}
            {satellite.ndvi !== null
              ? satellite.ndvi
              : 'N/A'}{' '}
            • 💧 Rain:{' '}
            {weather
              ? `${weather.current.rainProbability}%`
              : 'N/A'}
          </span>

          <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 font-semibold text-agri-800 shrink-0 ml-1.5">
            Gemini
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto overscroll-contain space-y-3 bg-[#fafbfa]">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user'
                  ? 'items-end'
                  : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap overflow-hidden ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-white border border-[#e5e9e5] text-gray-800 rounded-bl-xs shadow-xs'
                }`}
              >
                {msg.text}
              </div>

              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isAiLoading && (
            <div className="flex items-center gap-2 text-xs text-agri-700 bg-white border border-agri-100 px-3 py-2 rounded-2xl w-fit shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-agri-600" />

              <span>
                {language === 'hi'
                  ? 'खेत की जानकारी का विश्लेषण हो रहा है...'
                  : 'Analyzing farm context...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-3 pt-2 pb-1 bg-white flex gap-1.5 overflow-x-auto overscroll-contain no-scrollbar shrink-0">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(prompt);
                inputRef.current?.focus();
              }}
              className="text-[11px] bg-[#f2f6f2] hover:bg-agri-100 text-agri-900 px-2.5 py-1 rounded-full whitespace-nowrap border border-agri-200/50 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-2.5 sm:p-3 bg-white border-t border-gray-100 flex items-center gap-1.5 sm:gap-2 shrink-0"
          style={{
            paddingBottom:
              'max(0.625rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) =>
              setInputText(e.target.value)
            }
            onFocus={() => {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                  behavior: 'smooth',
                });
              }, 150);
            }}
            placeholder={
              language === 'hi'
                ? 'अपना प्रश्न हिंदी या अंग्रेजी में लिखें...'
                : 'Type your question in Hindi or English...'
            }
            className="flex-1 min-w-0 bg-[#f5f8f5] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-hidden focus:border-agri-500 transition-colors text-gray-800"
          />

          {/* 🎤 VOICE BUTTON */}
          <button
            type="button"
            onClick={startVoiceInput}
            disabled={isAiLoading}
            className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              isListening
                ? 'text-red-600 bg-red-50 hover:bg-red-100 animate-pulse'
                : 'text-gray-400 hover:text-agri-700 hover:bg-gray-100'
            } disabled:opacity-50`}
            title={
              isListening
                ? language === 'hi'
                  ? 'सुन रहा हूँ... रोकने के लिए क्लिक करें'
                  : 'Listening... Click to stop'
                : language === 'hi'
                  ? 'बोलकर प्रश्न पूछें'
                  : 'Ask by voice'
            }
            aria-label={
              isListening
                ? 'Stop voice input'
                : 'Start voice input'
            }
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* SEND BUTTON */}
          <button
            type="submit"
            disabled={!inputText.trim() || isAiLoading}
            className="p-2 bg-agri-700 hover:bg-agri-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};