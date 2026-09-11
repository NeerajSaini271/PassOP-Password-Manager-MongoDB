import { useEffect, useState } from "react";
import {
  AUTH_CHANGE_EVENT,
  TOKEN_KEY,
  getToken,
  request,
  setToken,
} from "./api/client";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Manager from "./components/Manager";
import Navbar from "./components/Navbar";
function readTheme() {
  const saved = localStorage.getItem("nexlockr-theme");
  if (saved === "dark" || saved === "light") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export default function App() {
  const initialHash = location.hash;
  const [page, setPage] = useState(initialHash === "#vault" ? "vault" : "home");
  const [section, setSection] = useState(
    initialHash === "#security"
      ? "security"
      : initialHash === "#vault"
        ? "vault"
        : "home",
  );
  const [theme, setTheme] = useState(readTheme);
  const [signedIn, setSignedIn] = useState(Boolean(getToken()));
  const handleSignOut = async () => {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear the local session even when the remote session already expired.
    }
    setToken(null);
    setSignedIn(false);
  };
  const navigate = (next) => {
    setSection(next);
    if (next === "security") {
      history.pushState(null, "", "#security");
      setPage("home");
      requestAnimationFrame(() =>
        document
          .querySelector("#security")
          ?.scrollIntoView({ behavior: "smooth" }),
      );
      return;
    }
    location.hash = next === "vault" ? "vault" : "";
    setPage(next);
    scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const syncAuth = (event) => {
      if (event.type === "storage" && event.key !== TOKEN_KEY) return;
      setSignedIn(Boolean(getToken()));
    };
    addEventListener("storage", syncAuth);
    addEventListener(AUTH_CHANGE_EVENT, syncAuth);
    return () => {
      removeEventListener("storage", syncAuth);
      removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("nexlockr-theme", theme);
  }, [theme]);
  useEffect(() => {
    const sync = () => {
      const hash = location.hash;
      const next =
        hash === "#vault"
          ? "vault"
          : hash === "#security"
            ? "security"
            : "home";
      setSection(next);
      setPage(next === "vault" ? "vault" : "home");
      if (next === "security")
        requestAnimationFrame(() =>
          document.querySelector("#security")?.scrollIntoView(),
        );
    };
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, []);
  return (
    <div className="flex min-h-screen min-w-80 flex-col overflow-x-hidden bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-[#050816] dark:text-indigo-50">
      <Navbar
        page={section}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={() =>
          setTheme((current) => (current === "dark" ? "light" : "dark"))
        }
        signedIn={signedIn}
        onSignOut={handleSignOut}
      />
      <main className="flex-grow">
        {page === "home" ? (
          <Home onOpenVault={() => navigate("vault")} />
        ) : (
          <Manager
            key={signedIn ? "signed-in" : "signed-out"}
            onAuthChange={setSignedIn}
          />
        )}
      </main>
      {page === "home" && <Footer onNavigate={navigate} />}
    </div>
  );
}
