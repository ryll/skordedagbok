import Link from "next/link";
export default function AdminPage() {
  return <><section className="hero"><p className="eyebrow">Administration</p><h1>Vad vill du göra?</h1></section><div className="grid stats"><Link className="card stat" href="/admin/skordar/ny"><span>Registrera</span><strong>Ny skörd</strong><small>Lägg till dagens skörd</small></Link><Link className="card stat" href="/skordar"><span>Hantera</span><strong>Skördar</strong><small>Visa, ändra eller radera</small></Link><Link className="card stat" href="/admin/katalog"><span>Hantera</span><strong>Katalog</strong><small>Grödor, sorter och platser</small></Link></div></>;
}
