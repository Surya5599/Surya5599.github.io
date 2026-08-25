import { useState } from "react";

// Recreation of the CS166 Cruise Management System (Java Swing + PostgreSQL):
// browse cruises, make and cancel reservations, file maintenance requests —
// against an in-memory fleet, with the SQL the real backend would run.

type Cruise = { id: number; ship: string; captain: string; dest: string; month: string; nights: number; price: number; cabins: number };
type Reservation = { id: string; cruiseId: number; name: string };

const FLEET: Cruise[] = [
  { id: 101, ship: "MS Aurora", captain: "R. Vance", dest: "Alaska", month: "Jun", nights: 7, price: 1290, cabins: 3 },
  { id: 102, ship: "MS Aurora", captain: "R. Vance", dest: "Alaska", month: "Jul", nights: 7, price: 1390, cabins: 2 },
  { id: 103, ship: "SS Meridian", captain: "T. Okafor", dest: "Caribbean", month: "Jun", nights: 5, price: 890, cabins: 4 },
  { id: 104, ship: "SS Meridian", captain: "T. Okafor", dest: "Caribbean", month: "Aug", nights: 10, price: 1690, cabins: 1 },
  { id: 105, ship: "MV Polaris", captain: "K. Ibarra", dest: "Mediterranean", month: "Jul", nights: 9, price: 1990, cabins: 2 },
  { id: 106, ship: "MV Polaris", captain: "K. Ibarra", dest: "Mediterranean", month: "Sep", nights: 9, price: 1790, cabins: 5 },
  { id: 107, ship: "MS Borealis", captain: "A. Chen", dest: "Norway", month: "Aug", nights: 6, price: 1490, cabins: 0 },
];

const DESTS = ["All", ...new Set(FLEET.map((c) => c.dest))];

