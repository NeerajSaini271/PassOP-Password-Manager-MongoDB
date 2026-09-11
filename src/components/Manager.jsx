import { useCallback, useEffect, useState } from "react";
import { Bounce, ToastContainer, toast } from "react-toastify";
import {
  AUTH_CHANGE_EVENT,
  TOKEN_KEY,
  getToken,
  request,
  setToken,
} from "../api/client";
import viewIcon from "../assets/view.png";
import hideIcon from "../assets/hide.png";
import GlowButton from "./GlowButton";

const emptyCredential = { site: "", username: "", password: "" };

export default function Manager({ onAuthChange }) {
  const [session, setSession] = useState(Boolean(getToken()));
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ email: "", password: "" });
  const [form, setForm] = useState(emptyCredential);
  const [credentials, setCredentials] = useState([]);
  const [visible, setVisible] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const filteredCredentials = credentials.filter((item) =>
    `${item.site} ${item.username}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCredentials(await request("/api/credentials"));
    } catch (err) {
      setError(err.message);
      if (/session|authentication/i.test(err.message)) {
        setToken(null);
        setSession(false);
        onAuthChange(false);
      }
    } finally {
      setLoading(false);
    }
  }, [onAuthChange]);

  useEffect(() => {
    if (session) loadCredentials();
  }, [session, loadCredentials]);
  useEffect(() => {
    const syncSession = (event) => {
      if (event.type === "storage" && event.key !== TOKEN_KEY) return;
      const nextSession = Boolean(getToken());
      setSession(nextSession);
      onAuthChange(nextSession);
      if (!nextSession) {
        setCredentials([]);
        setVisible({});
        setEditingId(null);
        setForm(emptyCredential);
        setSearch("");
        setError("");
        setLoading(false);
      }
    };
    addEventListener("storage", syncSession);
    addEventListener(AUTH_CHANGE_EVENT, syncSession);
    return () => {
      removeEventListener("storage", syncSession);
      removeEventListener(AUTH_CHANGE_EVENT, syncSession);
    };
  }, [onAuthChange]);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request(`/api/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify(auth),
      });
      setToken(data.token);
      setSession(true);
      onAuthChange(true);
      setAuth({ email: "", password: "" });
      toast.success(authMode === "login" ? "Signed in" : "Account created");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCredential(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const method = editingId ? "PUT" : "POST";
      const path = editingId
        ? `/api/credentials/${editingId}`
        : "/api/credentials";
      const saved = await request(path, { method, body: JSON.stringify(form) });
      setCredentials((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? saved : item))
          : [saved, ...current],
      );
      toast.success(editingId ? "Credential updated" : "Credential saved");
      setForm(emptyCredential);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeCredential(id) {
    if (
      !window.confirm(
        "Delete this saved credential? This action cannot be undone.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await request(`/api/credentials/${id}`, { method: "DELETE" });
      setCredentials((current) => current.filter((item) => item.id !== id));
      toast.success("Credential deleted");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard access was denied");
    }
  }

  function beginEdit(item) {
    setEditingId(item.id);
    setForm({
      site: item.site,
      username: item.username,
      password: item.password,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyCredential);
  }
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        theme="dark"
        transition={Bounce}
      />
      <section className="relative mx-auto min-h-0 w-[min(1100px,calc(100%-2rem))] overflow-x-clip py-4 pb-6 sm:py-6 sm:pb-8 md:py-8 md:pb-10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-[650px] before:bg-[radial-gradient(circle_at_50%_10%,rgba(99,102,241,0.10),transparent_58%)] dark:before:bg-[radial-gradient(circle_at_50%_10%,rgba(99,102,241,0.12),transparent_58%)]">
        {!session ? (
          <form
            className="mx-auto grid w-full max-w-[520px] gap-[18px] rounded-3xl border border-indigo-200/80 bg-white/92 p-5 sm:p-[clamp(1.5rem,5vw,2.625rem)] shadow-[0_24px_70px_rgba(79,70,229,0.14)] backdrop-blur-2xl dark:border-[#29314c] dark:bg-[rgba(10,15,35,0.88)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
            onSubmit={submitAuth}
          >
            <h2 className="m-0 text-2xl font-bold">
              {authMode === "login"
                ? "Sign in to your vault"
                : "Create your vault"}
            </h2>
            <p className="m-0 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 leading-relaxed text-amber-900 dark:border-[#6b4d18] dark:bg-[rgba(120,53,15,0.24)] dark:text-amber-200">
              For personal testing only. Avoid storing critical real-world
              credentials.
            </p>
            <label className="grid gap-2 font-bold text-slate-700 dark:text-indigo-200">
              Email
              <input
                className="min-h-12 w-full rounded-xl border border-[#303958] bg-white px-3.5 text-slate-900 shadow-sm dark:bg-[#070b1b] dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                type="email"
                autoComplete="email"
                value={auth.email}
                onChange={(e) => setAuth({ ...auth, email: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-2 font-bold text-slate-700 dark:text-indigo-200">
              Account password
              <input
                className="min-h-12 w-full rounded-xl border border-[#303958] bg-white px-3.5 text-slate-900 shadow-sm dark:bg-[#070b1b] dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                type="password"
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
                minLength="12"
                maxLength="128"
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                required
              />
            </label>
            {error && (
              <p className="m-0 text-red-300" role="alert">
                {error}
              </p>
            )}
            <GlowButton disabled={busy}>
              {busy
                ? "Please wait..."
                : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
            </GlowButton>
            <button
              className="min-h-10.5 rounded-xl border-0 bg-transparent px-[15px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 disabled:cursor-wait disabled:opacity-65"
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {authMode === "login"
                ? "Create an account"
                : "Already have an account? Sign in"}
            </button>
          </form>
        ) : (
          <>
            <form
              className="grid grid-cols-1 gap-[18px] rounded-3xl border border-slate-200 bg-white/95 dark:border-[#29314c] dark:bg-[rgba(10,15,35,0.88)] p-5 sm:p-[clamp(1.5rem,5vw,2.625rem)] shadow-[0_14px_36px_rgba(79,70,229,0.10)] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:grid-cols-2"
              onSubmit={saveCredential}
            >
              <div className="md:col-span-2">
                <h2 className="m-0 text-2xl font-bold">
                  {editingId ? "Update credential" : "Add credential"}
                </h2>
                <p className="mt-2 text-[#a8b0c7]">
                  Values are encrypted by the API before MongoDB storage.
                </p>
              </div>
              <label className="grid gap-2 font-bold text-slate-700 dark:text-indigo-200">
                Website URL
                <input
                  className="min-h-12 w-full rounded-xl border border-[#303958] bg-white px-3.5 text-slate-900 shadow-sm dark:bg-[#070b1b] dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  type="text"
                  name="site"
                  placeholder="https://example.com"
                  value={form.site}
                  onChange={(e) => setForm({ ...form, site: e.target.value })}
                  required
                />
              </label>
              <label className="grid gap-2 font-bold text-slate-700 dark:text-indigo-200">
                Username
                <input
                  className="min-h-12 w-full rounded-xl border border-[#303958] bg-white px-3.5 text-slate-900 shadow-sm dark:bg-[#070b1b] dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  type="text"
                  name="username"
                  placeholder="Enter username"
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </label>
              <label className="grid gap-2 font-bold text-slate-700 dark:text-indigo-200">
                Password
                <input
                  className="min-h-12 w-full rounded-xl border border-[#303958] bg-white px-3.5 text-slate-900 shadow-sm dark:bg-[#070b1b] dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </label>
              {error && (
                <p className="m-0 text-red-300" role="alert">
                  {error}
                </p>
              )}
              <div className="flex gap-2.5 md:col-span-2">
                <GlowButton disabled={busy}>
                  {busy
                    ? "Saving..."
                    : editingId
                      ? "Update credential"
                      : "Save credential"}
                </GlowButton>
                {editingId && (
                  <button
                    type="button"
                    className="min-h-10.5 rounded-xl border border-[#394363] bg-[#121a36] px-[15px] text-indigo-50 disabled:cursor-wait disabled:opacity-65"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section
              className="mt-8 sm:mt-10"
              aria-labelledby="credentials-title"
            >
              <div className="mb-4 grid gap-3 sm:mb-[18px] sm:flex sm:items-end sm:justify-between sm:gap-5">
                <div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">
                      Private workspace
                    </p>
                    <h1
                      id="credentials-title"
                      className="mt-2 text-3xl font-black text-slate-950 dark:text-white"
                    >
                      Your vault
                    </h1>
                  </div>
                  <p className="mt-1.5 text-[#a8b0c7]">
                    {credentials.length} saved item
                    {credentials.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  className="w-full sm:w-auto min-h-10.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:border-indigo-400 dark:border-[#394363] dark:bg-[#121a36] px-[15px] dark:text-indigo-50 disabled:cursor-wait disabled:opacity-65"
                  type="button"
                  onClick={loadCredentials}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
              <input
                aria-label="Search credentials"
                placeholder="Search by website or username"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mb-5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white/95 dark:border-[#29314c] dark:bg-[rgba(10,15,35,0.88)] p-5 sm:p-[clamp(1.5rem,5vw,2.625rem)] text-center text-[#a8b0c7] shadow-[0_14px_36px_rgba(79,70,229,0.10)] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                  Loading encrypted vault...
                </div>
              ) : credentials.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white/95 dark:border-[#29314c] dark:bg-[rgba(10,15,35,0.88)] p-5 sm:p-[clamp(1.5rem,5vw,2.625rem)] text-center text-[#a8b0c7] shadow-[0_14px_36px_rgba(79,70,229,0.10)] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                  No credentials saved yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                  {filteredCredentials.map((item) => (
                    <article
                      className="min-w-0 rounded-[20px] border border-slate-200 bg-white/95 dark:border-[#29314c] dark:bg-[rgba(10,15,35,0.88)] p-5 shadow-[0_8px_22px_rgba(79,70,229,0.07)] sm:p-[22px] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                      key={item.id}
                    >
                      <a
                        href={item.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden text-ellipsis whitespace-nowrap font-extrabold text-slate-700 dark:text-indigo-200"
                      >
                        {item.site}
                      </a>
                      <dl className="my-4 grid gap-3 sm:my-[22px] sm:gap-3.5">
                        <div>
                          <dt className="text-xs uppercase tracking-[0.1em] text-[#7f8ba8]">
                            Username
                          </dt>
                          <dd className="mt-1.5 overflow-wrap-anywhere">
                            {item.username}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.1em] text-[#7f8ba8]">
                            Password
                          </dt>
                          <dd className="mt-1.5 overflow-wrap-anywhere font-mono">
                            {visible[item.id]
                              ? item.password
                              : "•".repeat(Math.min(item.password.length, 16))}
                          </dd>
                        </div>
                      </dl>
                      <div className="grid grid-cols-6 gap-2">
                        <button
                          className="col-span-2 inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-xl border border-slate-300 bg-white px-2 text-[0.78rem] text-slate-800 hover:border-indigo-400 dark:border-[#394363] dark:bg-[#121a36] dark:text-indigo-50"
                          type="button"
                          aria-label="Copy username"
                          onClick={() => copyText(item.username, "Username")}
                        >
                          Copy user
                        </button>
                        <button
                          className="col-span-2 inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-xl border border-slate-300 bg-white px-2 text-[0.78rem] text-slate-800 hover:border-indigo-400 dark:border-[#394363] dark:bg-[#121a36] dark:text-indigo-50"
                          type="button"
                          aria-label={
                            visible[item.id] ? "Hide password" : "Show password"
                          }
                          aria-pressed={Boolean(visible[item.id])}
                          onClick={() =>
                            setVisible({
                              ...visible,
                              [item.id]: !visible[item.id],
                            })
                          }
                        >
                          <img
                            src={visible[item.id] ? hideIcon : viewIcon}
                            alt=""
                            className="h-[17px] w-[17px] brightness-0 invert"
                          />
                          {visible[item.id] ? "Hide" : "Show"}
                        </button>
                        <button
                          className="col-span-2 inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-xl border border-slate-300 bg-white px-2 text-[0.78rem] text-slate-800 hover:border-indigo-400 dark:border-[#394363] dark:bg-[#121a36] dark:text-indigo-50"
                          type="button"
                          aria-label="Copy password"
                          onClick={() => copyText(item.password, "Password")}
                        >
                          Copy pass
                        </button>
                        <button
                          className="col-span-3 inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-xl border border-slate-300 bg-white px-2 text-[0.78rem] text-slate-800 hover:border-indigo-400 dark:border-[#394363] dark:bg-[#121a36] dark:text-indigo-50"
                          type="button"
                          onClick={() => beginEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="col-span-3 inline-flex min-h-[38px] items-center justify-center rounded-xl border border-red-300 bg-red-50 px-3 text-[0.78rem] font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200 dark:hover:bg-red-950/40"
                          onClick={() => removeCredential(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </>
  );
}
