import React from "react";
import { Lock, X, KeyRound, ShieldCheck } from "lucide-react";

export default function PinModal({
  isOpen,
  isSettingPin,
  pinInput,
  setPinInput,
  pinError,
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <KeyRound className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isSettingPin ? "Set PIN Code" : "Enter PIN to Unlock"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isSettingPin
            ? "Create a 4-6 digit numerical PIN to encrypt and protect this note."
            : "Please enter the security PIN code to view and edit this note."}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              maxLength={8}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {pinError && (
              <p className="mt-1.5 text-xs text-rose-500 text-center font-medium">
                {pinError}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!pinInput.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition"
            >
              {isSettingPin ? "Protect Note" : "Unlock Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
