import React from 'react';

export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" aria-label={label} />
      <div className="text-sm text-gray-400 mt-2">{label}</div>
    </div>
  );
}

