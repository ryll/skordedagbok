import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { getUser } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await getUser()) redirect("/admin");
  return <div style={{ maxWidth: 480, marginInline: "auto" }}><section className="hero"><p className="eyebrow">Administration</p><h1>Välkommen tillbaka</h1><p className="lead">Logga in för att lägga till och ändra skördar.</p></section><LoginForm /></div>;
}
