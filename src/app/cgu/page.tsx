import documents from "../../lib/legal";
export default function LegalPage() {
  return <main className="min-h-screen bg-[#0d1624] text-slate-100 px-5 py-10"><article className="max-w-3xl mx-auto space-y-7">
    <a className="text-blue-300 underline" href="/">Retour à la carte</a>
    <h1 className="text-3xl font-bold">Conditions d’utilisation</h1>
    <p className="text-sm text-slate-400">Version {documents.version} · 25 octobre 2026</p>

    {documents.terms.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold mb-2">{title}</h2><p className="text-slate-300 leading-relaxed whitespace-pre-line">{body}</p></section>)}
    <section><h2 className="text-xl font-semibold mb-2">Références utiles</h2><ul className="space-y-2">{documents.references.map(([label, url]) => <li key={url}><a className="underline text-blue-300" href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>)}</ul></section>
    <p><a className="text-blue-300 underline" href="/cgu">Conditions d’utilisation</a> · <a className="text-blue-300 underline" href="/confidentialite">Données personnelles</a> · <a className="text-blue-300 underline" href={`mailto:${documents.email}`}>Contacter {documents.operator}</a></p>
  </article></main>;
}
