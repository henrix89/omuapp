import React, { useEffect, useState } from "react";
import { db }               from "./firebaseConfig";
import { doc, getDoc }      from "firebase/firestore";

import AppHeader             from "./AppHeader";
import CompanyDashboard      from "./CompanyDashboard";
import LocalAdminDashboard   from "./LocalAdminDashboard";
import RootAdminDashboard    from "./RootAdminDashboard";

interface User {
  firmaId:  string;
  brukernavn: string;
  passord:   string;
  rolle:     string;
}

const App: React.FC = () => {
  const [user, setUser]           = useState<User>({ firmaId: "", brukernavn: "", passord: "", rolle: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError]         = useState("");

  // Sjekk om bruker ligger i localStorage ved mount
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed: User = JSON.parse(stored);
      if (parsed.firmaId && parsed.brukernavn) {
        setUser(parsed);
        setIsLoggedIn(true);
      }
    }
  }, []);

  // Ny, asynkron innloggings‑funksjon mot Firestore
  const handleLogin = async (data: { firmaId: string; brukernavn: string; passord: string }) => {
    // Spesial‑case for rootadmin
    if (data.firmaId.toLowerCase() === "rootadmin") {
      if (data.brukernavn === "rootadmin" && data.passord === "Passord1234") {
        const rootUser = { ...data, rolle: "rootadmin" };
        setUser(rootUser);
        localStorage.setItem("user", JSON.stringify(rootUser));
        setIsLoggedIn(true);
        setError("");
      } else {
        setError("Ugyldig rootadmin-legitimasjon.");
        setIsLoggedIn(false);
      }
      return;
    }

    try {
      // 1) Hent firma‑dokument
      const firmaRef  = doc(db, "firmaer", data.firmaId);
      const firmaSnap = await getDoc(firmaRef);
      if (!firmaSnap.exists()) {
        setError("Firmaet finnes ikke.");
        setIsLoggedIn(false);
        return;
      }

      // 2) Hent bruker‑dokument i subcollection
      const userRef  = doc(db, "firmaer", data.firmaId, "brukere", data.brukernavn);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setError("Ugyldig firma eller brukernavn.");
        setIsLoggedIn(false);
        return;
      }

      const udata = userSnap.data() as { passord: string; rolle: string };
      if (udata.passord !== data.passord) {
        setError("Feil passord.");
        setIsLoggedIn(false);
        return;
      }

      // 3) Velg rolle og lagre
      const loggedInUser: User = { ...data, rolle: udata.rolle };
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setIsLoggedIn(true);
      setError("");
    } catch (e) {
      console.error(e);
      setError("En feil oppstod ved tilkobling til databasen.");
      setIsLoggedIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser({ firmaId: "", brukernavn: "", passord: "", rolle: "" });
    setIsLoggedIn(false);
  };

  const handleToggleDarkMode = () => {
    // … etter behov …
  };

  return (
    <div className="app-container">
      <AppHeader
        brukernavn={isLoggedIn ? user.brukernavn : ""}
        onLoggUt={handleLogout}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {!isLoggedIn ? (
        <div>
          <h2>Logg inn</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleLogin({ firmaId: user.firmaId, brukernavn: user.brukernavn, passord: user.passord });
            }}
          >
            <input
              type="text"
              placeholder="Firma ID"
              value={user.firmaId}
              onChange={(e) => setUser({ ...user, firmaId: e.target.value })}
            />
            <input
              type="text"
              placeholder="Brukernavn"
              value={user.brukernavn}
              onChange={(e) => setUser({ ...user, brukernavn: e.target.value })}
            />
            <input
              type="password"
              placeholder="Passord"
              value={user.passord}
              onChange={(e) => setUser({ ...user, passord: e.target.value })}
            />
            <button type="submit">Logg inn</button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <>
          {user.rolle === "rootadmin" ? (
            <RootAdminDashboard />
          ) : user.rolle === "localadmin" ? (
            <LocalAdminDashboard firmaId={user.firmaId} />
          ) : (
            <CompanyDashboard firmaId={user.firmaId} />
          )}
        </>
      )}
    </div>
  );
};

export default App;