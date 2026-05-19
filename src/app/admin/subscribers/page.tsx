"use client";

import { useEffect, useState } from "react";

const API_URL = "https://mappingcrimefrance.onrender.com";
const ADMIN_TOKEN = "CrimeFranceSecureAdmin2026!";

type Subscriber = {
  id: number;
  email: string;
  address: string;
  radius_km: number;
  status: string;
  created_at: string;
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  async function loadSubscribers() {
    const response = await fetch(`${API_URL}/admin/subscribers`, {
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    const data = await response.json();
    setSubscribers(data);
  }

  async function confirmSubscriber(id: number) {
    await fetch(`${API_URL}/admin/subscribers/${id}/confirm`, {
      method: "PUT",
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    loadSubscribers();
  }

  async function deleteSubscriber(id: number) {
    if (!confirm("Supprimer cet abonné ?")) return;

    await fetch(`${API_URL}/admin/subscribers/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    loadSubscribers();
  }

  useEffect(() => {
    loadSubscribers();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-bold mb-6">Abonnés aux alertes</h1>

      <p className="mb-6 text-xl">
        Total : {subscribers.length} inscrit(s)
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-800 rounded-xl overflow-hidden">
          <thead className="bg-blue-950">
            <tr>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Adresse</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-left p-4">Rayon</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {subscribers.map((subscriber) => (
              <tr
                key={subscriber.id}
                className="border-t border-gray-800"
              >
                <td className="p-4">{subscriber.email}</td>
                <td className="p-4">{subscriber.address}</td>

                <td className="p-4">
                  <span
                    className={
                      subscriber.status === "confirmed"
                        ? "text-green-400 font-bold"
                        : "text-yellow-400 font-bold"
                    }
                  >
                    {subscriber.status}
                  </span>
                </td>

                <td className="p-4">{subscriber.radius_km} km</td>

                <td className="p-4">
                  {new Date(subscriber.created_at).toLocaleString("fr-FR")}
                </td>

                <td className="p-4 flex gap-2">
                  {subscriber.status !== "confirmed" && (
                    <button
                      onClick={() => confirmSubscriber(subscriber.id)}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold"
                    >
                      Valider
                    </button>
                  )}

                  <button
                    onClick={() => deleteSubscriber(subscriber.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}