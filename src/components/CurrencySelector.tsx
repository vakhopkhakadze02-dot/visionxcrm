import React, { useState, useRef, useEffect } from "react";
import { Coins, ChevronDown, Check } from "lucide-react";
import { CurrencyCode } from "../types";
import { CurrencyDisplayMode } from "./PriceTag";
import { RateTable } from "../currency";

interface CurrencySelectorProps {
  currentCurrency: CurrencyCode;
  onSelectCurrency: (currency: CurrencyCode) => void;
  compact?: boolean;
  /** Which currency leads when a record was created in a different one. */
  displayMode?: CurrencyDisplayMode;
  onDisplayModeChange?: (mode: CurrencyDisplayMode) => void;
  /** NBG rates, for showing what is in force and how fresh it is. */
  rates?: RateTable | null;
  onRefreshRates?: () => void;
}

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string; nameKa: string }[] = [
  { code: "GEL", symbol: "₾", label: "GEL (₾)", nameKa: "ქართული ლარი" },
  { code: "USD", symbol: "$", label: "USD ($)", nameKa: "აშშ დოლარი" },
  { code: "EUR", symbol: "€", label: "EUR (€)", nameKa: "ევრო" },
  { code: "GBP", symbol: "£", label: "GBP (£)", nameKa: "ფუნტი სტერლინგი" },
];

export default function CurrencySelector({
  currentCurrency = "GEL",
  onSelectCurrency,
  compact = false,
  displayMode = "record",
  onDisplayModeChange,
  rates = null,
  onRefreshRates
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCurrencyInfo = CURRENCIES.find(c => c.code === currentCurrency) || CURRENCIES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer shadow-2xs ${
          isOpen 
            ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        } ${compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"}`}
        title="ვალუტის შეცვლა"
      >
        <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black text-[10px] flex items-center justify-center shrink-0">
          {activeCurrencyInfo.symbol}
        </span>
        <span className="font-extrabold uppercase tracking-wide">{activeCurrencyInfo.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180 text-indigo-500" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-indigo-500" />
              ვალუტა
            </span>
            <span className="text-[9px] font-medium text-slate-400">მთავარი: {currentCurrency}</span>
          </div>
          <div className="py-1">
            {CURRENCIES.map((item) => {
              const isSelected = item.code === currentCurrency;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onSelectCurrency(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center justify-center shrink-0">
                      {item.symbol}
                    </span>
                    <div>
                      <span className="font-bold block leading-none">{item.code}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.nameKa}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>

          {onDisplayModeChange && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2.5 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                სხვა ვალუტის ჩანაწერები
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => onDisplayModeChange("record")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    displayMode === "record"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  title="თანხა ჩანს იმ ვალუტით, რომლითაც შეიქმნა"
                >
                  ორიგინალი
                </button>
                <button
                  type="button"
                  onClick={() => onDisplayModeChange("business")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    displayMode === "business"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  title={`თანხა ჩანს ${currentCurrency}-ში, ეროვნული ბანკის კურსით`}
                >
                  {currentCurrency}-ში
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-snug">
                ჩანაწერი ინახავს იმ ვალუტას, რომლითაც შეიქმნა — ვალუტის შეცვლა ძველ თანხებს არ ცვლის.
              </p>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[9.5px] text-slate-400">
                  {rates?.date ? `NBG კურსი: ${rates.date}` : "კურსი ჯერ არ ჩამოიტვირთა"}
                </span>
                {onRefreshRates && (
                  <button
                    type="button"
                    onClick={onRefreshRates}
                    className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    განახლება
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
