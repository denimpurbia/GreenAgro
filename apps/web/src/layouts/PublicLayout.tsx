import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Home, Layers, Info, Globe2, PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FloatingAiButton } from '../components/common/FloatingAiButton';
import { FloatingAiChatModal } from '../components/common/FloatingAiChatModal';

// Section IDs that exist as scroll targets on the landing page
type SectionId = 'home' | 'features' | 'about' | 'contact';
const SECTIONS: SectionId[] = ['home', 'features', 'about', 'contact'];

// Routes considered part of the landing page (all render LandingPage component)
const LANDING_ROUTES = new Set(['/', '/features', '/about', '/contact']);

export const PublicLayout: React.FC = () => {
  const { language, setLanguage, t } = useApp();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const location = useLocation();
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Track currently visible sections to pick the topmost one
  const visibleRef = useRef<Set<SectionId>>(new Set());

  const isLandingPage = LANDING_ROUTES.has(location.pathname);
  const isBricsPage = location.pathname === '/brics-network';

  // ── Smooth-scroll helper ──────────────────────────────────────────────────
  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      // Immediately update active state on click (observer will confirm later)
      setActiveSection(id);
    }
  }, []);

  // ── Click handler — works from any page ──────────────────────────────────
  const handleSectionClick = useCallback(
    (sectionId: SectionId) => {
      if (!isLandingPage) {
        // Store target, navigate to landing page, then scroll after mount
        sessionStorage.setItem('ga_scroll_target', sectionId);
        navigate('/');
      } else {
        scrollToSection(sectionId);
      }
    },
    [isLandingPage, navigate, scrollToSection]
  );

  // ── After navigating to landing page, scroll to stored target ─────────────
  useEffect(() => {
    if (!isLandingPage) return;
    const target = sessionStorage.getItem('ga_scroll_target') as SectionId | null;
    if (target && SECTIONS.includes(target)) {
      sessionStorage.removeItem('ga_scroll_target');
      // Delay slightly to let the page DOM render
      const t = setTimeout(() => scrollToSection(target), 180);
      return () => clearTimeout(t);
    }
  }, [location.pathname, isLandingPage, scrollToSection]);

  // ── IntersectionObserver scroll-spy — only on landing page ───────────────
  useEffect(() => {
    // Disconnect any existing observer when leaving landing page
    if (!isLandingPage) {
      observerRef.current?.disconnect();
      observerRef.current = null;
      visibleRef.current.clear();
      return;
    }

    visibleRef.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id as SectionId;
          if (entry.isIntersecting) {
            visibleRef.current.add(id);
          } else {
            visibleRef.current.delete(id);
          }
        });

        // Pick the topmost section currently visible in the viewport
        const topmost = SECTIONS.find((id) => visibleRef.current.has(id));
        if (topmost) {
          setActiveSection(topmost);
        }
      },
      {
        rootMargin: '-80px 0px -45% 0px',
        threshold: 0,
      }
    );

    observerRef.current = observer;

    // Observe sections after a tick so elements are in the DOM
    const tid = setTimeout(() => {
      SECTIONS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 120);

    return () => {
      clearTimeout(tid);
      observer.disconnect();
    };
  }, [isLandingPage]);

  // ── Active class helper for desktop ───────────────────────────────────────
  const navClass = (section: SectionId) =>
    isLandingPage && activeSection === section
      ? 'text-[#166534] font-bold'
      : 'text-gray-600 hover:text-[#166534] transition-colors';

  // ── Mobile bottom navigation items ────────────────────────────────────────
  const mobileNavItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
      isActive: isLandingPage && activeSection === 'home',
      onClick: () => handleSectionClick('home'),
    },
    {
      id: 'features' as const,
      label: 'Features',
      icon: Layers,
      isActive: isLandingPage && activeSection === 'features',
      onClick: () => handleSectionClick('features'),
    },
    {
      id: 'about' as const,
      label: 'About',
      icon: Info,
      isActive: isLandingPage && activeSection === 'about',
      onClick: () => handleSectionClick('about'),
    },
    {
      id: 'knowledge' as const,
      label: 'Knowledge',
      icon: Globe2,
      isActive: isBricsPage,
      onClick: () => navigate('/brics-network'),
    },
    {
      id: 'contact' as const,
      label: 'Contact',
      icon: PhoneCall,
      isActive: isLandingPage && activeSection === 'contact',
      onClick: () => handleSectionClick('contact'),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0f291e] flex flex-col selection:bg-agri-200 selection:text-agri-950 font-sans">
      {/* Top Navbar — responsive logo and controls */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 sm:px-8 lg:px-14 py-1.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Brand Logo on Left — responsive scaling */}
          <Link
            to="/"
            className="flex items-center shrink-0"
            onClick={() => isLandingPage && scrollToSection('home')}
          >
            <img
              src="/images/greenagro-logo.png"
              alt="GreenAgro"
              className="h-10 sm:h-12 md:h-16 lg:h-[72px] w-auto object-contain"
            />
          </Link>

          {/* Center Navigation Links (DESKTOP ONLY — kept exactly as requested) */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-600">

            {/* Home — scroll to #home on landing, or navigate there */}
            <button
              type="button"
              onClick={() => handleSectionClick('home')}
              className={`bg-transparent border-0 p-0 text-[15px] font-medium cursor-pointer ${navClass('home')}`}
            >
              {t('nav.home')}
            </button>

            {/* Features — scroll to #features */}
            <button
              type="button"
              onClick={() => handleSectionClick('features')}
              className={`bg-transparent border-0 p-0 text-[15px] font-medium cursor-pointer ${navClass('features')}`}
            >
              {t('nav.features')}
            </button>

            {/* About — scroll to #about */}
            <button
              type="button"
              onClick={() => handleSectionClick('about')}
              className={`bg-transparent border-0 p-0 text-[15px] font-medium cursor-pointer ${navClass('about')}`}
            >
              {t('nav.about')}
            </button>

            {/* BRICS Network / Knowledge Exchange — its own route */}
            <NavLink
              to="/brics-network"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#166534] font-bold'
                  : 'text-gray-600 hover:text-[#166534] transition-colors'
              }
            >
              {t('nav.bricsNetwork')}
            </NavLink>

            {/* Contact — scroll to #contact */}
            <button
              type="button"
              onClick={() => handleSectionClick('contact')}
              className={`bg-transparent border-0 p-0 text-[15px] font-medium cursor-pointer ${navClass('contact')}`}
            >
              {t('nav.contact')}
            </button>

          </nav>

          {/* Right Action: Language Selector & Login Button */}
          <div className="flex items-center gap-2 sm:gap-3.5">

            {/* Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-800 transition-colors shadow-2xs"
                aria-label="Change Language"
              >
                <span>{language === 'hi' ? 'HI' : 'EN'}</span>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-[#f2f6f2] ${
                      language === 'en' ? 'text-[#166534] bg-[#edf7ee]' : 'text-gray-700'
                    }`}
                  >
                    English (EN)
                  </button>
                  <button
                    onClick={() => { setLanguage('hi'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-[#f2f6f2] ${
                      language === 'hi' ? 'text-[#166534] bg-[#edf7ee]' : 'text-gray-700'
                    }`}
                  >
                    हिंदी (HI)
                  </button>
                </div>
              )}
            </div>

            {/* Login / Get Started Button */}
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              {t('nav.getStarted')}
            </Link>
          </div>

        </div>
      </header>

      {/* Page Content — includes safe-area bottom padding on mobile for fixed bottom nav */}
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </main>

      {/* ============================================================
          MOBILE FIXED BOTTOM NAVIGATION BAR (< md screens)
          ============================================================ */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-15 max-w-lg mx-auto px-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`flex-1 flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative cursor-pointer ${
                  item.isActive
                    ? 'text-[#166534] font-bold'
                    : 'text-gray-500 font-medium hover:text-[#166534]'
                }`}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span className="text-[11px] mt-0.5 leading-tight truncate max-w-[64px] text-center">
                  {item.label}
                </span>
                {item.isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#166534]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Floating AI */}
      <FloatingAiButton />
      <FloatingAiChatModal />
    </div>
  );
};

