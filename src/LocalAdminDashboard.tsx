import React, { useEffect, useState } from "react";

interface Bruker {
  _id?: string;
  firmaId: string;
  brukernavn: string;
  passord: string;
  rolle: string;
}

export default function LocalAdminDashboard({ firmaId }: { firmaId: string }) {
  const [brukere, setBrukere] = useState<Bruker[]>([]);
  const [nyBruker, setNyBruker] = useState<Bruker>({
    firmaId,
    brukernavn: "",
    passord: "",
    rolle: "bruker",
  });

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((alle) => {
        const filtrert = alle.filter((b: Bruker) => b.firmaId === firmaId);
        setBrukere(filtrert);
      });
  }, [firmaId]);

  const handleOpprettBruker = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nyBruker),
      });
      if (res.ok) {
        const bruker = await res.json();
        setBrukere((prev) => [...prev, bruker]);
        setNyBruker({ firmaId, brukernavn: "", passord: "", rolle: "bruker" });
      } else {
        console.error("Kunne ikke opprette bruker");
      }
    } catch (err) {
      console.error("Feil:", err);
    }
  };

  return (
    <div className="theme-card">
      <h2>Brukere i firma: {firmaId}</h2>
      <ul>
        {brukere.map((b, i) => (
          <li key={i}>
            {b.brukernavn} – <strong>{b.rolle}</strong>
          </li>
        ))}
      </ul>

      <h3>Opprett ny bruker</h3>
      <input
        placeholder="Brukernavn"
        value={nyBruker.brukernavn}
        onChange={(e) => setNyBruker({ ...nyBruker, brukernavn: e.target.value })}
      />
      <input
        type="password"
        placeholder="Passord"
        value={nyBruker.passord}
        onChange={(e) => setNyBruker({ ...nyBruker, passord: e.target.value })}
      />
      <select
        value={nyBruker.rolle}
        onChange={(e) => setNyBruker({ ...nyBruker, rolle: e.target.value })}
      >
        <option value="bruker">Vanlig bruker</option>
        <option value="localadmin">Local Admin</option>
      </select>
      <button onClick={handleOpprettBruker}>➕ Opprett bruker</button>
    </div>
  );
}
