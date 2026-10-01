"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Gauge,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Power,
  Send,
  Server,
  Trash2,
  X,
} from "lucide-react";
import {
  listProviders,
  saveProvider,
  deleteProvider,
  activateProvider,
  testProvider,
  sendTestEmail,
  ProviderDTO,
  ProviderInput,
} from "./actions";
import { EMAIL_PRESETS } from "@/lib/email-presets";

const input =
  "mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10";

function presetDefaults(presetId: string): ProviderInput {
  const p =
    EMAIL_PRESETS.find((x) => x.id === presetId) ??
    EMAIL_PRESETS[EMAIL_PRESETS.length - 1];
  return {
    name: p.id === "custom" ? "" : p.label,
    preset: p.id,
    host: p.host,
    port: p.port,
    secure: p.secure,
    username: "",
    password: "",
    maxPerHour: p.maxPerHour,
    maxPerDay: p.maxPerDay,
    batchSize: p.batchSize,
    batchDelaySec: p.batchDelaySec,
  };
}

function limitsSummary(
  p: Pick<
    ProviderDTO,
    "maxPerHour" | "maxPerDay" | "batchSize" | "batchDelaySec"
  >
) {
  const parts = [];
  if (p.maxPerHour) parts.push(`${p.maxPerHour}/hour`);
  if (p.maxPerDay) parts.push(`${p.maxPerDay}/day`);
  if (!parts.length) parts.push("No limit set");
  parts.push(`batches of ${p.batchSize} every ${p.batchDelaySec}s`);
  return parts.join(" · ");
}

