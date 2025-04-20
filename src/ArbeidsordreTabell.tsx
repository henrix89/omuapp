import React from "react";

interface Props {
  firmaId: string;
  arbeidsordre: { ordreId: string; beskrivelse: string }[];
}

const ArbeidsordreTabell: React.FC<Props> = ({ firmaId, arbeidsordre }) => {
  const slettOrdre = async (ordreId: string) => {
    await fetch("/api/arbeidsordre", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmaId, ordreId }),
    });
    window.location.reload();
  };

  return (
    <table border={1} cellPadding={6} style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Ordre ID</th>
          <th>Beskrivelse</th>
          <th>Handling</th>
        </tr>
      </thead>
      <tbody>
        {arbeidsordre.map((a) => (
          <tr key={a.ordreId}>
            <td>{a.ordreId}</td>
            <td>{a.beskrivelse}</td>
            <td>
              <button onClick={() => slettOrdre(a.ordreId)}>🗑 Slett</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ArbeidsordreTabell;