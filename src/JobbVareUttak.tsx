// Full JobbVareUttak.tsx – med MongoDB-integrasjon og full funksjonalitet
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCallback, useEffect, useRef, useState } from "react";
import logo from "./assets/logo.png";
import varedataJson from "./data/varedata.json";
import JobblisteModal from "./JobblisteModal";
import ManuellKorrigeringModal from "./ManuellKorrigeringModal";

// Legg til utvidelse for lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

const MVA_SATS = 1.25;

interface Vare {
  varenummer: string;
  beskrivelse: string;
  pris: number;
  strekkode?: string;
}

interface VareMedAntall extends Vare {
  kode: string;
  antall: number;
  tidspunkt: string;
  prisEksMva: number;
  totalEksMva: number;
  totalInkMva: number;
}

type Handlekurv = Record<string, VareMedAntall[]>;

export default function JobbVareUttak({ verkstedId }: { verkstedId: string }) {
  const [jobbId, setJobbId] = useState("");
  const [handlekurv, setHandlekurv] = useState<Handlekurv>({});
  const [varedata, setVaredata] = useState<Record<string, Vare>>({});
  const [visJobbModal, setVisJobbModal] = useState(false);
  const [visManuellModal, setVisManuellModal] = useState(false);
  const [redigeringsVare, setRedigeringsVare] = useState<VareMedAntall | null>(null);
  const [popup, setPopup] = useState("");
  const [skannetVare, setSkannetVare] = useState("");
  const [scanning, setScanning] = useState(false);

  const varer = jobbId && handlekurv[jobbId] ? handlekurv[jobbId] : [];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedRef = useRef<string>("");

  useEffect(() => {
    if (Array.isArray(varedataJson)) {
      const record: Record<string, Vare> = {};
      (varedataJson as any[]).forEach((item) => {
        const key = item.strekkode && item.strekkode !== "0"
          ? item.strekkode.toString().trim()
          : item.varenummer.toString().trim();
        record[key.toLowerCase()] = {
          varenummer: item.varenummer.toString().trim(),
          beskrivelse: item.beskrivelse,
          pris: item.pris,
          strekkode: item.strekkode ? item.strekkode.toString().trim() : undefined,
        };
      });
      setVaredata(record);
    }
  }, []);

  useEffect(() => () => stopScanning(), []);

  const startScanning = async () => {
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      codeReader.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
        if (result) {
          const kode = result.getText().trim();
          if (kode && kode !== lastScannedRef.current) {
            lastScannedRef.current = kode;
            leggTilVare(kode);
            lastScannedRef.current = "";
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          console.warn("Skanningsfeil:", err);
        }
      });
    } catch (err) {
      console.error("Klarte ikke starte kameraet:", err);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    codeReaderRef.current?.reset();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleSelectJob = async (selectedJobId: string) => {
    setJobbId(selectedJobId);
    try {
      const res = await fetch(`/api/arbeidsordre/ordre/${selectedJobId}`);
      if (res.ok) {
        const data = await res.json();
        setHandlekurv((prev) => ({ ...prev, [selectedJobId]: data.varer }));
      } else {
        await fetch("/api/arbeidsordre", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firmaId: verkstedId, ordreId: selectedJobId, beskrivelse: "Opprettet fra UI" }),
        });
        setHandlekurv((prev) => ({ ...prev, [selectedJobId]: [] }));
      }
    } catch (err) {
      console.error("Feil ved valg av ordre:", err);
    }
  };

  const lagreTilDatabase = async (varer: VareMedAntall[]) => {
    try {
      await fetch(`/api/arbeidsordre/${jobbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmaId: verkstedId, varer }),
      });
    } catch (err) {
      console.error("Feil ved lagring:", err);
    }
  };

  const oppdaterHandlekurv = async (nyListe: VareMedAntall[]) => {
    setHandlekurv((prev) => ({ ...prev, [jobbId]: nyListe }));
    await lagreTilDatabase(nyListe);
  };

  const leggTilVare = (inputKode: string) => {
    const kodeInput = inputKode.trim().toLowerCase();
    const info = varedata[kodeInput];
    if (!info) {
      setPopup("❌ Ukjent vare");
      return;
    }
    const eksisterende = varer.find((v) => v.kode === kodeInput);
    const nå = new Date().toISOString();
    const antall = eksisterende ? eksisterende.antall + 1 : 1;
    const nyVare: VareMedAntall = {
      kode: kodeInput,
      antall,
      tidspunkt: nå,
      varenummer: info.varenummer,
      beskrivelse: info.beskrivelse,
      pris: info.pris,
      prisEksMva: info.pris,
      totalEksMva: info.pris * antall,
      totalInkMva: info.pris * antall * MVA_SATS,
    };
    const nyListe = eksisterende
      ? varer.map((v) => (v.kode === kodeInput ? nyVare : v))
      : [...varer, nyVare];
    oppdaterHandlekurv(nyListe);
    setPopup(`✔️ Lagt til ${kodeInput}`);
    setTimeout(() => setPopup(""), 2000);
  };

  const fjernVare = (kode: string) => {
    const nyListe = varer.filter((v) => v.kode !== kode);
    oppdaterHandlekurv(nyListe);
    setPopup(`🗑️ Fjernet ${kode}`);
    setTimeout(() => setPopup(""), 2000);
  };

  const lastNedPDF = () => {
    const doc = new jsPDF();
    doc.addImage(logo, "PNG", 14, 10, 50, 15);
    doc.setFontSize(16);
    doc.text(`Ordre: ${jobbId}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Varenummer", "Beskrivelse", "Antall", "Tidspunkt", "Enhetspris", "Eks. MVA", "Ink. MVA"]],
      body: varer.map((v) => [
        v.varenummer,
        v.beskrivelse,
        v.antall,
        new Date(v.tidspunkt).toLocaleString("no-NO", { dateStyle: "short", timeStyle: "short" }),
        `${(v.pris).toFixed(2)} kr`,
        `${v.totalEksMva.toFixed(2)} kr`,
        `${v.totalInkMva.toFixed(2)} kr`,
      ]),
    });

    const totalEks = varer.reduce((sum, v) => sum + v.totalEksMva, 0).toFixed(2);
    const totalInk = varer.reduce((sum, v) => sum + v.totalInkMva, 0).toFixed(2);
    doc.text(`Totalt eks. MVA: ${totalEks} kr`, 14, (doc as any).lastAutoTable.finalY + 10);
    doc.text(`Totalt ink. MVA: ${totalInk} kr`, 14, (doc as any).lastAutoTable.finalY + 20);
    doc.save(`Arbeidsordre_${jobbId}.pdf`);
  
  };

  return (
    <div className="theme-card">
      <button onClick={() => setVisJobbModal(true)}>Velg/legg til arbeidsordre</button>
      {visJobbModal && (
        <JobblisteModal
          onSelectJob={handleSelectJob}
          onClose={() => setVisJobbModal(false)}
        />
      )}

      {visManuellModal && (
        <ManuellKorrigeringModal
          vare={redigeringsVare || undefined}
          onClose={() => {
            setVisManuellModal(false);
            setRedigeringsVare(null);
          }}
          onSave={async (v) => {
            const eksisterende = varer.find((x) => x.kode === v.kode);
            const nyListe = eksisterende
              ? varer.map((x) => (x.kode === v.kode ? v : x))
              : [...varer, v];
            await oppdaterHandlekurv(nyListe);
          }}
        />
      )}

      <h1>Arbeidsordre {jobbId || "(ingen valgt)"}</h1>

      {jobbId ? (
        <>
          <input
            placeholder="Skriv inn varenummer"
            value={skannetVare}
            onChange={(e) => setSkannetVare(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                leggTilVare(skannetVare);
                setSkannetVare("");
              }
            }}
          />

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
            <button onClick={startScanning}>📷 Start skanning</button>
            <button onClick={stopScanning}>❌ Stopp skanning</button>
            <button onClick={lastNedPDF}>📄 Last ned PDF</button>
            <button onClick={() => {
              setRedigeringsVare(null);
              setVisManuellModal(true);
            }}>🛠️ Manuell korrigering</button>
          </div>

          {popup && <p>{popup}</p>}

          {scanning && (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%" }} />
          )}

          {varer.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Varenummer</th>
                    <th>Beskrivelse</th>
                    <th>Antall</th>
                    <th>Tidspunkt</th>
                    <th>Eks. MVA</th>
                    <th>Ink. MVA</th>
                    <th>Handling</th>
                  </tr>
                </thead>
                <tbody>
                  {varer.map((v) => (
                    <tr key={v.kode}>
                      <td>{v.varenummer}</td>
                      <td>{v.beskrivelse}</td>
                      <td>{v.antall}</td>
                      <td>{new Date(v.tidspunkt).toLocaleString("no-NO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}</td>
                      <td>{v.totalEksMva.toFixed(2)} kr</td>
                      <td>{v.totalInkMva.toFixed(2)} kr</td>
                      <td>
                        <button onClick={() => fjernVare(v.kode)}>🗑️</button>
                        <button onClick={() => {
                          setRedigeringsVare(v);
                          setVisManuellModal(true);
                        }}>✏️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}><strong>Totalt</strong></td>
                    <td>{varer.reduce((sum, v) => sum + v.totalEksMva, 0).toFixed(2)} kr</td>
                    <td>{varer.reduce((sum, v) => sum + v.totalInkMva, 0).toFixed(2)} kr</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      ) : (
        <p>Velg eller opprett en arbeidsordre for å starte.</p>
      )}
    </div>
  );
}
