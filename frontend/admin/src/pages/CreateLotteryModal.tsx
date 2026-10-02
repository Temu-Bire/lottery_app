import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Dices, AlertCircle } from 'lucide-react';
import { CreateLotteryRequest, ApiError } from '@lottery/shared';
import { api } from '../api/client.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';

export interface CreateLotteryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLotteryModal: React.FC<CreateLotteryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  // Basic Details
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState('20');
  const [currency, setCurrency] = useState('ETB');
  const [maxTickets, setMaxTickets] = useState('');

  // Date times (default: sales start now, sales end 7 days, draw date 7 days + 1 hour)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const drawTime = new Date(nextWeek.getTime() + 60 * 60 * 1000);

  const formatLocalIso = (d: Date) => d.toISOString().slice(0, 16);

  const [salesStart, setSalesStart] = useState(formatLocalIso(now));
  const [salesEnd, setSalesEnd] = useState(formatLocalIso(nextWeek));
  const [drawDate, setDrawDate] = useState(formatLocalIso(drawTime));

  // Rules
  const [minNumbers, setMinNumbers] = useState('6');
  const [numberRangeMax, setNumberRangeMax] = useState('49');
  const [bonusNumbersCount, setBonusNumbersCount] = useState('0');

  // Prize Tiers
  const [prizes, setPrizes] = useState<
    Array<{ tier: number; name: string; matchCount: number; matchBonus: boolean; amount: string }>
  >([
    { tier: 1, name: 'Grand Jackpot', matchCount: 6, matchBonus: false, amount: '1000000' },
    { tier: 2, name: 'Second Prize', matchCount: 5, matchBonus: false, amount: '50000' },
    { tier: 3, name: 'Third Prize', matchCount: 4, matchBonus: false, amount: '2000' },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  // Auto-generate slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);
  };

  const addPrizeTier = () => {
    const nextTier = prizes.length + 1;
    setPrizes((prev) => [
      ...prev,
      {
        tier: nextTier,
        name: `Tier ${nextTier}`,
        matchCount: Math.max(1, 6 - nextTier + 1),
        matchBonus: false,
        amount: '500',
      },
    ]);
  };

  const removePrizeTier = (idx: number) => {
    if (prizes.length <= 1) return;
    setPrizes((prev) => prev.filter((_, i) => i !== idx));
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CreateLotteryRequest) => {
      return api.lottery.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lotteries'] });
      queryClient.invalidateQueries({ queryKey: ['lotteries'] });
      onClose();
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create lottery');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const price = parseFloat(ticketPrice);
    if (isNaN(price) || price <= 0) {
      setFormError('Ticket price must be positive');
      return;
    }

    const payload: CreateLotteryRequest = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      ticketPrice: price,
      currency: currency.trim() || 'ETB',
      maxTickets: maxTickets ? parseInt(maxTickets, 10) : undefined,
      salesStart: new Date(salesStart).toISOString(),
      salesEnd: new Date(salesEnd).toISOString(),
      drawDate: new Date(drawDate).toISOString(),
      rules: {
        minNumbers: parseInt(minNumbers, 10) || 6,
        maxNumbers: parseInt(minNumbers, 10) || 6,
        numberRangeMin: 1,
        numberRangeMax: parseInt(numberRangeMax, 10) || 49,
        bonusNumbersCount: parseInt(bonusNumbersCount, 10) || 0,
        bonusRangeMin: parseInt(bonusNumbersCount, 10) > 0 ? 1 : undefined,
        bonusRangeMax: parseInt(bonusNumbersCount, 10) > 0 ? 10 : undefined,
        allowsDuplicates: false,
      },
      prizes: prizes.map((p) => ({
        tier: p.tier,
        name: p.name,
        matchCount: p.matchCount,
        matchBonus: p.matchBonus,
        prizeType: 'FIXED',
        amount: parseFloat(p.amount) || 0,
      })),
    };

    createMutation.mutate(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Lottery Game" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {formError && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Game Name"
            placeholder="e.g. Ethiopian National Lotto 6/49"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
          <Input
            label="URL Slug (Unique)"
            placeholder="ethiopian-national-lotto-649"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <Input
          label="Description (Optional)"
          placeholder="Weekly jackpot lottery with life-changing cash prizes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Ticket Price"
            type="number"
            step="0.5"
            min="0.5"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(e.target.value)}
            required
          />
          <Input
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
          <Input
            label="Max Tickets (Optional)"
            type="number"
            placeholder="No cap"
            value={maxTickets}
            onChange={(e) => setMaxTickets(e.target.value)}
          />
        </div>

        {/* Schedule */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <span className="font-bold text-slate-200 block">Game Schedule</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input
              label="Sales Start"
              type="datetime-local"
              value={salesStart}
              onChange={(e) => setSalesStart(e.target.value)}
              required
            />
            <Input
              label="Sales End"
              type="datetime-local"
              value={salesEnd}
              onChange={(e) => setSalesEnd(e.target.value)}
              required
            />
            <Input
              label="Draw Date"
              type="datetime-local"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Number Rules */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <span className="font-bold text-slate-200 block">Number Rules</span>
          <div className="grid grid-cols-3 gap-2.5">
            <Input
              label="Numbers to Pick"
              type="number"
              min="1"
              max="10"
              value={minNumbers}
              onChange={(e) => setMinNumbers(e.target.value)}
              required
            />
            <Input
              label="Max Ball Range (1 - N)"
              type="number"
              min="10"
              max="99"
              value={numberRangeMax}
              onChange={(e) => setNumberRangeMax(e.target.value)}
              required
            />
            <Input
              label="Bonus Numbers Count"
              type="number"
              min="0"
              max="3"
              value={bonusNumbersCount}
              onChange={(e) => setBonusNumbersCount(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Prize Tiers */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">Prize Tiers</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPrizeTier}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs py-1"
            >
              Add Tier
            </Button>
          </div>

          <div className="space-y-2">
            {prizes.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-900 border border-slate-800"
              >
                <div className="col-span-1 text-center font-bold text-slate-400">
                  #{p.tier}
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => {
                      const copy = [...prizes];
                      copy[i].name = e.target.value;
                      setPrizes(copy);
                    }}
                    placeholder="Prize name"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={p.matchCount}
                    onChange={(e) => {
                      const copy = [...prizes];
                      copy[i].matchCount = parseInt(e.target.value, 10) || 0;
                      setPrizes(copy);
                    }}
                    placeholder="Matches"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={p.amount}
                    onChange={(e) => {
                      const copy = [...prizes];
                      copy[i].amount = e.target.value;
                      setPrizes(copy);
                    }}
                    placeholder="Amount"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400 font-bold"
                  />
                </div>
                <div className="col-span-1 text-right">
                  {prizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrizeTier(i)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={createMutation.isPending}
            leftIcon={<Dices className="w-3.5 h-3.5" />}
          >
            Create Lottery
          </Button>
        </div>
      </form>
    </Modal>
  );
};
