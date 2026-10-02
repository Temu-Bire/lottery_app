import React, { useState } from 'react';
import { Sparkles, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAdminAuthStore } from '../stores/admin-auth.store.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Card } from '../components/common/Card.js';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAdminAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    await login({
      email: email.trim().toLowerCase(),
      password,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            LOTTO<span className="text-blue-500">ADMIN</span>
          </h1>
          <p className="text-xs text-slate-400">
            Authorized operator & administration console
          </p>
        </div>

        <Card className="p-6 bg-slate-900/90 border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || formError) && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError || error}</span>
              </div>
            )}

            <Input
              label="Operator Email"
              type="email"
              placeholder="admin@lottery.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full mt-2 font-bold"
              size="md"
              isLoading={isLoading}
            >
              Sign In to Management Portal
            </Button>
          </form>
        </Card>

        <p className="text-center text-[11px] text-slate-500">
          All administrative operations are permanently recorded to immutable audit logs.
        </p>
      </div>
    </div>
  );
};
