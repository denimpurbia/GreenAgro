import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  X,
  Sparkles,
  Loader2,
  ShieldCheck,
  Paperclip,
  Camera,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  AudioWaveform as WaveformIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/* =========================================================
   TTS SPEECH SYNTHESIS HELPER (ENGLISH, HINDI, MEWARI)
========================================================= */

function playTtsSpeech(
  text: string,
  lang: 'en' | 'hi' | 'mewari',
  onStart?: () => void,
  onEnd?: () => void
) {
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    // Clean markdown characters (*, #, _, `, [ ], etc.) for smooth natural voice
    const cleanSpokenText = text
      .replace(/[*#_`~>\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpokenText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
    const voices = window.speechSynthesis.getVoices();

    if (lang === 'en') {
      utterance.lang = 'en-IN';
      const enVoice =
        voices.find(
          (v) =>
            v.lang.includes('en-IN') ||
            (v.lang.startsWith('en') && v.name.includes('India'))
        ) || voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    } else {
      // For Hindi and Mewari
      utterance.lang = 'hi-IN';
      const hiVoice =
        voices.find(
          (v) => v.lang.includes('hi') || v.lang.includes('HI')
        ) || voices.find((v) => v.lang.includes('en-IN'));
      if (hiVoice) utterance.voice = hiVoice;
      // Mewari sounds best at a warm, rhythmic pace
      utterance.rate = lang === 'mewari' ? 0.93 : 0.98;
      utterance.pitch = lang === 'mewari' ? 1.02 : 1.0;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[TTS] Failed to speak:', err);
    if (onEnd) onEnd();
  }
}

function stopTtsSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export const FloatingAiChatModal: React.FC = () => {
  const {
    isAiChatOpen,
    setIsAiChatOpen,
    isAuthenticated,
    isAuthLoading,
    user,
    chatMessages,
    chatLanguage,
    setChatLanguage,
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
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [attachedImage, setAttachedImage] = useState<{
    file: File;
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Strict authentication check
  const isGenuinelyAuthenticated = Boolean(
    isAuthenticated && user && user.id && user.id !== 'usr-guest'
  );

  // Mobile viewport height
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  // 🎤 SPEECH-TO-TEXT (STT) WITH DYNAMIC LANGUAGE SUPPORT
  // ═══════════════════════════════════════════════════════════════════

  const startVoiceInput = () => {
    if (isAiLoading) return;

    // Stop TTS if speaking
    stopTtsSpeech();
    setIsSpeakingTts(false);
    setActiveSpeakingMsgId(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        chatLanguage === 'mewari'
          ? 'Voice Input थारे browser में नी चाले। Chrome या Edge इस्तेमाल करो सा।'
          : chatLanguage === 'hi'
          ? 'Voice Input आपके browser में supported नहीं है। कृपया Chrome या Edge इस्तेमाल करें।'
          : 'Voice input is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Language mapping:
    // English -> en-IN
    // Hindi & Mewari -> hi-IN (phonetically transcribes Mewari Devanagari accurately)
    recognition.lang = chatLanguage === 'en' ? 'en-IN' : 'hi-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript.trim());

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };

    recognition.onerror = (event: any) => {
      console.warn('[STT] Recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;

      if (event.error === 'not-allowed') {
        alert(
          chatLanguage === 'mewari'
            ? 'Microphone री permission चालू करो सा।'
            : chatLanguage === 'hi'
            ? 'Microphone permission allow करें और फिर दोबारा try करें।'
            : 'Please allow microphone permission and try again.'
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error('[STT] Failed to start:', error);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const handleStopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Submit voice input directly and trigger voice response
  const handleSendVoiceImmediately = async () => {
    handleStopVoice();
    if (!inputText.trim()) return;
    await submitMessage('voice');
  };

  // Cleanup voice recognition and TTS on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      stopTtsSpeech();
    };
  }, []);

  // Stop voice & audio when modal closes
  useEffect(() => {
    if (!isAiChatOpen) {
      handleStopVoice();
      stopTtsSpeech();
      setIsSpeakingTts(false);
      setActiveSpeakingMsgId(null);
    }
  }, [isAiChatOpen]);

  // ═══════════════════════════════════════════════════════════════════
  // 🔊 MANUAL TTS PLAY / STOP FOR INDIVIDUAL MESSAGES
  // ═══════════════════════════════════════════════════════════════════

  const handleToggleSpeakMessage = (msgId: string, text: string) => {
    if (activeSpeakingMsgId === msgId) {
      stopTtsSpeech();
      setIsSpeakingTts(false);
      setActiveSpeakingMsgId(null);
      return;
    }

    stopTtsSpeech();
    setActiveSpeakingMsgId(msgId);
    setIsSpeakingTts(true);

    playTtsSpeech(
      text,
      chatLanguage,
      () => setIsSpeakingTts(true),
      () => {
        setIsSpeakingTts(false);
        setActiveSpeakingMsgId(null);
      }
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // MOBILE VIEWPORT & ESC
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isAiChatOpen) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      handleViewportChange();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          'resize',
          handleViewportChange
        );
      }
    };
  }, [isAiChatOpen]);

  useEffect(() => {
    if (!isAiChatOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAiChatOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiChatOpen, setIsAiChatOpen]);

  // Auto scroll chat
  useEffect(() => {
    if (isAiChatOpen && isGenuinelyAuthenticated) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiChatOpen, isGenuinelyAuthenticated]);

  // Cleanup object URLs and camera stream on unmount
  useEffect(() => {
    return () => {
      if (attachedImage?.previewUrl) {
        URL.revokeObjectURL(attachedImage.previewUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  if (!isAiChatOpen) return null;

  // ═══════════════════════════════════════════════════════════════════
  // SUBMIT HANDLER (MODALITY MATCHING)
  // ═══════════════════════════════════════════════════════════════════

  const submitMessage = async (inputMode: 'text' | 'voice' = 'text') => {
    if ((!inputText.trim() && !attachedImage) || isAiLoading) return;

    if (!isGenuinelyAuthenticated) {
      setIsAiChatOpen(true);
      return;
    }

    handleStopVoice();

    const msgText =
      inputText.trim() ||
      (chatLanguage === 'mewari'
        ? '[तस्वीर जोड़ी गी]'
        : chatLanguage === 'hi'
        ? '[छवि संलग्न]'
        : '[Image attached]');

    const payloadImage = attachedImage
      ? {
          base64: attachedImage.base64,
          mimeType: attachedImage.mimeType,
          previewUrl: attachedImage.previewUrl,
        }
      : undefined;

    setInputText('');
    if (attachedImage?.previewUrl) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);

    // Send message to backend with memory context
    const reply = await sendChatMessage(
      msgText,
      payloadImage,
      inputMode,
      chatLanguage
    );

    // MODALITY MATCHING: If input was voice, output speaks voice automatically!
    if (inputMode === 'voice' && reply && typeof reply === 'string') {
      setIsSpeakingTts(true);
      setActiveSpeakingMsgId('latest-ai');

      playTtsSpeech(
        reply,
        chatLanguage,
        () => setIsSpeakingTts(true),
        () => {
          setIsSpeakingTts(false);
          setActiveSpeakingMsgId(null);
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage('text');
  };

  // ═══════════════════════════════════════════════════════════════════
  // 📎 IMAGE & CAMERA
  // ═══════════════════════════════════════════════════════════════════

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB.');
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({
        file,
        base64: reader.result as string,
        mimeType: file.type,
        previewUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    if (attachedImage?.previewUrl) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Your browser does not support camera access.');
      setIsCameraOpen(true);
      return;
    }

    setCameraError(null);
    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err: any) {
      setCameraError('Camera permission denied or camera not available.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const fileName = `camera-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedImage({
            file,
            base64: reader.result as string,
            mimeType: 'image/jpeg',
            previewUrl,
          });
          stopCameraStream();
          setIsCameraOpen(false);
          setCameraError(null);
        };
        reader.readAsDataURL(file);
      },
      'image/jpeg',
      0.92
    );
  };

  const closeCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // ═══════════════════════════════════════════════════════════════════
  // QUICK PROMPTS BY LANGUAGE
  // ═══════════════════════════════════════════════════════════════════

  const quickPrompts = useMemo(() => {
    if (chatLanguage === 'mewari') {
      return [
        'आज पाणी पावणो के?',
        'माटी में खाद कई नाखणी?',
        'गेहूं में रोग रो इलाज कई है?',
        'मौसम रा हाल कई है?',
      ];
    }
    if (chatLanguage === 'hi') {
      return [
        'आज सिंचाई करनी चाहिए?',
        'मिट्टी में नाइट्रोजन कैसे बढ़ाएं?',
        'पत्तियों पर धब्बे का क्या इलाज है?',
        'फसल में खाद कब डालें?',
      ];
    }
    return [
      'Should I irrigate today?',
      'How to boost soil nitrogen?',
      'Treatment for leaf spots?',
      'Best organic fertilizers?',
    ];
  }, [chatLanguage]);

  // Auth screen redirection
  const handleLoginClick = () => {
    setIsAiChatOpen(false);
    sessionStorage.setItem('ga_open_chat_after_login', 'true');
    navigate('/login', {
      state: { from: { pathname: location.pathname, search: location.search }, openAiChat: true },
    });
  };

  // Non-authenticated UI
  if (!isGenuinelyAuthenticated) {
    return (
      <div className="fixed z-50 right-2 sm:right-4 md:right-6 bottom-[70px] sm:bottom-20 md:bottom-6 w-[calc(100vw-1rem)] sm:w-[420px] max-w-[440px] pointer-events-auto transition-all">
        <div className="relative w-full bg-white rounded-3xl shadow-2xl border border-[#e8ece8] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-[#0f291e] to-[#156637] text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">GreenAgro AI Assistant</h3>
                <p className="text-[11px] text-emerald-200">Hindi • English • मेवाड़ी</p>
              </div>
            </div>
            <button
              onClick={() => setIsAiChatOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#156637] mx-auto">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Sign in to Use AI Farm Assistant</h4>
              <p className="text-xs text-gray-500 mt-1">
                Voice & Text agricultural advisory in Hindi, English, and Mewari based on your farm, soil, and satellite data.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoginClick}
              className="w-full py-2.5 px-4 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              Login to Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAIN AUTHENTICATED CHATBOT UI
  // ═══════════════════════════════════════════════════════════════════

  const modalWidthClass = isExpanded
    ? 'w-[calc(100vw-1rem)] sm:w-[580px] md:w-[640px] max-w-[720px]'
    : 'w-[calc(100vw-1rem)] sm:w-[420px] md:w-[440px] max-w-[460px]';

  const modalHeightClass = isExpanded
    ? 'h-[min(680px,calc(100dvh-5.5rem))] sm:h-[min(740px,calc(100dvh-5.5rem))]'
    : 'h-[min(540px,calc(100dvh-5.5rem))] sm:h-[min(590px,calc(100dvh-6rem))]';

  return (
    <div
      className={`fixed z-50 right-2 sm:right-4 md:right-6 bottom-[70px] sm:bottom-20 md:bottom-6 ${modalWidthClass} pointer-events-auto transition-all duration-200`}
    >
      <div
        className={`relative w-full ${modalHeightClass} bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e0e6e0] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* =====================================================
            HEADER WITH EXPAND, VOICE STATUS & CLOSE
        ===================================================== */}
        <div className="bg-gradient-to-r from-[#0f291e] via-[#124d2c] to-[#156637] text-white p-3 sm:p-3.5 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 relative">
              <Bot className="w-5 h-5" />
              {isSpeakingTts && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm leading-none truncate">
                  GreenAgro AI Assistant
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              </div>

              <p className="text-[11px] text-emerald-100 mt-0.5 truncate">
                {farm?.name || 'My Farm'} • {farm?.primaryCrop || 'Crops'}
                {weather ? ` (${weather.current.temp}°C)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* STOP TTS BUTTON IF SPEAKING */}
            {isSpeakingTts && (
              <button
                type="button"
                onClick={stopTtsSpeech}
                className="px-2 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Stop Audio Speech"
              >
                <VolumeX className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}

            {/* EXPAND / SHRINK MODAL */}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand full size'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* CLOSE MODAL */}
            <button
              type="button"
              onClick={() => setIsAiChatOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =====================================================
            LANGUAGE SELECTOR PILLS (HINDI, ENGLISH, MEWARI)
            + LIVE FARM CONTEXT STRIP
        ===================================================== */}
        <div className="bg-[#f0f6f0] px-3 py-1.5 border-b border-emerald-100 flex items-center justify-between gap-2 shrink-0">
          {/* THREE-LANGUAGE SELECTOR */}
          <div className="flex items-center bg-white rounded-xl p-0.5 border border-emerald-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setChatLanguage('hi')}
              className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                chatLanguage === 'hi'
                  ? 'bg-[#156637] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🇮🇳 हिंदी
            </button>

            <button
              type="button"
              onClick={() => setChatLanguage('mewari')}
              className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                chatLanguage === 'mewari'
                  ? 'bg-[#156637] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🌾 मेवाड़ी
            </button>

            <button
              type="button"
              onClick={() => setChatLanguage('en')}
              className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                chatLanguage === 'en'
                  ? 'bg-[#156637] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          {/* FARM CONTEXT METRICS */}
          <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5 truncate">
            <span>🌱 {soil ? `${soil.score}/100` : '87/100'}</span>
            <span>•</span>
            <span>🛰️ {satellite.ndvi !== null ? satellite.ndvi : '0.35'}</span>
            <span>•</span>
            <span>💧 {weather ? `${weather.current.rainProbability}%` : '3%'}</span>
          </div>
        </div>

        {/* =====================================================
            ACTIVE VOICE LISTENING OVERLAY
        ===================================================== */}
        {isListening && (
          <div className="bg-emerald-50 px-3.5 py-2 border-b border-emerald-200 flex items-center justify-between gap-2 shrink-0 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 min-w-0">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="truncate">
                {chatLanguage === 'mewari'
                  ? 'मेवाड़ी में बोल रिया हो... (बोलता रहो सा)'
                  : chatLanguage === 'hi'
                  ? 'हिंदी में सुन रहा हूँ... (बोलिए)'
                  : 'Listening in English... (Speak now)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleStopVoice}
                className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendVoiceImmediately}
                disabled={!inputText.trim()}
                className="px-2.5 py-1 rounded-lg bg-[#156637] hover:bg-[#104e2a] text-white text-[10px] font-bold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Send Voice
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            ACTIVE TTS SPEAKING INDICATOR BAR
        ===================================================== */}
        {isSpeakingTts && (
          <div className="bg-emerald-800 text-white px-3.5 py-1.5 text-[11px] font-semibold flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>
                {chatLanguage === 'mewari'
                  ? 'मेवाड़ी में आवाज बोल री है...'
                  : chatLanguage === 'hi'
                  ? 'बोलकर जवाब दिया जा रहा है...'
                  : 'Speaking response aloud...'}
              </span>
            </div>
            <button
              type="button"
              onClick={stopTtsSpeech}
              className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded cursor-pointer"
            >
              ⏹️ Stop Audio
            </button>
          </div>
        )}

        {/* ── Camera Overlay ── */}
        {isCameraOpen && (
          <div className="absolute inset-0 z-20 bg-black flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden">
            {cameraError ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Camera className="w-10 h-10 text-white/50" />
                <p className="text-sm text-white/80">{cameraError}</p>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="mt-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-3 py-2 shrink-0">
                  <span className="text-xs text-white/70">Take crop photo</span>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="shrink-0 flex items-center justify-center gap-4 py-3 px-4">
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg cursor-pointer shrink-0"
                  >
                    <div className="w-9 h-9 rounded-full border-2 border-agri-700 bg-agri-50" />
                  </button>
                  <div className="w-[72px]" />
                </div>
              </>
            )}
          </div>
        )}

        {/* =====================================================
            MESSAGES STREAM
        ===================================================== */}
        <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto overscroll-contain space-y-3.5 bg-[#fafbfa]">
          {chatMessages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = activeSpeakingMsgId === msg.id;

            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[84%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap overflow-hidden shadow-xs ${
                    isUser
                      ? 'bg-[#156637] text-white rounded-br-xs'
                      : 'bg-white border border-[#e5e9e5] text-gray-800 rounded-bl-xs'
                  }`}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Crop attachment"
                      className="max-w-[220px] w-full rounded-xl border border-white/20 mb-2 object-contain block"
                    />
                  )}

                  <div>{msg.text}</div>

                  {/* LISTEN / STOP BUTTON FOR ASSISTANT MESSAGES */}
                  {!isUser && (
                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSpeakMessage(msg.id, msg.text)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          isSpeakingThis
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-[#156637] hover:bg-emerald-100'
                        }`}
                        title={isSpeakingThis ? 'Stop Audio' : 'Listen with Voice (TTS)'}
                      >
                        {isSpeakingThis ? (
                          <>
                            <VolumeX className="w-3 h-3" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen Audio</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-gray-400">
                        {msg.language === 'mewari'
                          ? 'मेवाड़ी'
                          : msg.language === 'hi'
                          ? 'हिंदी'
                          : 'English'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 px-1">
                  <span>{msg.timestamp}</span>
                  {msg.inputMode === 'voice' && (
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      • <Mic className="w-2.5 h-2.5" /> Voice
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {isAiLoading && (
            <div className="flex items-center gap-2.5 text-xs text-[#156637] bg-white border border-emerald-200 px-3.5 py-2.5 rounded-2xl w-fit shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#156637]" />
              <span className="font-semibold">
                {chatLanguage === 'mewari'
                  ? 'थारे खेत रो हिसाब लगा रियो हूँ... (Analyzing farm)'
                  : chatLanguage === 'hi'
                  ? 'खेत की जानकारी का विश्लेषण हो रहा है...'
                  : 'Analyzing farm context...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* =====================================================
            QUICK PROMPTS BY CHOSEN LANGUAGE
        ===================================================== */}
        <div className="px-3 pt-2 pb-1 bg-white flex gap-1.5 overflow-x-auto overscroll-contain no-scrollbar shrink-0 border-t border-gray-50">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(prompt);
                inputRef.current?.focus();
              }}
              className="text-[11px] bg-[#f0f6f0] hover:bg-emerald-100 text-[#0f291e] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border border-emerald-200/60 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Image Preview Strip */}
        {attachedImage && (
          <div className="px-3 pb-2 bg-white flex items-center gap-2 shrink-0 border-t border-gray-100 pt-2">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-200 shrink-0">
              <img
                src={attachedImage.previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] text-gray-500 flex-1 truncate">
              {attachedImage.file.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* =====================================================
            INPUT BAR WITH STT VOICE, IMAGE & SEND
        ===================================================== */}
        <form
          onSubmit={handleSubmit}
          className="p-2 sm:p-2.5 bg-white border-t border-gray-100 flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* 📎 UPLOAD IMAGE */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAiLoading}
            className="p-2 rounded-xl text-gray-500 hover:text-[#156637] hover:bg-emerald-50 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Attach crop leaf image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* 📷 CAMERA */}
          <button
            type="button"
            onClick={openCamera}
            disabled={isAiLoading}
            className="p-2 rounded-xl text-gray-500 hover:text-[#156637] hover:bg-emerald-50 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Take photo of crop"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* INPUT FIELD */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              chatLanguage === 'mewari'
                ? 'मेवाड़ी या हिंदी में पूछो सा...'
                : chatLanguage === 'hi'
                ? 'अपना प्रश्न हिंदी या अंग्रेजी में लिखें...'
                : 'Ask your farming question...'
            }
            className="flex-1 min-w-0 bg-[#f4f7f4] border border-gray-200 focus:border-[#156637] rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-hidden transition-colors"
          />

          {/* 🎤 VOICE INPUT (STT) */}
          <button
            type="button"
            onClick={startVoiceInput}
            disabled={isAiLoading}
            className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              isListening
                ? 'text-red-600 bg-red-100 ring-2 ring-red-400 animate-pulse'
                : 'text-gray-500 hover:text-[#156637] hover:bg-emerald-50'
            } disabled:opacity-50`}
            title={
              isListening
                ? 'Listening... Click to stop'
                : `Ask by voice in ${chatLanguage === 'mewari' ? 'Mewari' : chatLanguage === 'hi' ? 'Hindi' : 'English'}`
            }
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* SEND BUTTON */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !attachedImage) || isAiLoading}
            className="p-2 bg-[#156637] hover:bg-[#104e2a] disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FloatingAiChatModal;
