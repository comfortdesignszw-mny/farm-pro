import React, { useState, useEffect, useCallback } from 'react';
import { Sprout, Lock, Delete, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface AppLockScreenProps {
  onUnlock: () => void;
  onPinResetSuccess: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  onUnlock,
  onPinResetSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // PIN Recovery Modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);

  const getStoredPin = useCallback(() => {
    return localStorage.getItem('farmpro_app_lock_pin') || '';
  }, []);

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const verifyPin = (enteredPin: string) => {
    const correctPin = getStoredPin();
    if (enteredPin === correctPin) {
      // Correct PIN - Unlock immediately
      setErrorMessage(null);
      onUnlock();
    } else {
      // Incorrect PIN - Trigger error shake and reset input
      setIsShaking(true);
      setErrorMessage('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMessage(null);
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  // Keyboard support for desktop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showRecoveryModal || showResetSuccessModal) return;

      if (/^[0-9]$/.test(e.key)) {
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, showRecoveryModal, showResetSuccessModal]);

  // Recovery PIN input handler
  const handleRecoveryDigit = (digit: string) => {
    if (recoveryPin.length < 4) {
      const nextRecPin = recoveryPin + digit;
      setRecoveryPin(nextRecPin);
      setRecoveryError(null);

      if (nextRecPin.length === 4) {
        verifyRecoveryPin(nextRecPin);
      }
    }
  };

  const verifyRecoveryPin = (enteredRecoveryPin: string) => {
    // Default Recovery PIN is 0000 (kept confidential, never rendered in UI)
    if (enteredRecoveryPin === '0000') {
      // Remove the forgotten PIN
      localStorage.removeItem('farmpro_app_lock_pin');
      localStorage.removeItem('farmpro_app_lock_enabled');

      setRecoveryPin('');
      setShowRecoveryModal(false);
      setShowResetSuccessModal(true);
    } else {
      setRecoveryError('Invalid recovery code. Please check and try again.');
      setRecoveryPin('');
    }
  };

  return (
    <div
      id="app-lock-screen"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 text-white select-none overflow-y-auto"
    >
      {/* Top Lock Header with App Icon and Name */}
      <div className="flex flex-col items-center text-center mt-6 sm:mt-10 space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-farm-cyan border-2 border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/40 relative">
          <Sprout className="w-11 h-11 stroke-[2.5]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-farm-navy border-2 border-slate-950 text-farm-cyan flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Farm Pro
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mt-0.5">
            Farm Data Protection
          </p>
        </div>

        <p className="text-sm font-semibold text-slate-300 max-w-xs">
          Enter your 4-digit PIN to access your farm
        </p>

        {/* 4-Digit PIN Indicators */}
        <div
          className={`flex items-center justify-center gap-4 my-2 transition-transform ${
            isShaking ? 'animate-bounce text-rose-400' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-farm-cyan scale-125 shadow-[0_0_12px_rgba(45,212,191,0.8)]'
                    : 'bg-slate-800 border-2 border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        {errorMessage ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 animate-in fade-in">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>

      {/* Touch Numeric Keypad */}
      <div className="w-full max-w-xs my-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              id={`lock-num-${digit}`}
              onClick={() => handleDigitClick(digit)}
              className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-950/60 active:scale-95 border border-slate-800/80 text-2xl font-black text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            id="lock-btn-clear"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            Clear
          </button>

          {/* 0 Button */}
          <button
            type="button"
            id="lock-num-0"
            onClick={() => handleDigitClick('0')}
            className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-950/60 active:scale-95 border border-slate-800/80 text-2xl font-black text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            id="lock-btn-backspace"
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-slate-900/50 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Footer with PIN Recovery */}
      <div className="mb-4 sm:mb-6 text-center">
        <button
          type="button"
          id="forgot-pin-btn"
          onClick={() => {
            setRecoveryPin('');
            setRecoveryError(null);
            setShowRecoveryModal(true);
          }}
          className="text-xs font-bold text-slate-400 hover:text-farm-cyan flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors"
        >
          <KeyRound className="w-4 h-4 text-slate-400" />
          <span>Forgot PIN?</span>
        </button>
      </div>

      {/* PIN Recovery Modal */}
      {showRecoveryModal && (
        <div
          id="recovery-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="recovery-modal-dialog"
            className="w-full max-w-sm bg-slate-900 rounded-3xl p-6 border border-slate-700 text-white space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-farm-cyan">
                <KeyRound className="w-6 h-6" />
                <h3 className="text-lg font-black text-white">
                  PIN Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-medium text-slate-300 leading-relaxed">
              Enter your Master Recovery Code to reset your forgotten PIN and regain access to your farm records.
            </p>

            {/* Recovery PIN visual dots */}
            <div className="flex justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = recoveryPin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      isFilled
                        ? 'bg-farm-cyan scale-110 shadow-sm'
                        : 'bg-slate-800 border border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* Recovery Error */}
            {recoveryError && (
              <div className="text-center text-xs font-bold text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-800/50">
                {recoveryError}
              </div>
            )}

            {/* Mini Keypad for Recovery */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleRecoveryDigit(d)}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-black text-white flex items-center justify-center cursor-pointer"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRecoveryPin('')}
                className="h-12 rounded-xl bg-slate-800 text-xs font-bold text-slate-400 flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleRecoveryDigit('0')}
                className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-black text-white flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setRecoveryPin(recoveryPin.slice(0, -1))}
                className="h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRecoveryModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PIN Reset Success Modal (Redirects to Create New PIN) */}
      {showResetSuccessModal && (
        <div
          id="pin-reset-success-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="pin-reset-success-dialog"
            className="w-full max-w-sm bg-white rounded-3xl p-6 text-center text-slate-900 space-y-4 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.4]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                PIN Reset Successful
              </h3>
              <p className="text-sm font-semibold text-slate-600 mt-2">
                Your PIN is reset, please create another PIN to secure your data.
              </p>
            </div>

            <button
              type="button"
              id="continue-to-create-pin-btn"
              onClick={() => {
                setShowResetSuccessModal(false);
                onPinResetSuccess();
              }}
              className="w-full min-h-[48px] py-2.5 px-4 bg-farm-navy hover:bg-farm-navy-light text-farm-cyan font-bold text-base rounded-xl cursor-pointer shadow-md"
            >
              Set New PIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
