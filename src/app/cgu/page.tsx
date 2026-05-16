export default function CGUPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto bg-gray-950 border border-gray-800 rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-red-500 mb-6">
          Conditions Générales d’Utilisation
        </h1>

        <p className="text-gray-300 mb-8">
          Dernière mise à jour : 2026
        </p>

        <Section title="1. Objet du site">
          MappingCrimeFrance permet aux utilisateurs de signaler des incidents
          observés sur le territoire français à titre informatif et citoyen.
          Les signalements publiés ne constituent pas des constats officiels des
          autorités publiques.
        </Section>

        <Section title="2. Site non officiel">
          MappingCrimeFrance n’est pas un service officiel de police, de
          gendarmerie, de justice ou de secours. En cas d’urgence, l’utilisateur
          doit contacter immédiatement les services compétents : 17, 112 ou 18.
        </Section>

        <Section title="3. Responsabilité de l’utilisateur">
          En soumettant un signalement, l’utilisateur certifie être de bonne foi
          et fournir des informations exactes à sa connaissance. Il s’engage à ne
          pas publier de contenu mensonger, diffamatoire, injurieux, trompeur ou
          malveillant.
        </Section>

        <Section title="4. Interdictions">
          Il est strictement interdit de publier une fausse déclaration, une
          dénonciation mensongère, une accusation nominative, une donnée
          personnelle concernant un tiers, une plaque d’immatriculation
          identifiable, une image permettant d’identifier une personne, ou tout
          contenu contraire à la loi.
        </Section>

        <Section title="5. Responsabilité civile et pénale">
          L’utilisateur demeure seul responsable civilement et pénalement des
          informations, textes, images, vidéos ou documents qu’il transmet sur le
          site. Toute déclaration abusive, mensongère ou diffamatoire pourra
          entraîner la suppression du contenu, le blocage de l’utilisateur et, le
          cas échéant, la transmission des éléments techniques aux autorités
          compétentes sur réquisition légale.
        </Section>

        <Section title="6. Modération">
          Tous les signalements sont soumis à validation préalable avant
          publication. MappingCrimeFrance se réserve le droit de refuser,
          modifier, masquer ou supprimer tout signalement sans préavis,
          notamment en cas de doute sur sa véracité ou sa conformité.
        </Section>

        <Section title="7. Données personnelles">
          Les données collectées sont utilisées uniquement pour le fonctionnement
          du service, la modération, la sécurité du site et l’envoi éventuel
          d’alertes. Les adresses email ne sont pas affichées publiquement.
        </Section>

        <Section title="8. Alertes email">
          L’utilisateur peut demander à recevoir des alertes dans une zone
          géographique définie. Il peut se désinscrire à tout moment via le lien
          prévu dans les emails d’alerte.
        </Section>

        <Section title="9. Suppression d’un contenu">
          MappingCrimeFrance peut supprimer tout contenu litigieux à première
          demande ou en cas de suspicion d’illégalité, d’abus, de diffamation ou
          d’atteinte aux droits d’un tiers.
        </Section>

        <Section title="10. Acceptation des conditions">
          En utilisant le site et en soumettant un signalement, l’utilisateur
          reconnaît avoir lu, compris et accepté les présentes Conditions
          Générales d’Utilisation.
        </Section>

        <div className="mt-10 border-t border-gray-800 pt-6">
          <a
            href="/"
            className="inline-block bg-red-600 hover:bg-red-700 px-5 py-3 rounded-lg font-bold"
          >
            Retour à la carte
          </a>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-gray-300 leading-relaxed">{children}</p>
    </section>
  );
}