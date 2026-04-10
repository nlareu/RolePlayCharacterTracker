import { useState, useEffect } from 'react';
import { Tracker } from './components/Tracker';

export default function App() {
  // Ensure dark mode is applied
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <main className="max-w-md mx-auto p-4 pb-20">
        <Tracker />
      </main>
    </div>
  );
}
