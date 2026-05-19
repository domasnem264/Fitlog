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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(getSupabaseConfigError());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const configError = getSupabaseConfigError();
    if (configError) {
      setError(configError);
      return;
    }

    if (!email.trim() || !password) {
      setError("Užpildykite el. paštą ir slaptažodį");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      window.location.href = "/dashboard";
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
          <CardDescription>Prisijunkite prie savo paskyros</CardDescription>
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--color-destructive)]">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Jungiamasi..." : "Prisijungti"}
            </Button>
            <p className="text-center text-sm text-[var(--color-muted-foreground)]">
              Neturi paskyros?{" "}
              <Link href="/signup" className="font-medium text-[var(--color-primary)]">
                Registruokis
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
