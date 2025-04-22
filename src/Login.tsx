import React, { useState } from "react";
import api from "./services/api";

interface Props {
  onLogin: (bruker: {
    brukernavn: string;
    rolle: string;
    firmaId: string;
  }) => void;
}

interface LoginResponse {
  firmaId: string;
  brukernavn: string;
  rolle: string;
}

export default function Login({ onLogin }: Props) {
  const [firmaId, setFirmaId] = useState("");
  const [brukernavn, setBrukernavn] = useState("");
  const [passord, setPassord] = useState("");
  const [feil, setFeil] = useState("");

  const handleLogin = async () => {
    setFeil("");

    if (!firmaId || !brukernavn || !passord) {
      setFeil("Vennligst fyll ut alle felt!");
      return;
    }

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        firmaId: firmaId.trim().toLowerCase(),
        brukernavn: brukernavn.trim(),
        passord
      });

      const data = response.data;
      onLogin({
        brukernavn: data.brukernavn,
        rolle: data.rolle,
        firmaId: data.firmaId
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Innlogging feilet. Prøv igjen.";
      setFeil(`❌ ${msg}`);
      console.error("Login-feil:", err);
    }
  };

  return (
    <div className="theme-card" style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h2>🔐 Logg inn</h2>
      <input
        placeholder="Firma-ID"
        value={firmaId}
        onChange={(e) => setFirmaId(e.target.value)}
      />
      <input
        placeholder="Brukernavn"
        value={brukernavn}
        onChange={(e) => setBrukernavn(e.target.value)}
      />
      <input
        type="password"
        placeholder="Passord"
        value={passord}
        onChange={(e) => setPassord(e.target.value)}
      />
      <button onClick={handleLogin}>Logg inn</button>
      {feil && <p style={{ color: "red", marginTop: "1rem" }}>{feil}</p>}
    </div>
  );
}
