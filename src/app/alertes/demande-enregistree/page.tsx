import Link from "next/link";

export default function SubscriptionRequestPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-xl border border-gray-700 bg-gray-950 p-6 md:p-8">
        <p className="text-blue-400 font-bold mb-4">Mapping Crime France · Alertes incidents</p>
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Votre demande a bien été prise en compte</h1>
        <p className="text-base text-gray-200 mb-4">
          Votre inscription aux alertes est en attente de validation par un administrateur.
        </p>
        <p className="text-base text-gray-200 mb-6">
          Dès que votre inscription sera validée, vous recevrez un email de confirmation.
          Vos alertes seront alors activées.
        </p>
        <p className="text-sm text-gray-400 mb-8">Pensez à consulter vos courriers indésirables.</p>
        <Link href="/" className="inline-block rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-3 font-bold">Retour à la carte</Link>
      </section>
    </main>
  );
}
