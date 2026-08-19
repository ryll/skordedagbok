import DashboardChart from "@/components/dashboard-chart";
import { formatWeight } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

type CropStats = DashboardStats["crops"][number];

export default function CropGoalCard({ crop, showGoalProgress }: { crop: CropStats; showGoalProgress: boolean }) {
  const scaleMax = Math.max(crop.weightGrams, crop.goalWeightGrams ?? 0, 1);
  const actualPercent = crop.weightGrams / scaleMax * 100;
  const goalPercent = crop.goalWeightGrams === null ? null : crop.goalWeightGrams / scaleMax * 100;

  return <article className="card crop-card">
    <h3>{crop.name}</h3>
    <div className="crop-summary">
      <div className="crop-summary-values">
        <span>Totalt <strong>{formatWeight(crop.weightGrams)}</strong></span>
        {showGoalProgress && (crop.goalWeightGrams === null
          ? <span className="muted">Inget mål satt</span>
          : <span>Mål <strong>{formatWeight(crop.goalWeightGrams)}</strong></span>)}
      </div>
      {showGoalProgress && crop.goalWeightGrams !== null && <div
        className="goal-track"
        role="img"
        aria-label={`Skördat ${formatWeight(crop.weightGrams)} av målet ${formatWeight(crop.goalWeightGrams)}`}
      >
          <div className="goal-progress-fill" style={{ width: `${actualPercent}%` }} />
          {goalPercent !== null && <span className="goal-marker" style={{ left: `${goalPercent}%` }} aria-hidden="true" />}
        </div>}
    </div>
    <div className="crop-varieties">
      <h4>Sorter</h4>
      <DashboardChart rows={crop.varieties} empty="Ingen skörd registrerad ännu" />
    </div>
  </article>;
}
