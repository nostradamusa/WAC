"use client";

import { useEffect, useState } from "react";

export default function LanguageToggle() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    // Check if the googtrans cookie is set to sq
    if (document.cookie.includes("googtrans=/en/sq")) {
      setLang("sq");
    } else {
      setLang("en");
    }
  }, []);

  const toggleLanguage = (target: "en" | "sq") => {
    if (target === lang) return;
    
    if (target === "sq") {
      document.cookie = "googtrans=/en/sq; path=/";
      // sometimes needed for subdomains
      document.cookie = `googtrans=/en/sq; path=/; domain=${window.location.hostname}`;
    } else {
      // Clear cookie or set back to en
      document.cookie = "googtrans=/en/en; path=/";
      document.cookie = `googtrans=/en/en; path=/; domain=${window.location.hostname}`;
    }
    
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center gap-1.5 text-xs font-bold bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] rounded-full px-3 py-1.5 transition-all w-max md:mr-1">
      <button 
        onClick={() => toggleLanguage('sq')}
        className={`transition-all hover:text-white tracking-wider ${lang === 'sq' ? 'text-[#b08d57] opacity-100 drop-shadow-[0_0_8px_rgba(176,141,87,0.5)]' : 'text-white/60'} focus:outline-none`}
      >
        SQ
      </button>
      <span className="opacity-20 text-white font-light">|</span>
      <button 
        onClick={() => toggleLanguage('en')}
        className={`transition-all hover:text-white tracking-wider ${lang === 'en' ? 'text-[#b08d57] opacity-100 drop-shadow-[0_0_8px_rgba(176,141,87,0.5)]' : 'text-white/60'} focus:outline-none`}
      >
        EN
      </button>
    </div>
  );
}
