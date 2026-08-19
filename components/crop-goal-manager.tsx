"use client";

import { useActionState } from "react";
import { saveCropGoals } from "@/app/actions";
import type { CatalogItem, CropGoal } from "@/lib/types";

export default function CropGoalManager({ crops, goals, year }: { crops: CatalogItem[]; goals: CropGoal[]; year: number }) {
  const [state, action, pending] = useActionState(saveCropGoals, {});
  const goalByCrop = new Map(goals.map((goal) => [goal.crop_type_id, goal.goal_weight_grams]));

  return <form className="card goal-form" action={action}>
    <input type="hidden" name="year" value={year} />
    <div className="goal-list">
      {crops.map((crop) => {
        const field = `goal_${crop.id}`;
        const goal = goalByCrop.get(crop.id);
        return <div className="goal-row" key={crop.id}>
          <label htmlFor={field}>{crop.name}</label>
          <div className="goal-input">
            <input
              id={field}
              name={field}
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              defaultValue={goal === undefined ? "" : goal / 1000}
              aria-invalid={state.fields?.[field] ? true : undefined}
            />
            <span>kg</span>
          </div>
          {state.fields?.[field] && <span className="error">{state.fields[field][0]}</span>}
        </div>;
      })}
    </div>
    {!crops.length && <p className="empty">Det finns inga aktiva grödor att sätta mål för.</p>}
    <div className="goal-form-footer">
      <button type="submit" disabled={pending || !crops.length}>{pending ? "Sparar…" : "Spara mål"}</button>
      <span className={state.error ? "error" : "success"} aria-live="polite">{state.error ?? state.success}</span>
    </div>
  </form>;
}
