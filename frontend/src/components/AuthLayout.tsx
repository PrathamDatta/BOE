import React from 'react';
import { Logo } from './Logo';

export const AuthLayout: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center relative overflow-hidden py-12 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400 opacity-20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400 opacity-20 blur-[100px] pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 z-10 flex justify-center">
        <Logo className="scale-110" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            BOE Financial Tracking &amp; Reconciliation Platform
          </h2>
        </div>

        <div className="bg-white/70 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-blue-900/5 sm:rounded-2xl sm:px-10 border border-white/50">
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
