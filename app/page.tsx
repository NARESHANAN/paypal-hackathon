"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Expense, SplitResult, Transfer } from "@/lib/split";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  currencyFractionDigits,
  DEFAULT_CURRENCY,
  getRegionSample,
} from "@/lib/region";

function money(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

function currencyDigits(currency: string, locale: string) {
  return currencyFractionDigits(currency, locale);
}

function paypalUrl(handle: string, amount: number, currency: string, locale: string) {
  const username = handle.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?paypal\.me\//i, "").replace(/\/.*$/, "");
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) return "";
  return `https://www.paypal.me/${encodeURIComponent(username)}/${amount.toFixed(currencyDigits(currency, locale))}/${currency}`;
}

function Avatar({ name, tone = "lavender" }: { name: string; tone?: string }) {
  return <span className={`avatar ${tone}`}>{name.trim().charAt(0).toUpperCase()}</span>;
}

function ExpenseRow({
  expense,
  index,
  currency,
  locale,
}: {
  expense: Expense;
  index: number;
  currency: string;
  locale: string;
}) {
  const colors = ["lavender", "peach", "mint", "blue"];
  return (
    <div className="expense-row">
      <span className="expense-index">{String(index + 1).padStart(2, "0")}</span>
      <Avatar name={expense.payer} tone={colors[index % colors.length]} />
      <div className="expense-info">
        <strong>{expense.description}</strong>
        <span>Paid by {expense.payer}{expense.excluded.length ? ` · ${expense.excluded.join(", ")} sat this one out` : ""}</span>
      </div>
      <strong className="expense-amount">{money(expense.amount, currency, locale)}</strong>
    </div>
  );
}

