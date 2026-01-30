"use client";

import { FC } from "react";
import { LucideIcon } from "lucide-react";

interface InteractionRowProps {
  icon: LucideIcon;
  label: string;
  amount: string;
  setAmount: (val: string) => void;
  isEnabled: boolean;
  setIsEnabled: (val: boolean) => void;
  token: "USDC" | "USDT";
  setToken: (val: "USDC" | "USDT") => void;
  colorClass?: string;
}

export const InteractionRow: FC<InteractionRowProps> = ({
  icon: Icon,
  label,
  amount,
  setAmount,
  isEnabled,
  setIsEnabled,
  token,
  setToken,
  colorClass = "text-gray-300"
}) => {
  return (
    <div className="space-y-3 pb-6 border-b border-white/10 last:border-0 last:pb-0">
      <div className={`flex items-center space-x-2 font-medium ${colorClass}`}>
        <Icon className="w-5 h-5" />
        <span className="text-base">{label}</span>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Status Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-1 flex text-xs font-bold shrink-0">
          <button 
            onClick={() => setIsEnabled(true)}
            className={`px-3 py-1 rounded-md shadow-sm transition-all ${isEnabled ? 'bg-solana-green text-black' : 'text-gray-500 hover:text-gray-300'}`}
          >
            On
          </button>
          <button 
            onClick={() => setIsEnabled(false)}
            className={`px-3 py-1 rounded-md shadow-sm transition-all ${!isEnabled ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Off
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isEnabled}
            className={`w-full pl-6 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-solana-purple transition-opacity ${!isEnabled ? 'opacity-50' : ''}`}
          />
        </div>
      </div>

      {/* Token Selector & Quick Add */}
      {isEnabled && (
        <div className="flex items-center space-x-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="relative shrink-0">
            <select 
              value={token}
              onChange={(e) => setToken(e.target.value as "USDC" | "USDT")}
              className="appearance-none bg-white/5 text-gray-300 font-bold py-2 pl-3 pr-8 rounded-xl text-xs border border-white/10 focus:outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          
          <div className="flex border border-white/10 rounded-xl overflow-hidden ml-auto">
            <button 
              onClick={() => setAmount(Math.max(0, parseFloat(amount || "0") - 0.01).toFixed(2))} 
              className="px-3 py-2 hover:bg-white/5 text-gray-400 active:bg-white/10 transition-colors"
            >-</button>
            <div className="px-2 py-2 bg-white/5 text-xs flex items-center border-l border-r border-white/10 font-mono text-gray-400">0.01</div>
            <button 
              onClick={() => setAmount((parseFloat(amount || "0") + 0.01).toFixed(2))} 
              className="px-3 py-2 hover:bg-white/5 text-gray-400 active:bg-white/10 transition-colors"
            >+</button>
          </div>
        </div>
      )}
    </div>
  );
};
