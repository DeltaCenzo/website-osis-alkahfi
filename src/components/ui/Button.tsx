import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'ghost' && 'border border-white/15 bg-white/5 text-white hover:bg-white/10',
        className,
      )}
      {...props}
    />
  );
}
