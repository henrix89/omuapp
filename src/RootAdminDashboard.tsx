import React, { useEffect, useState } from "react";

interface Firma {
  _id: string;
  navn: string;
}

interface Bruker {
  firmaId: string;
  brukernavn: string;
  passord: string;
  rolle: string;
}

export default function RootAdminDashboard() {
  const [firmaer, setFirmaer] = useState<Firma[]>([]);
  const [brukere, setBrukere] = useState<Bruker[]>([]);
  const [melding, setMelding] = useState("");
  const [nyttFirma, setNyttFirma] = useState({ _id: "", navn: "" });
  const [nyBruker, setNyBruker] = useState<Bruker>({
    firmaId: "",
    brukernavn: "",
    passord: "",
    rolle: "bruker"
  });

  useEffect(() => {
    hentFirmaerOgBrukere();
  }, []);

  const hentFirmaerOgBrukere = async () => {
    const f = await fetch("/api/company").then(res => res.json());
    const b = await fetch("/api/user").then(res => res.json());
    setFirmaer(f);
    setBrukere(b);
  };

  const handleOpprettFirma = async () => {
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmaId: nyttFirma._id,
          navn: nyttFirma.navn
        })
      });

      if (res.ok) {
        setMelding("✅ Firma opprettet");
        setNyttFirma({ _id: "", navn: "" });
        hentFirmaerOgBrukere();
      } else {
        const err = await res.json();
        setMelding(`❌ Feil: ${err.message}`);
      }
    } catch (err) {
      setMelding("❌ Uventet feil ved oppretting av firma.");
    }
  };

  const handleOpprettBruker = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nyBruker)
      });

      if (res.ok) {
        setMelding("✅ Bruker opprettet");
        setNyBruker({ firmaId: "", brukernavn: "", passord: "", rolle: "bruker" });
        hentFirmaerOgBrukere();
      } else {
        const err = await res.json();
        setMelding(`❌ Feil: ${err.message}`);
      }
    } catch (err) {
      setMelding("❌ Uventet feil ved oppretting av bruker.");
    }
  };

  return (
    <div className="theme-card">
      <h2>🧾 Firma og brukere</h2>

      {firmaer.map((firma) => (
        <div key={firma._id} style={{ marginBottom: "1rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
          <h3>{firma.navn} ({firma._id})</h3>
          <ul>
            {brukere.filter(b => b.firmaId === firma._id).map((b, i) => (
              <li key={i}>👤 {b.brukernavn} – {b.rolle}</li>
            ))}
          </ul>
        </div>
      ))}

      <h3>➕ Opprett nytt firma</h3>
      <input
        placeholder="Firma-ID"
        value={nyttFirma._id}
        onChange={(e) => setNyttFirma({ ...nyttFirma, _id: e.target.value })}
      />
      <input
        placeholder="Firmanavn"
        value={nyttFirma.navn}
        onChange={(e) => setNyttFirma({ ...nyttFirma, navn: e.target.value })}
      />
      <button onClick={handleOpprettFirma}>Opprett firma</button>

      <h3>➕ Opprett bruker</h3>
      <select
        value={nyBruker.firmaId}
        onChange={(e) => setNyBruker({ ...nyBruker, firmaId: e.target.value })}
      >
        <option value="">Velg firma</option>
        {firmaer.map((f) => (
          <option key={f._id} value={f._id}>{f.navn}</option>
        ))}
      </select>
      <input
        placeholder="Brukernavn"
        value={nyBruker.brukernavn}
        onChange={(e) => setNyBruker({ ...nyBruker, brukernavn: e.target.value })}
      />
      <input
        placeholder="Passord"
        value={nyBruker.passord}
        onChange={(e) => setNyBruker({ ...nyBruker, passord: e.target.value })}
        type="password"
      />
      <select
        value={nyBruker.rolle}
        onChange={(e) => setNyBruker({ ...nyBruker, rolle: e.target.value })}
      >
        <option value="bruker">Bruker</option>
        <option value="localadmin">Lokal admin</option>
      </select>
      <button onClick={handleOpprettBruker}>Opprett bruker</button>

      {melding && <p style={{ color: melding.startsWith("✅") ? "green" : "red" }}>{melding}</p>}
    </div>
  );
}
