import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle, className = '' }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      onClick={onToggle}
      className={`relative flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors ${dark ? 'bg-slate-700' : 'bg-amber-300'} ${className}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`relative z-10 grid h-7 w-7 place-items-center rounded-full shadow-md ${dark ? 'ml-auto bg-slate-900 text-amber-200' : 'bg-white text-amber-500'}`}
      >
        {dark ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
      </motion.span>
      <span className={`pointer-events-none absolute inset-0 flex items-center justify-between px-2 ${dark ? 'text-slate-400' : 'text-amber-600/60'}`}>
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}
