import CropGoalManager from "@/components/crop-goal-manager";
import { getCatalogs, getCropGoals } from "@/lib/data";
import { todayInStockholm } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function GoalsPage({ searchParams }: { searchParams: Search }) {
  const currentYear = Number(todayInStockholm().slice(0, 4));
  const requestedYear = Number((await searchParams).ar);
  const years = [currentYear, currentYear + 1];
  const year = years.includes(requestedYear) ? requestedYear : currentYear;
  const [{ crops }, goals] = await Promise.all([getCatalogs(), getCropGoals(year)]);

  return <>
    <section className="hero">
      <p className="eyebrow">Administration</p>
      <h1>Skördemål</h1>
      <p className="lead">Ange årets mål per gröda i kilogram. Lämna ett fält tomt för att ta bort målet.</p>
    </section>
    <form className="card year-picker" aria-label="Välj målår">
      <div className="field">
        <label htmlFor="ar">År</label>
        <select id="ar" name="ar" defaultValue={year}>
          {years.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      <button type="submit" className="secondary">Visa år</button>
    </form>
    <h2 className="section-title">Mål för {year}</h2>
    <CropGoalManager key={year} crops={crops} goals={goals} year={year} />
  </>;
}
