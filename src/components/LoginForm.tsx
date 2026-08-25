"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Card, buttonPrimary, inputClass, labelClass } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <Card className="p-6">
      <form action={action} className="space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" name="email" required autoFocus className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input type="password" name="password" required className={inputClass} />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button type="submit" disabled={pending} className={`${buttonPrimary} w-full`}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Card>
  );
}
