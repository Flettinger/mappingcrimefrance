import documents from "../../lib/legal";
export default function LegalPage() {
  return <main className="min-h-screen bg-[#0d1624] text-slate-100 px-5 py-10"><article className="max-w-3xl mx-auto space-y-7">
    <a className="text-blue-300 underline" href="/">Retour à la carte</a>
    <h1 className="text-3xl font-bold">Données personnelles</h1>
    <p className="text-sm text-slate-400">Version {documents.version} · 25 octobre 2026</p>
    <p className="rounded-lg border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-100">Version de travail : les informations juridiques et les modalités de conservation doivent être finalisées avant l’ouverture publique des dépôts.</p>
    {documents.privacy.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold mb-2">{title}</h2><p className="text-slate-300 leading-relaxed whitespace-pre-line">{body}</p></section>)}
    <p><a className="text-blue-300 underline" href="/cgu">Conditions d’utilisation</a> · <a className="text-blue-300 underline" href="/confidentialite">Données personnelles</a> · <a className="text-blue-300 underline" href={`mailto:${documents.email}`}>Contacter {documents.operator}</a></p>
  </article></main>;
}
