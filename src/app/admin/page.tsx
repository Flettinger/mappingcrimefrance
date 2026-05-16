"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Incident = {
  id: number;
  type: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  media_url?: string | null;
  media_type?: string | null;
};

const API_URL = "http://127.0.0.1:8000";
const ADMIN_TOKEN = "CrimeFranceSecureAdmin2026!";

export default function AdminPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);

  function logout() {
    localStorage.removeItem("admin_auth");
    router.push("/admin/login");
  }

  async function loadIncidents() {
    const response = await fetch(`${API_URL}/admin/incidents/all`, {
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    const data = await response.json();
    setIncidents(data);
  }

  async function approveIncident(id: number) {
    await fetch(`${API_URL}/admin/incidents/${id}/approve`, {
      method: "PUT",
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    loadIncidents();
  }

  async function rejectIncident(id: number) {
    await fetch(`${API_URL}/admin/incidents/${id}/reject`, {
      method: "PUT",
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    loadIncidents();
  }

  async function deleteIncident(id: number) {
    if (!confirm("Voulez-vous vraiment supprimer cet incident ?")) return;

    await fetch(`${API_URL}/admin/incidents/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-token": ADMIN_TOKEN,
      },
    });

    loadIncidents();
  }

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_auth");

    if (isAuth !== "true") {
      router.push("/admin/login");
      return;
    }

    loadIncidents();
  }, []);

  const pendingIncidents = incidents.filter(
    (incident) => incident.status === "pending"
  );

  const approvedIncidents = incidents.filter(
    (incident) => incident.status === "approved"
  );

  const rejectedIncidents = incidents.filter(
    (incident) => incident.status === "rejected"
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-red-500">
          Administration - Modération
        </h1>

        <button
          onClick={logout}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
        >
          Déconnexion
        </button>
      </div>

      <AdminSection
        title={`Incidents en attente (${pendingIncidents.length})`}
        color="text-orange-400"
        incidents={pendingIncidents}
        onApprove={approveIncident}
        onReject={rejectIncident}
        onDelete={deleteIncident}
        showModerationButtons={true}
      />

      <AdminSection
        title={`Incidents publiés (${approvedIncidents.length})`}
        color="text-green-400"
        incidents={approvedIncidents}
        onApprove={approveIncident}
        onReject={rejectIncident}
        onDelete={deleteIncident}
        showModerationButtons={false}
      />

      <AdminSection
        title={`Incidents rejetés (${rejectedIncidents.length})`}
        color="text-gray-400"
        incidents={rejectedIncidents}
        onApprove={approveIncident}
        onReject={rejectIncident}
        onDelete={deleteIncident}
        showModerationButtons={false}
      />
    </main>
  );
}

function AdminSection({
  title,
  color,
  incidents,
  onApprove,
  onReject,
  onDelete,
  showModerationButtons,
}: {
  title: string;
  color: string;
  incidents: Incident[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDelete: (id: number) => void;
  showModerationButtons: boolean;
}) {
  return (
    <section className="mb-10">
      <h2 className={`text-2xl font-bold mb-4 ${color}`}>{title}</h2>

      <div className="space-y-4">
        {incidents.length === 0 && (
          <div className="bg-gray-900 p-5 rounded-lg">
            Aucun incident dans cette catégorie.
          </div>
        )}

        {incidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onApprove={onApprove}
            onReject={onReject}
            onDelete={onDelete}
            showModerationButtons={showModerationButtons}
          />
        ))}
      </div>
    </section>
  );
}

function IncidentCard({
  incident,
  onApprove,
  onReject,
  onDelete,
  showModerationButtons,
}: {
  incident: Incident;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDelete: (id: number) => void;
  showModerationButtons: boolean;
}) {
  return (
    <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
      <div className="text-red-400 font-bold text-xl mb-2">
        {incident.type}
      </div>

      <div className="text-sm text-gray-300 mb-2">{incident.address}</div>

      <div className="mb-3">{incident.description}</div>

      {incident.media_url && (
        <div className="mb-4">
          {incident.media_type === "video" ? (
            <video
              controls
              className="max-w-[420px] max-h-[300px] rounded border border-gray-700"
            >
              <source src={`${API_URL}${incident.media_url}`} />
            </video>
          ) : (
            <img
              src={`${API_URL}${incident.media_url}`}
              alt="Média incident"
              className="max-w-[420px] max-h-[300px] object-cover rounded border border-gray-700"
            />
          )}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        {showModerationButtons && (
          <>
            <button
              onClick={() => onApprove(incident.id)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Valider
            </button>

            <button
              onClick={() => onReject(incident.id)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Rejeter
            </button>
          </>
        )}

        <button
          onClick={() => onDelete(incident.id)}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}