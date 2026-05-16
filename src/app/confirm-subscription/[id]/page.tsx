"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

export default function ConfirmSubscriptionPage() {
  const params = useParams();
  const id = params.id as string;

  const [message, setMessage] = useState("Confirmation en cours...");

  useEffect(() => {
    async function confirmSubscription() {
      try {
        const response = await fetch(`${API_URL}/subscribers/${id}/confirm`, {
          method: "PUT",
        });

        const data = await response.json();

        if (data.error) {
          setMessage("Abonnement introuvable ou déjà supprimé.");
          return;
        }

        setMessage("Votre inscription aux alertes MappingCrimeFrance est confirmée.");
      } catch {
        setMessage("Erreur lors de la confirmation.");
      }
    }

    confirmSubscription();
  }, [id]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-xl text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          MappingCrimeFrance
        </h1>

        <p className="text-lg">{message}</p>
      </div>
    </main>
  );
}