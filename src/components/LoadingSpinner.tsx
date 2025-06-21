import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
        <p className="text-white/80 text-lg">Loading...</p>
      </div>
    </div>
  );
}