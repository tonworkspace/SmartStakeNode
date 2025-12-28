import { FC } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeToggle: FC<ThemeToggleProps> = ({ isDark, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="relative w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4">
        <Sun 
          className={`absolute inset-0 w-4 h-4 text-amber-500 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 w-4 h-4 text-slate-600 dark:text-slate-300 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`} 
        />
      </div>
    </button>
  );
};