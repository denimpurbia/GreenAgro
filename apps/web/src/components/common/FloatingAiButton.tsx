import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const FloatingAiButton: React.FC = () => {
  const { isAiChatOpen, setIsAiChatOpen, isAuthenticated, isAuthLoading, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide button when modal is open so they never collide
  if (isAiChatOpen) return null;

  // Genuine authentication — same check as modal uses
  const isGenuinelyAuthenticated = Boolean(
    isAuthenticated && user && user.id && user.id !== 'usr-guest'
  );

  const handleClick = () => {
    // While auth is being verified, open modal (it shows loading state)
    if (isAuthLoading) {
      setIsAiChatOpen(true);
      return;
    }

    if (!isGenuinelyAuthenticated) {
      // Redirect to login with return state, matching the original login-required behavior
      sessionStorage.setItem('ga_open_chat_after_login', 'true');
      navigate('/login', {
        state: {
          from: { pathname: location.pathname, search: location.search },
          openAiChat: true,
        },
      });
      return;
    }

    setIsAiChatOpen(true);
  };

  return (
    <div className="fixed z-30 right-2 sm:right-4 md:right-6 bottom-[70px] sm:bottom-20 md:bottom-6 select-none pointer-events-auto transition-all">
      <button
        onClick={handleClick}
        className="group relative flex items-center justify-center p-0 bg-transparent border-0 outline-hidden cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-hidden"
        aria-label="Ask GreenAgro AI Assistant"
        title="Ask GreenAgro AI Assistant"
      >
        {/* Original Farmer Mascot with original eyes, face, and speech bubble */}
        <img
          src="/images/greenagro-mascot.png"
          alt="Ask GreenAgro AI Assistant - I'm here to help!"
          className="w-16 h-16 sm:w-22 sm:h-22 md:w-32 md:h-32 object-contain select-none pointer-events-auto drop-shadow-md"
          draggable={false}
        />
      </button>
    </div>
  );
};
