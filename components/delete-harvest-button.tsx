"use client";
import { useFormStatus } from "react-dom";

export default function DeleteHarvestButton() {
  const { pending } = useFormStatus();
  return <button className="danger" type="submit" disabled={pending} onClick={(event) => {
    if (!window.confirm("Vill du radera den här skörden permanent? Det går inte att ångra.")) event.preventDefault();
  }}>{pending ? "Raderar…" : "Radera permanent"}</button>;
}
