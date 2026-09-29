import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingPage: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="w-full bg-white overflow-hidden">
      {/* ============================================================
          HERO SECTION - RESPONSIVE MOBILE-FIRST & DESKTOP PRESERVED
          ============================================================ */}
      <section id="home" className="relative w-full min-h-0 lg:min-h-[640px] flex items-center scroll-mt-20 py-8 sm:py-12 lg:py-16">
        {/* Background panoramic blending (DESKTOP ONLY — kept exactly as requested) */}
        <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Farmer photo aligned to the right half, smoothly extending leftward */}
          <div className="absolute right-0 top-0 bottom-0 w-[74%] lg:w-[82%] xl:w-[80%] h-full">
            <img
              src="/images/farmer-hero.jpg"
              alt="Indian farmer holding smartphone in lush green agriculture field"
              className="w-full h-full object-cover object-[center_20%] lg:object-[center_15%]"
            />
            {/* Soft semi-transparent gradient mask to keep white minimal and translucent */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/45 to-transparent w-[38%] lg:w-[26%] xl:w-[24%]" />
            {/* Top and bottom subtle blending */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/40 to-transparent" />
          </div>
        </div>

        {/* Foreground Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Text Column */}
            <div className="lg:col-span-7 flex flex-col items-start max-w-xl">
              {/* Badge: AI for Farmers • Sustainable Future */}
              <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#dcfce7] text-[#166534] text-xs sm:text-sm font-semibold tracking-tight mb-4 sm:mb-5 shadow-2xs">
                <span>AI for Farmers</span>
                <span className="text-[#166534] opacity-60">•</span>
                <span>Sustainable Future</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[64px] font-extrabold text-[#0e2a1e] tracking-tight leading-[1.12] lg:leading-[1.08] mb-3 sm:mb-4">
                Smarter Farming
                <br />
                <span className="text-[#0e2a1e]">Healthier Tomorrow</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-[17px] text-gray-600 leading-relaxed max-w-[500px] mb-6 sm:mb-8 font-normal">
                AI-powered agricultural intelligence for small and marginal farmers. Satellite insights, soil health, weather forecasts and expert guidance — all in one place.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-bold text-sm sm:text-base shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>

              {/* Mobile Hero Visual (MOBILE ONLY — single column flow: Badge -> Heading -> Desc -> CTA -> Visual) */}
              <div className="lg:hidden w-full mt-6 sm:mt-8">
                <div className="relative w-full h-52 sm:h-72 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200/90 shadow-md">
                  <img
                    src="/images/farmer-hero.jpg"
                    alt="Indian farmer holding smartphone in lush green agriculture field"
                    className="w-full h-full object-cover object-[center_20%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#166534] shadow-xs">
                    🌱 GreenAgro Intelligence
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Spacer (Desktop only) */}
            <div className="hidden lg:block lg:col-span-5" />
          </div>
        </div>
      </section>

      {/* ============================================================
          6 FEATURE CARDS ROW - RESPONSIVE GRID
          ============================================================ */}
      <section id="features" className="w-full bg-white border-t border-gray-100 py-8 sm:py-10 lg:py-14 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-6 lg:gap-8 items-start text-center">
            {/* 1. Satellite Insights */}
            <Link
              to="/app/satellite"
              className="group flex flex-col items-center justify-center transition-transform hover:-translate-y-1 p-2 rounded-xl"
            >
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-[#d1fae5] flex items-center justify-center mb-2.5 sm:mb-3 shadow-2xs group-hover:bg-[#bbf7d0] transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#15803d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 7 9 3 5 7l4 4" />
                  <path d="m17 11 4 4-4 4-4-4" />
                  <path d="m8 12 4 4 6-6-4-4Z" />
                  <path d="m16 8 3-3" />
                  <path d="M9 21a6 6 0 0 0-6-6" />
                </svg>
              </div>
              <span className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#0e3820] leading-snug group-hover:text-[#166534]">
                Satellite Insights
              </span>
            </Link>

            {/* 2. AI Crop Diagnosis */}
            <Link
              to="/app/disease"
              className="group flex flex-col items-center justify-center transition-transform hover:-translate-y-1 p-2 rounded-xl"
            >
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-[#dcfce7] flex items-center justify-center mb-2.5 sm:mb-3 shadow-2xs group-hover:bg-[#bbf7d0] transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 4 13a7 7 0 0 1 7-7c4 0 7 2 7 5a7 7 0 0 1-7 9Z" />
                  <path d="M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                  <path d="m14 14 5 5" />
                  <path d="M12 2v2" />
                </svg>
              </div>
              <span className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#0e3820] leading-snug group-hover:text-[#166534]">
                AI Crop Diagnosis
              </span>
            </Link>

            {/* 3. Weather Forecasts */}
            <Link
              to="/app/weather"
              className="group flex flex-col items-center justify-center transition-transform hover:-translate-y-1 p-2 rounded-xl"
            >
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-[#e0f2fe] flex items-center justify-center mb-2.5 sm:mb-3 shadow-2xs group-hover:bg-[#bae6fd] transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#0284c7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="#38bdf8" stroke="#0284c7" />
                  <path d="M8 21v2" />
                  <path d="M12 21v2" />
                  <path d="M16 21v2" />
                </svg>
              </div>
              <span className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#0e3820] leading-snug group-hover:text-[#166534]">
                Weather Forecasts
              </span>
            </Link>

            {/* 4. Soil Health */}
            <Link
              to="/app/soil"
              className="group flex flex-col items-center justify-center transition-transform hover:-translate-y-1 p-2 rounded-xl"
            >
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-[#dcfce7] flex items-center justify-center mb-2.5 sm:mb-3 shadow-2xs group-hover:bg-[#bbf7d0] transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#15803d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10v6" />
                  <path d="M12 10a4 4 0 0 0-4-4c0 3 2 4 4 4Z" fill="#22c55e" />
                  <path d="M12 10a4 4 0 0 1 4-4c0 3-2 4-4 4Z" fill="#16a34a" />
                  <ellipse cx="12" cy="18" rx="7" ry="3" fill="#166534" stroke="#14532d" />
                </svg>
              </div>
              <span className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#0e3820] leading-snug group-hover:text-[#166534]">
                Soil Health
              </span>
            </Link>

            {/* 5. Regenerative Farming */}
            <Link
              to="/app/regenerative"
              className="group flex flex-col items-center justify-center transition-transform hover:-translate-y-1 p-2 rounded-xl"
            >
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-[#dcfce7] flex items-center justify-center mb-2.5 sm:mb-3 shadow-2xs group-hover:bg-[#bbf7d0] transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 4 13a7 7 0 0 1 7-7c4 0 7 2 7 5a7 7 0 0 1-7 9Z" fill="#22c55e" stroke="#15803d" />
                  <path d="M8 14s1.5 2 4 2" stroke="#ffffff" />
                </svg>
              </div>
              <span className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#0e3820] leading-snug group-hover:text-[#166534]">
                Regenerative Farming
              </span>
            </Link>

            {/* 6. BRICS Knowledge Exchange */}
            <Link
              to="/app/knowledge"
              className="group flex flex-col items-center justify-center transition-transform hover:-translate-y-1 p-2 rounded-xl"
            >
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-2.5 sm:mb-3 shadow-2xs group-hover:bg-gray-200 transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4L26 22H6L16 4Z" stroke="#eab308" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M16 4L26 22" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  <path d="M26 22H6" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                  <path d="M6 22L16 4" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#0e3820] leading-snug group-hover:text-[#166534]">
                BRICS Knowledge Exchange
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS / INTELLIGENCE LOOP SECTION
          ============================================================ */}
      <section id="about" className="bg-[#f8faf7] py-12 sm:py-16 px-4 sm:px-8 lg:px-14 border-t border-gray-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#166534] bg-[#dcfce7] px-3.5 py-1 rounded-full">
              The GreenAgro Closed Loop
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0e2a1e] mt-3">
              How GreenAgro AI Empowers Farmers
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Combining satellite data, soil sensors, weather telemetry, and multimodal Google AI into localized agronomic advisory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 text-center">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/70 shadow-card">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#166534] font-bold text-xs flex items-center justify-center mx-auto mb-2">1</div>
              <h4 className="font-bold text-sm text-gray-900">Farm Context</h4>
              <p className="text-xs text-gray-500 mt-1">Area, crop stage, soil type, and location boundary.</p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/70 shadow-card">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#166534] font-bold text-xs flex items-center justify-center mx-auto mb-2">2</div>
              <h4 className="font-bold text-sm text-gray-900">Satellite + Soil</h4>
              <p className="text-xs text-gray-500 mt-1">Sentinel-2 NDVI tracking and deterministic NPK scoring.</p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/70 shadow-card">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#166534] font-bold text-xs flex items-center justify-center mx-auto mb-2">3</div>
              <h4 className="font-bold text-sm text-gray-900">Weather + Disease</h4>
              <p className="text-xs text-gray-500 mt-1">Micro-climate forecast and multimodal leaf disease scan.</p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/70 shadow-card">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#166534] font-bold text-xs flex items-center justify-center mx-auto mb-2">4</div>
              <h4 className="font-bold text-sm text-gray-900">Google Gemini AI</h4>
              <p className="text-xs text-gray-500 mt-1">Personalized advisory synthesized in Hindi and English.</p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/70 shadow-card">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#166534] font-bold text-xs flex items-center justify-center mx-auto mb-2">5</div>
              <h4 className="font-bold text-sm text-gray-900">Regenerative Plan</h4>
              <p className="text-xs text-gray-500 mt-1">Long-term soil organic carbon and water resilience score.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#0e2a1e] text-gray-300 py-8 sm:py-10 px-4 sm:px-8 lg:px-14 scroll-mt-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          {/* Logo block — full logo including tagline */}
          <div className="shrink-0">
            <img
              src="/images/greenagro-logo.png"
              alt="GreenAgro — Smarter Farming. Healthier Tomorrow."
              className="h-auto w-[200px] sm:w-[260px] md:w-[320px] max-w-full object-contain brightness-0 invert opacity-95"
            />
          </div>
          {/* Copyright */}
          <div className="text-xs text-gray-400 text-center sm:text-right">
            <div className="font-medium text-gray-300 mb-1">GreenAgro Intelligence Network</div>
            <div className="mt-1">© 2026 GreenAgro. Built for "Build with AI: Code for Communities".</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
