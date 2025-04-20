import React, { useState, useEffect } from "react";

interface Props {
  vare?: any;
  onClose: () => void;
  onSave: (vare: any) => void;
}

export default function ManuellKorrigeringModal({ vare, onClose, onSave }: Props) {
  const [varenummer, setVarenummer] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [antall, setAntall] = useState(1);
  const [pris, setPris] = useState(0);

  useEffect(() => {
    if (vare) {
      setVarenummer(vare.varenummer || vare.kode);
      setBeskrivelse(vare.beskrivelse);
      setAntall(vare.antall);
      setPris(vare.pris);
    }
  }, [vare]);

  const handleSubmit = () => {
    if (!beskrivelse || antall <= 0 || pris < 0) return;

    const tidspunkt = new Date().toISOString();
    const prisEksMva = pris;
    const totalEksMva = prisEksMva * antall;
    const totalInkMva = totalEksMva * 1.25;

    const nyVare = {
      kode: varenummer || Math.random().toString(36).substring(2, 9),
      varenummer,
      beskrivelse,
      antall,
      pris,
      prisEksMva,
      totalEksMva,
      totalInkMva,
      tidspunkt
    };

    onSave(nyVare);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="modal" style={{ backgroundColor: "white", padding: "2rem", borderRadius: "8px", maxWidth: "400px", width: "100%" }}>
        <h2>{vare ? "Rediger vare" : "Legg til vare manuelt"}</h2>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Varenummer:
          <input value={varenummer} onChange={(e) => setVarenummer(e.target.value)} style={{ width: "100%" }} />
        </label>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Beskrivelse: *
          <input value={beskrivelse} onChange={(e) => setBeskrivelse(e.target.value)} required style={{ width: "100%" }} />
        </label>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Antall: *
          <input type="number" value={antall} min={1} onChange={(e) => setAntall(Number(e.target.value))} style={{ width: "100%" }} />
        </label>
        <label style={{ display: "block", marginTop: "1rem" }}>
          Enhetspris eks. MVA: *
          <input type="number" value={pris} min={0} step={0.01} onChange={(e) => setPris(Number(e.target.value))} style={{ width: "100%" }} />
        </label>
        <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
          <button onClick={onClose}>Avbryt</button>
          <button onClick={handleSubmit} style={{ marginLeft: "1rem" }}>
            {vare ? "Lagre endringer" : "Legg til"}
          </button>
        </div>
      </div>
    </div>
  );
}