function SettlementRow({
  transfer,
  handle,
  onHandleChange,
  index,
  currency,
  locale,
}: {
  transfer: Transfer;
  handle: string;
  onHandleChange: (handle: string) => void;
  index: number;
  currency: string;
  locale: string;
}) {
  const link = paypalUrl(handle, transfer.amount, currency, locale);
  return (
    <div className="settlement-card">
      <div className={`settlement-avatar avatar-tone-${index % 4}`}><Avatar name={transfer.from} /></div>
      <div className="settlement-copy">
        <div className="settlement-names"><strong>{transfer.from}</strong><span>pays</span><strong>{transfer.to}</strong></div>
        <div className="handle-field">
          <span>paypal.me/</span>
          <input
            aria-label={`PayPal.Me username for ${transfer.to}`}
            value={handle}
            onChange={(event) => onHandleChange(event.target.value)}
            placeholder="recipient username"
          />
        </div>
      </div>
      <div className="settlement-action">
        <strong className="settlement-amount">{money(transfer.amount, currency, locale)}</strong>
        {link ? (
          <a className="paypal-button" href={link} target="_blank" rel="noreferrer">
            Settle up <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="handle-hint">Add PayPal.Me username</span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [chat, setChat] = useState(() => getRegionSample("US").chat);
  const [participantText, setParticipantText] = useState(() => getRegionSample("US").participants);
  const [countryCode, setCountryCode] = useState<(typeof COUNTRY_OPTIONS)[number]["code"]>("US");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const participants = useMemo(
    () => participantText.split(",").map((name) => name.trim()).filter(Boolean),
    [participantText],
  );
  const country = COUNTRY_OPTIONS.find((option) => option.code === countryCode) ?? COUNTRY_OPTIONS[0];
  const locale = country.locale;
  const regionSample = getRegionSample(countryCode);
  const total = result?.expenses.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat, participants, currency }),
      });
      const data = (await response.json()) as SplitResult & { error?: string; parser?: string };
      if (!response.ok) throw new Error(data.error || "Could not split this chat.");
      setResult(data);
      setHandles((current) => {
        const next = { ...current };
        for (const transfer of data.transfers) {
          if (!(transfer.to in next)) next[transfer.to] = transfer.to.toLowerCase().replace(/[^a-z0-9._-]/g, "");
        }
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Split home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>split<span className="brand-dot">.</span></span>
        </a>
        <div className="topbar-right">
          <span className="topbar-note"><span className="live-dot" /> Built for the group chat</span>
          <a className="topbar-link" href="#how-it-works">How it works <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="sparkle">✳</span> GROUP EXPENSES, UNCOMPLICATED</div>
          <h1>Good times.<br /><span>Clear tabs.</span></h1>
          <p>Drop in your group chat. We’ll do the math, so you can get back to the memories.</p>
          <div className="hero-proof">
            <div className="avatar-stack"><Avatar name="A" /><Avatar name="R" tone="peach" /><Avatar name="P" tone="mint" /><Avatar name="D" tone="blue" /></div>
            <span>Less chasing. More <em>“already sent!”</em></span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-note note-left"><span className="note-icon">↗</span><span>Cab share</span><strong>{money(600, currency, locale)}</strong></div>
          <div className="art-card">
            <div className="art-card-top"><span className="tiny-label">TRIP TOTAL</span><span className="art-check">✓</span></div>
            <div className="art-total">{money(6400, currency, locale)}</div>
            <div className="art-divider" />
            <div className="art-person"><Avatar name={regionSample.names[0]} tone="peach" /><span>{regionSample.names[0]} covered</span><strong>{money(2400, currency, locale)}</strong></div>
            <div className="art-person"><Avatar name={regionSample.names[1]} tone="mint" /><span>{regionSample.names[1]} covered</span><strong>{money(3200, currency, locale)}</strong></div>
            <div className="art-person"><Avatar name="You" tone="lavender" /><span>You covered</span><strong>{money(800, currency, locale)}</strong></div>
          </div>
          <div className="art-note note-right"><span className="note-icon paypal-mini">P</span><span>All settled</span><strong>✓</strong></div>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✦</span>
        </div>
      </section>

      <section className="workspace" id="split">
        <div className="section-heading">
          <div><div className="step-label"><span>01</span> THE CHAT</div><h2>Paste the chaos.</h2></div>
          <span className="private-badge"><span aria-hidden="true">⌑</span> Private by design</span>
        </div>
        <div className="work-grid">
          <form className="chat-panel" onSubmit={handleSubmit}>
            <div className="panel-title"><span className="chat-bubble-icon">•••</span><span>Group chat</span><span className="panel-live">TEXT EXPORT</span></div>
            <label className="sr-only" htmlFor="chat">Paste your group chat</label>
            <textarea id="chat" value={chat} onChange={(event) => setChat(event.target.value)} placeholder="Paste messages with expenses here…" maxLength={20000} />
            <div className="chat-footer"><span>Names + amounts work best</span><button type="button" className="sample-button" onClick={() => { setChat(regionSample.chat); setParticipantText(regionSample.participants); }}>Use sample chat ↗</button></div>
            <div className="region-fields">
              <div className="region-field">
                <label htmlFor="country">COUNTRY</label>
                <select
                  id="country"
                  value={countryCode}
                  onChange={(event) => {
                    const selected = COUNTRY_OPTIONS.find((option) => option.code === event.target.value);
                    if (selected) {
                      const previousSample = getRegionSample(countryCode);
                      const hasDefaultChat = chat === previousSample.chat;
                      const hasDefaultParticipants = participantText === previousSample.participants;
                      setCountryCode(selected.code);
                      setCurrency(selected.currency);
                      setResult(null);
                      if (hasDefaultChat && hasDefaultParticipants) {
                        const nextSample = getRegionSample(selected.code);
                        setChat(nextSample.chat);
                        setParticipantText(nextSample.participants);
                      }
                    }
                  }}
                >
                  {COUNTRY_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
                </select>
              </div>
              <div className="region-field">
                <label htmlFor="currency">CURRENCY</label>
                <select id="currency" value={currency} onChange={(event) => { setCurrency(event.target.value); setResult(null); }}>
                  {CURRENCY_OPTIONS.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
                </select>
              </div>
            </div>
            <p className="currency-note">Choose the currency used for all amounts in this chat. Mixed-currency conversion isn’t supported yet.</p>
            <div className="participants-field">
              <label htmlFor="participants">WHO’S IN THE GROUP?</label>
              <input id="participants" value={participantText} onChange={(event) => setParticipantText(event.target.value)} placeholder="You, Alex, Sam" />
              <span>Comma-separated. Include yourself as “You” if the chat says “I paid”.</span>
            </div>
            {error && <div className="error-message" role="alert">{error}</div>}
            <button type="submit" className="split-button" disabled={loading}>
              {loading ? <><span className="button-spinner" /> Making sense of it…</> : <>Make it make sense <span aria-hidden="true">→</span></>}
            </button>
            <div className="form-footnote"><span>✦</span> No payments happen without your say-so.</div>
            <p className="privacy-note">Chats aren’t stored by this app. If AI parsing is enabled, chat text is sent to Google Gemini.</p>
          </form>

          <div className={`results-panel ${result ? "has-result" : ""}`}>
            {!result ? (
              <div className="empty-state">
                <div className="empty-illustration">
                  <div className="empty-receipt"><span /><span /><span /><i>?</i></div>
                  <span className="empty-star star-a">✳</span><span className="empty-star star-b">✦</span>
                </div>
                <h3>Your split will<br />show up here.</h3>
                <p>We’ll find the expenses, figure out who joined in, and make the math fair.</p>
                <div className="empty-steps"><span>01&nbsp; Find expenses</span><i /><span>02&nbsp; Settle up</span></div>
              </div>
            ) : (
              <div className="results-content">
                <div className="result-heading">
                  <div><div className="step-label"><span>02</span> THE BREAKDOWN</div><h2>That’s a wrap.</h2></div>
                  <span className="ready-badge"><span /> READY</span>
                </div>
                <div className="summary-strip">
                  <div><span>TOTAL SPENT</span><strong>{money(total, currency, locale)}</strong></div>
                  <div><span>EXPENSES</span><strong>{result.expenses.length} <small>items</small></strong></div>
                  <div><span>TO SETTLE</span><strong>{result.transfers.length} <small>payments</small></strong></div>
                </div>
                <div className="expense-list">
                  <div className="list-heading">THE EXPENSES <span>WHO PAID WHAT</span></div>
                  {result.expenses.map((expense, index) => <ExpenseRow key={`${expense.payer}-${expense.amount}-${index}`} expense={expense} index={index} currency={currency} locale={locale} />)}
                </div>
                <div className="settlements">
                  <div className="list-heading">SETTLE UP <span>PAYPAL.ME LINKS</span></div>
                  {result.transfers.length ? result.transfers.map((transfer, index) => (
                    <SettlementRow
                      key={`${transfer.from}-${transfer.to}`}
                      transfer={transfer}
                      index={index}
                      handle={handles[transfer.to] ?? ""}
                      onHandleChange={(handle) => setHandles((current) => ({ ...current, [transfer.to]: handle }))}
                      currency={currency}
                      locale={locale}
                    />
                  )) : <p className="all-settled">Everyone’s all square. No payments needed.</p>}
                  <p className="paypal-disclaimer">Suggested usernames come from the recipient’s name—edit them to the exact PayPal.Me handle. Check every amount before paying; links open PayPal but never send money automatically.</p>
                </div>
                <button className="edit-chat" onClick={() => setResult(null)}>← Edit chat and recalculate</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-title"><div className="step-label"><span>✳</span> THE SHORT VERSION</div><h2>From “who owes who?”<br />to <em>“all sorted.”</em></h2></div>
        <div className="how-cards">
          <article className="how-card"><span className="how-number">01</span><div className="how-icon chat-how">“ ”</div><h3>Paste the chat</h3><p>Drop in the messages. No receipt-by-receipt data entry, promise.</p></article>
          <article className="how-card"><span className="how-number">02</span><div className="how-icon math-how">÷</div><h3>We untangle it</h3><p>Expenses, who paid, and who sat out — organized into a fair split.</p></article>
          <article className="how-card"><span className="how-number">03</span><div className="how-icon pay-how">↗</div><h3>Settle your way</h3><p>Get individual PayPal.Me links. Check the details, then choose to pay.</p></article>
        </div>
      </section>

      <footer className="footer"><a className="brand" href="#"><span className="brand-mark"><span /><span /><span /><span /></span><span>split<span className="brand-dot">.</span></span></a><span>Made for the group-chat accountant in all of us.</span><span className="footer-note">FAIR SPLITS, GOOD TRIPS.</span></footer>
    </main>
  );
}
