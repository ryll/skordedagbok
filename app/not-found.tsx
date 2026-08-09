import Link from "next/link";
export default function NotFound() { return <section className="hero"><p className="eyebrow">404</p><h1>Här fanns ingen skörd.</h1><Link className="button" href="/skordar">Till skördehistoriken</Link></section>; }
