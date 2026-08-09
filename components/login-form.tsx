"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions";

function Submit() { const { pending } = useFormStatus(); return <button disabled={pending}>{pending ? "Loggar in…" : "Logga in"}</button>; }
export default function LoginForm() {
  const [state, action] = useActionState(login, {});
  return <form action={action} className="card grid">
    {state.error && <p className="error" role="alert">{state.error}</p>}
    <div className="field"><label htmlFor="email">E-postadress</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    <div className="field"><label htmlFor="password">Lösenord</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div><Submit />
  </form>;
}
