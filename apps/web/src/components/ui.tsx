'use client';

import clsx from 'clsx';
import * as React from 'react';

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={clsx('bg-panel/70 border border-white/10 rounded-xl shadow-glow', props.className)} />;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }
) {
  const variant = props.variant ?? 'primary';
  return (
    <button
      {...props}
      className={clsx(
        'px-4 py-2 rounded-lg text-sm font-medium border transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-neon/15 border-neon/40 hover:bg-neon/20',
        variant === 'ghost' && 'bg-white/5 border-white/10 hover:bg-white/10',
        variant === 'danger' && 'bg-danger/15 border-danger/40 hover:bg-danger/20',
        props.className
      )}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full px-3 py-2 rounded-lg bg-panel2/60 border border-white/10 outline-none focus:ring-2 ring-neon/20 focus:border-neon/30',
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'w-full px-3 py-2 rounded-lg bg-panel2/60 border border-white/10 outline-none focus:ring-2 ring-neon/20 focus:border-neon/30',
        props.className
      )}
    />
  );
}