function StatusPill({ p }: { p: ProviderDTO }) {
  if (p.lastTestOk === true)
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Connected
      </span>
    );
  if (p.lastTestOk === false)
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Failed
      </span>
    );
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      Not tested
    </span>
  );
}

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<ProviderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProviderInput>(presetDefaults("brevo"));
  const [editing, setEditing] = useState<ProviderDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [testTo, setTestTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const active = providers.find((p) => p.isActive) ?? null;
  const preset = EMAIL_PRESETS.find((p) => p.id === form.preset);

  const load = useCallback(async () => {
    const res = await listProviders();
    setLoading(false);
    if (!res.ok) return setError(res.message);
    setProviders(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(ok: boolean, msg: string) {
    if (ok) {
      setNotice(msg);
      setError(null);
    } else {
      setError(msg);
      setNotice(null);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(presetDefaults("brevo"));
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(p: ProviderDTO) {
    setEditing(p);
    setForm({ ...p, password: "" });
    setFormError(null);
    setFormOpen(true);
  }

  function update<K extends keyof ProviderInput>(
    key: K,
    value: ProviderInput[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function choosePreset(id: string) {
    const d = presetDefaults(id);
    setForm((f) => ({
      ...d,
      username: f.username,
      password: f.password,
      id: f.id,
    }));
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const res = await saveProvider({ ...form, id: editing?.id });
    setSaving(false);
    if (!res.ok) return setFormError(res.message);

    setFormOpen(false);
    flash(
      true,
      `"${res.data.name}" saved. Click "Test connection" to check it.`
    );
    load();
  }

  async function handleTest(p: ProviderDTO) {
    setBusyId(p.id);
    const res = await testProvider(p.id);
    setBusyId(null);
    if (!res.ok) return flash(false, res.message);
    flash(
      res.data.lastTestOk === true,
      res.data.lastTestOk
        ? `${p.name} connected successfully.`
        : `${p.name}: ${res.data.lastError}`
    );
    load();
  }

  async function handleActivate(p: ProviderDTO) {
    setBusyId(p.id);
    const res = await activateProvider(p.id);
    setBusyId(null);
    flash(
      res.ok,
      res.ok ? `${p.name} is now used for all outgoing email.` : res.message
    );
    if (res.ok) load();
  }

  async function handleDelete(p: ProviderDTO) {
    if (!confirm(`Delete "${p.name}"? Its saved password will be removed.`))
      return;
    setBusyId(p.id);
    const res = await deleteProvider(p.id);
    setBusyId(null);
    flash(res.ok, res.ok ? `${p.name} deleted.` : res.message);
    if (res.ok) load();
  }

  async function handleSendTest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSendingTest(true);
    const res = await sendTestEmail(testTo);
    setSendingTest(false);
    flash(res.ok, res.ok ? res.data : res.message);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
      <header className="mb-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-gwc-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Settings
        </Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">Settings</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
              Integrations
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Connect the SMTP service used for invitations, password resets,
              alerts, and newsletters. Only the active connection is used.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add SMTP connection
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="break-words">{error}</p>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <p>{notice}</p>
        </div>
      )}

      <section className="space-y-4">
        {loading && (
          <p className="text-sm text-slate-500">Loading connections…</p>
        )}

        {!loading && providers.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Server
              className="mx-auto h-8 w-8 text-slate-300"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No email connection yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add Namecheap, Brevo, Resend, or any SMTP server to start sending.
            </p>
          </div>
        )}

        {providers.map((p) => (
          <article
            key={p.id}
            className={`rounded-xl border bg-white p-6 shadow-sm ${p.isActive ? "border-gwc-navy ring-1 ring-gwc-navy/20" : "border-slate-200"}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                  <Server className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-800">
                      {p.name}
                    </h2>
                    {p.isActive && (
                      <span className="rounded-full bg-gwc-navy px-2.5 py-1 text-xs font-semibold text-white">
                        Active
                      </span>
                    )}
                    <StatusPill p={p} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {p.host}:{p.port} · {p.username}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                    {limitsSummary(p)}
                  </p>
                  {p.lastTestOk === false && p.lastError && (
                    <p className="mt-2 break-words text-xs text-red-600">
                      {p.lastError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => handleTest(p)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {busyId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Test connection
                </button>
                {!p.isActive && (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => handleActivate(p)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gwc-navy px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Power className="h-3.5 w-3.5" aria-hidden="true" />
                    Activate
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
                {!p.isActive && (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => handleDelete(p)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Send a test email
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {active
                ? `Sends through "${active.name}" using your Communication Defaults sender.`
                : "Activate a connection first."}
            </p>
          </div>
        </div>
        <form
          onSubmit={handleSendTest}
          className="flex flex-col gap-3 p-6 sm:flex-row"
        >
          <input
            required
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@example.org"
            disabled={!active}
            className="flex-1 rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={!active || sendingTest}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {sendingTest ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sendingTest ? "Sending…" : "Send test"}
          </button>
        </form>
      </section>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editing ? `Edit ${editing.name}` : "Add SMTP connection"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pick a provider to prefill its settings, then enter your
                  login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 px-6 py-6">
              {formError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Provider
                  </span>
                  <select
                    value={form.preset}
                    onChange={(e) => choosePreset(e.target.value)}
                    className={`${input} bg-white`}
                  >
                    {EMAIL_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Connection name
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Brevo – newsletters"
                    className={input}
                  />
                </label>
              </div>

              {preset && (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  {preset.help}
                </p>
              )}

              <div className="grid gap-5 md:grid-cols-[1fr_120px_140px]">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    SMTP host
                  </span>
                  <input
                    required
                    value={form.host}
                    onChange={(e) => update("host", e.target.value)}
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Port
                  </span>
                  <input
                    required
                    type="number"
                    value={form.port}
                    onChange={(e) => {
                      const port = Number(e.target.value);
                      setForm((f) => ({ ...f, port, secure: port === 465 }));
                    }}
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Encryption
                  </span>
                  <select
                    value={form.secure ? "ssl" : "starttls"}
                    onChange={(e) => update("secure", e.target.value === "ssl")}
                    className={`${input} bg-white`}
                  >
                    <option value="ssl">SSL (465)</option>
                    <option value="starttls">STARTTLS (587)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Username
                  </span>
                  <input
                    required
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    autoComplete="off"
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Password / API key
                  </span>
                  <input
                    type="password"
                    required={!editing}
                    value={form.password ?? ""}
                    onChange={(e) => update("password", e.target.value)}
                    autoComplete="new-password"
                    placeholder={
                      editing?.hasPassword
                        ? "Leave blank to keep the saved password"
                        : ""
                    }
                    className={input}
                  />
                </label>
              </div>

              <fieldset className="rounded-lg border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-700">
                  Sending limits &amp; batching
                </legend>
                <div className="grid gap-5 md:grid-cols-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Max per hour
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={form.maxPerHour ?? ""}
                      onChange={(e) =>
                        update(
                          "maxPerHour",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="No limit"
                      className={input}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Max per day
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={form.maxPerDay ?? ""}
                      onChange={(e) =>
                        update(
                          "maxPerDay",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="No limit"
                      className={input}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Batch size
                    </span>
                    <input
                      required
                      type="number"
                      min={1}
                      value={form.batchSize}
                      onChange={(e) =>
                        update("batchSize", Number(e.target.value))
                      }
                      className={input}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Pause between batches (s)
                    </span>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.batchDelaySec}
                      onChange={(e) =>
                        update("batchDelaySec", Number(e.target.value))
                      }
                      className={input}
                    />
                  </label>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Newsletters are sent in batches. Example: {form.batchSize}{" "}
                  emails, then a {form.batchDelaySec}-second pause. Sending
                  stops for the hour or day once a limit is reached and resumes
                  automatically.
                </p>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : "Save connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
