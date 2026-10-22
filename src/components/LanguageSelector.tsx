import React from 'react';
import { Languages } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur-sm">
      <div className="flex items-center pl-2 pr-1 text-slate-400">
        <Languages className="w-3.5 h-3.5" />
      </div>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
          currentLanguage === 'en'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        English
      </button>
      <button
        onClick={() => onLanguageChange('ur')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap font-urdu ${
          currentLanguage === 'ur'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        اردو (Urdu)
      </button>
    </div>
  );
};
