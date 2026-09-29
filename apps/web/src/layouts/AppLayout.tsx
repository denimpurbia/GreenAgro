import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { MobileDrawer } from '../components/common/MobileDrawer';
import { FloatingAiButton } from '../components/common/FloatingAiButton';
import { FloatingAiChatModal } from '../components/common/FloatingAiChatModal';

export const AppLayout: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8faf7] text-[#0f291e] overflow-x-hidden">
      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        <Header
          onToggleMobileDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          isDrawerOpen={isDrawerOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation and Drawer */}
      <MobileBottomNav
        onToggleMore={() => setIsDrawerOpen(true)}
        isMoreOpen={isDrawerOpen}
      />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Global Floating AI Assistant & Chat */}
      <FloatingAiButton />
      <FloatingAiChatModal />
    </div>
  );
};
