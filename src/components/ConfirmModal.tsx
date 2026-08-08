/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Trash2, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "დადასტურება",
  cancelText = "გაუქმება",
  variant = "danger"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm overflow-hidden relative z-10 p-6 flex flex-col items-center text-center transition-colors duration-200"
        >
          {/* Visual indicator */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 shrink-0 ${
            variant === "danger" 
              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40"
              : variant === "warning"
              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
              : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40"
          }`}>
            {variant === "danger" ? (
              <Trash2 className="w-5 h-5" />
            ) : variant === "warning" ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>

          {/* Heading and details */}
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2 leading-relaxed">
            {message}
          </p>

          {/* Buttons layout */}
          <div className="flex items-center gap-3 w-full mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-2 px-4 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
