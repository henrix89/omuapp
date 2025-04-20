// BrukerTabell.tsx
import React from "react";

interface Props {
  firmaId: string;
  brukere: { brukernavn: string; rolle: string }[];
}

const BrukerTabell: React.FC<Props> = ({ firmaId, brukere }) => {
  const slettBruker = async (brukernavn: string) => {
    await fetch("/api/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmaId, brukernavn }),
    });
    window.location.reload();
  };

  return (
    <table border={1} cellPadding={6} style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Brukernavn</th>
          <th>Rolle</th>
          <th>Handling</th>
        </tr>
      </thead>
      <tbody>
        {brukere.map((b) => (
          <tr key={b.brukernavn}>
            <td>{b.brukernavn}</td>
            <td>{b.rolle}</td>
            <td>
              <button onClick={() => slettBruker(b.brukernavn)}>🗑 Slett</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BrukerTabell;
