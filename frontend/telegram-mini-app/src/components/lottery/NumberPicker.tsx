import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { LotteryRule } from '@lottery/shared';
import { Button } from '../common/Button.js';
import { useTelegram } from '../../hooks/useTelegram.js';

export interface NumberPickerProps {
  rules: LotteryRule;
  selectedNumbers: number[];
  bonusNumbers: number[];
  onChange: (selected: number[], bonus: number[]) => void;
}

export const NumberPicker: React.FC<NumberPickerProps> = ({
  rules,
  selectedNumbers,
  bonusNumbers,
  onChange,
}) => {
  const { haptic } = useTelegram();

  const minRange = rules.numberRangeMin || 1;
  const maxRange = rules.numberRangeMax || 49;
  const requiredCount = rules.minNumbers || 6;
  const bonusCount = rules.bonusNumbersCount || 0;
  const bonusMax = rules.bonusRangeMax || 10;

  const numbersArray = Array.from({ length: maxRange - minRange + 1 }, (_, i) => minRange + i);
  const bonusArray = bonusCount > 0
    ? Array.from({ length: (rules.bonusRangeMax || 10) - (rules.bonusRangeMin || 1) + 1 }, (_, i) => (rules.bonusRangeMin || 1) + i)
    : [];

  const toggleNumber = (num: number) => {
    haptic('selection');
    if (selectedNumbers.includes(num)) {
      onChange(selectedNumbers.filter((n) => n !== num), bonusNumbers);
    } else {
      if (selectedNumbers.length < requiredCount) {
        const updated = [...selectedNumbers, num].sort((a, b) => a - b);
        onChange(updated, bonusNumbers);
      }
    }
  };

  const toggleBonus = (num: number) => {
    haptic('selection');
    if (bonusNumbers.includes(num)) {
      onChange(selectedNumbers, bonusNumbers.filter((n) => n !== num));
    } else {
      if (bonusNumbers.length < bonusCount) {
        const updated = [...bonusNumbers, num].sort((a, b) => a - b);
        onChange(selectedNumbers, updated);
      }
    }
  };

  const quickPick = () => {
    haptic('medium');
    // Generate distinct random main numbers
    const pool = [...numbersArray];
    const picked: number[] = [];
    while (picked.length < requiredCount && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    picked.sort((a, b) => a - b);

    // Generate random bonus numbers if required
    const pickedBonus: number[] = [];
    if (bonusCount > 0 && bonusArray.length > 0) {
      const bonusPool = [...bonusArray];
      while (pickedBonus.length < bonusCount && bonusPool.length > 0) {
        const idx = Math.floor(Math.random() * bonusPool.length);
        pickedBonus.push(bonusPool.splice(idx, 1)[0]);
      }
      pickedBonus.sort((a, b) => a - b);
    }

    onChange(picked, pickedBonus);
  };

  const clear = () => {
    haptic('light');
    onChange([], []);
  };

  const isMainComplete = selectedNumbers.length === requiredCount;
  const isBonusComplete = bonusCount === 0 || bonusNumbers.length === bonusCount;

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-200 block">
            Select {requiredCount} Numbers
          </span>
          <span className="text-[11px] text-slate-400">
            {selectedNumbers.length} of {requiredCount} chosen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={quickPick}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            className="text-xs py-1 px-2.5 border-slate-700"
          >
            Quick Pick
          </Button>
          {(selectedNumbers.length > 0 || bonusNumbers.length > 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clear}
              className="text-xs py-1 px-2 text-slate-400 hover:text-red-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Selected Numbers Preview Pills */}
      <div className="flex items-center gap-1.5 flex-wrap min-h-10 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
        {selectedNumbers.map((num) => (
          <span
            key={`sel-${num}`}
            className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/30 animate-in fade-in zoom-in-95 duration-100"
          >
            {num}
          </span>
        ))}
        {Array.from({ length: Math.max(0, requiredCount - selectedNumbers.length) }).map((_, i) => (
          <span
            key={`empty-${i}`}
            className="w-8 h-8 rounded-full border border-dashed border-slate-700 text-slate-600 text-xs flex items-center justify-center"
          >
            ?
          </span>
        ))}

        {bonusCount > 0 && (
          <>
            <span className="text-xs font-bold text-slate-500 mx-1">+</span>
            {bonusNumbers.map((num) => (
              <span
                key={`sel-bonus-${num}`}
                className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md shadow-amber-500/30"
              >
                {num}
              </span>
            ))}
            {Array.from({ length: Math.max(0, bonusCount - bonusNumbers.length) }).map((_, i) => (
              <span
                key={`empty-bonus-${i}`}
                className="w-8 h-8 rounded-full border border-dashed border-amber-800/60 text-amber-600/60 text-xs flex items-center justify-center"
              >
                *
              </span>
            ))}
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        {numbersArray.map((num) => {
          const isSelected = selectedNumbers.includes(num);
          const isDisabled = !isSelected && isMainComplete;

          return (
            <button
              key={num}
              type="button"
              disabled={isDisabled}
              onClick={() => toggleNumber(num)}
              className={clsx(
                'aspect-square rounded-xl font-bold text-xs flex items-center justify-center transition-all',
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105 ring-2 ring-blue-400'
                  : isDisabled
                  ? 'bg-slate-950/40 text-slate-600 cursor-not-allowed border border-transparent'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 active:scale-95',
              )}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Bonus Number Grid if applicable */}
      {bonusCount > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">
              Select {bonusCount} Bonus Number{bonusCount > 1 ? 's' : ''} (1-{bonusMax})
            </span>
            <span className="text-[11px] text-slate-400">
              {bonusNumbers.length}/{bonusCount}
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-3 rounded-2xl bg-amber-950/20 border border-amber-900/30">
            {bonusArray.map((num) => {
              const isSelected = bonusNumbers.includes(num);
              const isDisabled = !isSelected && isBonusComplete;

              return (
                <button
                  key={`bonus-${num}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleBonus(num)}
                  className={clsx(
                    'aspect-square rounded-xl font-bold text-xs flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 scale-105 ring-2 ring-amber-300'
                      : isDisabled
                      ? 'bg-slate-950/40 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-950 text-amber-200 border border-amber-900/40 hover:border-amber-700 active:scale-95',
                  )}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
