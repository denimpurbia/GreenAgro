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
  Paperclip,
  Camera,
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

  // Cleanup object URLs and camera stream on unmount — MUST be before any early return
  useEffect(() => {
    return () => {
      if (attachedImage?.previewUrl) {
        URL.revokeObjectURL(attachedImage.previewUrl);
      }
      // Stop camera if open
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            540,
            viewportHeight - 80
          )}px`,
        }
      : undefined;

  // ═══════════════════════════════════════════════════════════════════
  // STATE 1: AUTH LOADING
  // ═══════════════════════════════════════════════════════════════════

  if (isAuthLoading) {
    return (
      <div
        className="fixed z-50 right-2 sm:right-4 md:right-6 bottom-[70px] sm:bottom-20 md:bottom-6 w-[calc(100vw-1rem)] sm:w-[390px] max-w-[400px] pointer-events-auto transition-all"
      >
        <div
          style={mobileHeightStyle}
          className="relative w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e8ece8] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 md:zoom-in-100 duration-200"
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
        className="fixed z-50 right-2 sm:right-4 md:right-6 bottom-[70px] sm:bottom-20 md:bottom-6 w-[calc(100vw-1rem)] sm:w-[390px] max-w-[400px] pointer-events-auto transition-all"
      >
        <div
          style={mobileHeightStyle}
          className="relative w-full max-h-[min(560px,calc(100dvh-5.5rem))] md:max-h-none bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e8ece8] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 md:zoom-in-100 slide-in-from-bottom-3 duration-200"
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

    if ((!inputText.trim() && !attachedImage) || isAiLoading) return;

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

    const msgText =
      inputText.trim() ||
      (language === 'hi' ? '[छवि संलग्न]' : '[Image attached]');

    sendChatMessage(
      msgText,
      attachedImage
        ? {
            base64: attachedImage.base64,
            mimeType: attachedImage.mimeType,
            previewUrl: attachedImage.previewUrl,
          }
        : undefined
    );

    setInputText('');
    if (attachedImage?.previewUrl) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
  };

  // ═══════════════════════════════════════════════════════════════════
  // 📎 IMAGE ATTACH HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(
        language === 'hi'
          ? 'कृपया एक वैध image file चुनें।'
          : 'Please select a valid image file.'
      );
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        language === 'hi'
          ? 'Image 5MB से बड़ी नहीं होनी चाहिए।'
          : 'Image must be less than 5MB.'
      );
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

  // ═══════════════════════════════════════════════════════════════════
  // 📷 CAMERA HANDLERS (getUserMedia)
  // ═══════════════════════════════════════════════════════════════════

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    // On mobile, prefer the native file capture input (simpler UX)
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    // Desktop: use getUserMedia for in-browser camera
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        language === 'hi'
          ? 'आपका browser camera access support नहीं करता।'
          : 'Your browser does not support camera access.'
      );
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
      // Attach stream to video element after it mounts
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err: any) {
      const denied =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setCameraError(
        denied
          ? language === 'hi'
            ? 'Camera permission allow करें और फिर दोबारा try करें।'
            : 'Camera permission denied. Please allow access and try again.'
          : language === 'hi'
            ? 'Camera open करने में समस्या हुई। पुनः प्रयास करें।'
            : 'Could not open camera. Please try again.'
      );
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
      className="fixed z-50 right-2 sm:right-4 md:right-6 bottom-[70px] sm:bottom-20 md:bottom-6 w-[calc(100vw-1rem)] sm:w-[390px] md:w-[410px] max-w-[420px] pointer-events-auto transition-all"
    >
      <div
        style={mobileHeightStyle}
        className="relative w-full h-[min(540px,calc(100dvh-5.5rem))] sm:h-[min(580px,calc(100dvh-6rem))] md:h-[540px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e8ece8] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 md:zoom-in-100 slide-in-from-bottom-3 duration-200"
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

        {/* ── Camera Overlay (desktop getUserMedia) ── */}
        {isCameraOpen && (
          <div className="absolute inset-0 z-20 bg-black flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden">
            {cameraError ? (
              // Error state
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Camera className="w-10 h-10 text-white/50" />
                <p className="text-sm text-white/80">{cameraError}</p>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="mt-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            ) : (
              // Live camera view
              <>
                <div className="flex items-center justify-between px-3 py-2 shrink-0">
                  <span className="text-xs text-white/70">
                    {language === 'hi' ? 'फ़ोटो लें' : 'Take a photo'}
                  </span>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                    aria-label="Close camera"
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
                    className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-lg transition-colors cursor-pointer shrink-0"
                    aria-label="Capture photo"
                  >
                    <div className="w-9 h-9 rounded-full border-2 border-agri-700 bg-agri-50" />
                  </button>
                  <div className="w-[72px]" />
                </div>
              </>
            )}
          </div>
        )}

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
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Attached"
                    className="max-w-[200px] w-full rounded-xl border border-white/20 mb-1.5 object-contain block"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
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

        {/* Image Preview Strip */}
        {attachedImage && (
          <div className="px-3 pb-2 bg-white flex items-center gap-2 shrink-0 border-t border-gray-100 pt-2">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-agri-200 shrink-0">
              <img
                src={attachedImage.previewUrl}
                alt="Attached preview"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] text-gray-500 flex-1 truncate">
              {attachedImage.file.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-2.5 sm:p-3 bg-white border-t border-gray-100 flex items-center gap-1.5 sm:gap-2 shrink-0"
          style={{
            paddingBottom:
              'max(0.625rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Hidden file inputs */}
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

          {/* 📎 UPLOAD IMAGE BUTTON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAiLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-agri-700 hover:bg-gray-100 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title={language === 'hi' ? 'छवि अपलोड करें' : 'Upload image'}
            aria-label="Upload image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* 📷 CAMERA BUTTON */}
          <button
            type="button"
            onClick={openCamera}
            disabled={isAiLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-agri-700 hover:bg-gray-100 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title={language === 'hi' ? 'कैमरा से फ़ोटो लें' : 'Take photo'}
            aria-label="Take photo"
          >
            <Camera className="w-4 h-4" />
          </button>

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
            disabled={(!inputText.trim() && !attachedImage) || isAiLoading}
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