export default function CruiseSim() {
  const [tab, setTab] = useState<"cruises" | "reservations" | "maintenance">("cruises");
  const [dest, setDest] = useState("All");
  const [cabins, setCabins] = useState<Record<number, number>>(Object.fromEntries(FLEET.map((c) => [c.id, c.cabins])));
  const [selected, setSelected] = useState<Cruise | null>(null);
  const [name, setName] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maint, setMaint] = useState<string[]>([]);
  const [maintText, setMaintText] = useState("");
  const [sql, setSql] = useState<string[]>(["-- connected to cruisedb as app_user"]);
  const [nextRes, setNextRes] = useState(5001);

  const log = (q: string) => setSql((s) => [...s.slice(-8), q]);
  const rows = FLEET.filter((c) => dest === "All" || c.dest === dest);

  function pickDest(d: string) {
    setDest(d);
    log(`SELECT * FROM cruises ${d === "All" ? "" : `WHERE destination = '${d}' `}ORDER BY departure;`);
  }

  function book() {
    if (!selected || !name.trim() || cabins[selected.id] <= 0) return;
    const rid = `R-${nextRes}`;
    setNextRes((n) => n + 1);
    setReservations((r) => [...r, { id: rid, cruiseId: selected.id, name: name.trim() }]);
    setCabins((c) => ({ ...c, [selected.id]: c[selected.id] - 1 }));
    log(`INSERT INTO reservations (id, cruise_id, customer) VALUES ('${rid}', ${selected.id}, '${name.trim()}');`);
    log(`UPDATE cruises SET cabins_available = cabins_available - 1 WHERE id = ${selected.id};`);
    setSelected(null);
    setName("");
    setTab("reservations");
  }

  function cancel(r: Reservation) {
    setReservations((rs) => rs.filter((x) => x.id !== r.id));
    setCabins((c) => ({ ...c, [r.cruiseId]: c[r.cruiseId] + 1 }));
    log(`DELETE FROM reservations WHERE id = '${r.id}';`);
    log(`UPDATE cruises SET cabins_available = cabins_available + 1 WHERE id = ${r.cruiseId};`);
  }

  function fileMaint() {
    if (!maintText.trim()) return;
    setMaint((m) => [...m, maintText.trim()]);
    log(`INSERT INTO maintenance_requests (ship, note) VALUES ('${FLEET[0].ship}', '${maintText.trim().slice(0, 40)}');`);
    setMaintText("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col font-mono text-[13px]">
      {/* app window */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[3fr_2fr]">
        <div className="self-start rounded-xl border border-pane-edge bg-[#f5f2ea] p-4" style={{ color: "#1c1b1a" }}>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a8579]">
            cruise management system · v1.0
          </p>
          <div className="mt-3 flex gap-1.5 font-sans text-xs font-bold">
            {(["cruises", "reservations", "maintenance"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`cursor-pointer rounded-md border-2 border-[#1c1b1a] px-3 py-1.5 capitalize ${tab === t ? "bg-[#c98d82] text-white" : "bg-white"}`}
              >
                {t}
                {t === "reservations" && reservations.length > 0 && ` (${reservations.length})`}
              </button>
            ))}
          </div>

          {tab === "cruises" && (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5 font-sans text-[11px] font-bold">
                {DESTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => pickDest(d)}
                    className={`cursor-pointer rounded-full border-2 border-[#1c1b1a] px-2.5 py-0.5 ${dest === d ? "bg-[#8fbfa8]" : "bg-white"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <table className="mt-3 w-full font-sans text-xs">
                <thead>
                  <tr className="text-left text-[9px] font-extrabold uppercase tracking-wider text-[#8a8579]">
                    <th className="pb-1">ship / captain</th>
                    <th className="pb-1">route</th>
                    <th className="pb-1">price</th>
                    <th className="pb-1">cabins</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => cabins[c.id] > 0 && setSelected(c)}
                      className={`border-t border-[#d8d3c6] ${cabins[c.id] > 0 ? "cursor-pointer hover:bg-white" : "opacity-45"} ${selected?.id === c.id ? "bg-white" : ""}`}
                    >
                      <td className="py-1.5 pr-2 font-bold">
                        {c.ship}
                        <span className="block text-[10px] font-semibold text-[#8a8579]">Capt. {c.captain}</span>
                      </td>
                      <td className="py-1.5 pr-2">{c.dest} · {c.month} · {c.nights}n</td>
                      <td className="py-1.5 pr-2">${c.price}</td>
                      <td className="py-1.5">{cabins[c.id] > 0 ? cabins[c.id] : "sold out"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selected && (
                <div className="mt-3 rounded-lg border-2 border-[#1c1b1a] bg-white p-3 font-sans">
                  <p className="text-xs font-bold">
                    Book {selected.ship} → {selected.dest} ({selected.month}, {selected.nights} nights, ${selected.price})
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="passenger name"
                      aria-label="Passenger name"
                      className="w-full rounded-md border-2 border-[#1c1b1a] px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      onClick={book}
                      disabled={!name.trim()}
                      className="cursor-pointer whitespace-nowrap rounded-md border-2 border-[#1c1b1a] bg-[#8fbfa8] px-3 py-1.5 text-xs font-extrabold disabled:opacity-40"
                    >
                      confirm ⏎
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "reservations" && (
            <div className="mt-3 space-y-2 font-sans text-xs">
              {reservations.length === 0 && <p className="text-[#8a8579]">No reservations yet — book a cruise from the first tab.</p>}
              {reservations.map((r) => {
                const c = FLEET.find((f) => f.id === r.cruiseId)!;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border-2 border-[#1c1b1a] bg-white px-3 py-2">
                    <span>
                      <strong>{r.id}</strong> · {r.name} · {c.ship} → {c.dest} ({c.month})
                    </span>
                    <button onClick={() => cancel(r)} className="cursor-pointer font-bold text-[#b06a5d] underline">
                      cancel
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "maintenance" && (
            <div className="mt-3 font-sans text-xs">
              <div className="flex gap-2">
                <input
                  value={maintText}
                  onChange={(e) => setMaintText(e.target.value)}
                  placeholder="describe the issue (e.g. radar flicker on MS Aurora)"
                  aria-label="Maintenance issue"
                  className="w-full rounded-md border-2 border-[#1c1b1a] px-2.5 py-1.5 focus:outline-none"
                />
                <button onClick={fileMaint} disabled={!maintText.trim()} className="cursor-pointer whitespace-nowrap rounded-md border-2 border-[#1c1b1a] bg-[#d9a441] px-3 py-1.5 font-extrabold disabled:opacity-40">
                  file request
                </button>
              </div>
              <ul className="mt-2 space-y-1.5">
                {maint.map((m, i) => (
                  <li key={i} className="rounded-lg border-2 border-[#1c1b1a] bg-white px-3 py-2">🔧 {m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* SQL log */}
        <div className="self-start rounded-md border border-pane-edge bg-black/25 p-3">
          <p className="text-[10px] uppercase tracking-widest text-pane-dim">postgres query log</p>
          <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-moss/90">
            {sql.map((q, i) => (
              <p key={i} className={i === sql.length - 1 ? "text-moss" : "text-pane-dim"}>{q}</p>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-pane-dim">
            The real system was a Java Swing GUI over a normalized PostgreSQL schema — ships,
            captains, cruises, customers, reservations, maintenance — seeded from CSVs. Every action
            here shows the query it would run.
          </p>
        </div>
      </div>
    </div>
  );
}
