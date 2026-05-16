"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

export default function UnsubscribePage() {
  const params = useParams();
  const id = params.id as string;

  const [message, setMessage] = useState("Désinscription en cours...");

  useEffect(() => {
    async function unsubscribe() {
      try {
        const response = await fetch(
          `${API_URL}/subscribers/${id}/unsubscribe`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (data.error) {
          setMessage("Abonnement introuvable ou déjà supprimé.");
          return;
        }

        setMessage("Vous êtes bien désinscrit des alertes MappingCrimeFrance.");
      } catch {
        setMessage("Erreur lors de la désinscription.");
      }
    }

    unsubscribe();
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