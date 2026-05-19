"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ADMIN_TOKEN = "CrimeFranceSecureAdmin2026!";

type Subscriber = {
  id: number;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  status: string;
  created_at: string;
};

export default function SubscribersAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    loadSubscribers();
  }, []);

  async function loadSubscribers() {
    const response = await fetch(`${API_URL}/admin/subscribers`, {
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    const data = await response.json();
    setSubscribers(data);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">
        Abonnés aux alertes
      </h1>

      <div className="mb-4 text-gray-300">
        Total : {subscribers.length} inscrit(s)
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Adresse</th>
              <th className="p-3 text-left">Statut</th>
              <th className="p-3 text-left">Rayon</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-t border-gray-800">
                <td className="p-3">{sub.email}</td>
                <td className="p-3">{sub.address}</td>
                <td className="p-3">
                  <span
                    className={
                      sub.status === "confirmed"
                        ? "text-green-400 font-bold"
                        : "text-yellow-400 font-bold"
                    }
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="p-3">{sub.radius_km} km</td>
                <td className="p-3">
                  {new Date(sub.created_at).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}