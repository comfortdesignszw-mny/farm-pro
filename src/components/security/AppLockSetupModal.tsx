import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, X, Check, AlertCircle, Delete, Eye, EyeOff } from 'lucide-react';

interface AppLockSetupModalProps {
  isOpen: boolean;
  mode: 'setup' | 'change' | 'disable';
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AppLockSetupModal: React.FC<AppLockSetupModalProps> = ({
  isOpen,
  mode,
  onClose,
  onSuccess,
}) => {
  // Step in wizard:
  // For 'setup': 1 (Enter new PIN) -> 2 (Confirm new PIN)
  // For 'change': 0 (Enter current PIN) -> 1 (Enter new PIN) -> 2 (Confirm new PIN)
  // For 'disable': 0 (Enter current PIN)
  const [step, setStep] = useState<number>(mode === 'setup' ? 1 : 0);
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const storedPin = localStorage.getItem('farmpro_app_lock_pin') || '';

  const activeValue =
    step === 0 ? currentPinInput : step === 1 ? newPinInput : confirmPinInput;

  const handleDigit = (digit: string) => {
    if (activeValue.length < 4) {
      const nextVal = activeValue + digit;
      setErrorMsg(null);

      if (step === 0) {
        setCurrentPinInput(nextVal);
        if (nextVal.length === 4) {
          // Verify current PIN
          if (nextVal === storedPin) {
            if (mode === 'disable') {
              // Disable App Lock
              localStorage.removeItem('farmpro_app_lock_pin');
              localStorage.removeItem('farmpro_app_lock_enabled');
              onSuccess('App Lock has been disabled.');
              onClose();
            } else {
              // Proceed to enter new PIN
              setStep(1);
            }
          } else {
            setErrorMsg('Incorrect current PIN. Please try again.');
            setCurrentPinInput('');
          }
        }
      } else if (step === 1) {
        setNewPinInput(nextVal);
        if (nextVal.length === 4) {
          // Proceed to confirm step
          setStep(2);
        }
      } else if (step === 2) {
        setConfirmPinInput(nextVal);
        if (nextVal.length === 4) {
          // Check if matches new PIN
          if (nextVal === newPinInput) {
            localStorage.setItem('farmpro_app_lock_pin', newPinInput);
            localStorage.setItem('farmpro_app_lock_enabled', 'true');
            onSuccess(
              mode === 'change'
                ? 'Your 4-digit PIN has been updated.'
                : 'App Lock enabled with your new 4-digit PIN!'
            );
            onClose();
          } else {
            setErrorMsg('PINs do not match. Please re-enter your new PIN.');
            setConfirmPinInput('');
            setNewPinInput('');
            setStep(1);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    if (step === 0) {
      setCurrentPinInput(currentPinInput.slice(0, -1));
    } else if (step === 1) {
      setNewPinInput(newPinInput.slice(0, -1));
    } else if (step === 2) {
      setConfirmPinInput(confirmPinInput.slice(0, -1));
    }
  };

  const handleClear = () => {
    setErrorMsg(null);
    if (step === 0) setCurrentPinInput('');
    else if (step === 1) setNewPinInput('');
    else if (step === 2) setConfirmPinInput('');
  };

  const getTitle = () => {
    if (mode === 'disable') return 'Disable App Lock';
    if (mode === 'change') {
      if (step === 0) return 'Verify Current PIN';
      if (step === 1) return 'Enter New 4-digit PIN';
      return 'Confirm New 4-digit PIN';
    }
    // setup
    if (step === 1) return 'Create 4-digit PIN';
    return 'Confirm 4-digit PIN';
  };

  const getDescription = () => {
    if (mode === 'disable') return 'Enter your current PIN to turn off App Lock protection.';
    if (step === 0) return 'Enter your existing PIN to continue.';
    if (step === 1) return 'Choose a 4-digit number you can easily remember.';
    return 'Re-enter your 4-digit number to confirm.';
  };

  return (
    <div
      id="app-lock-setup-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="app-lock-setup-dialog"
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 text-center"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-farm-navy font-black text-lg">
            <div className="w-9 h-9 rounded-xl bg-farm-cyan/15 text-farm-navy flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <span>{getTitle()}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-600">
          {getDescription()}
        </p>

        {/* 4-Digit PIN Indicators */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = activeValue.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-farm-navy scale-125 shadow-sm'
                    : 'bg-slate-100 border-2 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg ? (
          <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              id={`setup-key-${d}`}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-xl font-extrabold text-slate-900 border border-slate-200 flex items-center justify-center cursor-pointer transition-all"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            id="setup-key-clear"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            id="setup-key-0"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-xl font-extrabold text-slate-900 border border-slate-200 flex items-center justify-center cursor-pointer transition-all"
          >
            0
          </button>
          <button
            type="button"
            id="setup-key-backspace"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
