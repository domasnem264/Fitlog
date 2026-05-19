"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, getSupabaseConfigError } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(getSupabaseConfigError());
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);

    const configError = getSupabaseConfigError();
    if (configError) {
      setError(configError);
      return;
    }

    if (!email.trim() || !password) {
      setError("Užpildykite visus laukus");
      return;
    }

    if (password !== confirm) {
      setError("Slaptažodžiai nesutampa");
      return;
    }

    if (password.length < 6) {
      setError("Slaptažodis turi būti bent 6 simbolių");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        window.location.href = "/dashboard";
        return;
      }

      // El. pašto patvirtinimas įjungtas Supabase — sesijos nėra
      setSuccess(
        "Paskyra sukurta. Patikrinkite el. paštą ir patvirtinkite adresą, tada prisijunkite."
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nepavyko prisijungti prie serverio";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[var(--color-primary)]">FitLog</CardTitle>
          <CardDescription>Sukurkite naują paskyrą</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">El. paštas</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Slaptažodis</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Pakartokite slaptažodį</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--color-destructive)]">{error}</p>
            )}
            {success && (
              <p className="text-sm text-[var(--color-primary)]">{success}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registruojama..." : "Registruotis"}
            </Button>
            <p className="text-center text-sm text-[var(--color-muted-foreground)]">
              Jau turi paskyrą?{" "}
              <Link href="/login" className="font-medium text-[var(--color-primary)]">
                Prisijunk
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
