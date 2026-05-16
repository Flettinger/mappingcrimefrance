"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function login() {
   if (username === "flettinger" && password === "CrimeMapAdmin2026!") {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      alert("Identifiants incorrects");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl w-[400px] border border-gray-700">
        <h1 className="text-3xl font-bold text-red-500 mb-6 text-center">
          Connexion Admin
        </h1>

        <input
          type="text"
          placeholder="Identifiant"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-black border border-gray-700 mb-6"
        />

        <button
          onClick={login}
          className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-lg font-semibold"
        >
          Se connecter
        </button>
      </div>
    </main>
  );
}