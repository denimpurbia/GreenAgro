import React from 'react';
import { useApp } from '../../context/AppContext';

export const FloatingAiButton: React.FC = () => {
  const { isAiChatOpen, setIsAiChatOpen } = useApp();

  // Hide button when modal is open so they never collide
  if (isAiChatOpen) return null;

  return (
    <div className="fixed z-30 right-2 sm:right-4 md:right-6 bottom-[70px] sm:bottom-20 md:bottom-6 select-none pointer-events-auto transition-all">
      <button
        onClick={() => setIsAiChatOpen(true)}
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
