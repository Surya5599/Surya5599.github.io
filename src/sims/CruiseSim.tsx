import { useState } from "react";

// Faithful recreation of the real Java Swing "Ship Management System" GUI
// (repo: ShipBookingSystem): the same main menu — Add Data, Book a Cruise,
// Available Seats, Repairs Info, Passengers Info, View Data, Quit — over an
// in-memory dataset, with the SQL the PostgreSQL backend would run.

type Cruise = { id: number; ship: string; captain: string; dest: string; month: string; price: number; seats: number };
type Reservation = { id: string; cruiseId: number; name: string };

const SEED: Cruise[] = [
  { id: 101, ship: "MS Aurora", captain: "R. Vance", dest: "Alaska", month: "Jun", price: 1290, seats: 3 },
  { id: 102, ship: "SS Meridian", captain: "T. Okafor", dest: "Caribbean", month: "Jun", price: 890, seats: 4 },
  { id: 103, ship: "SS Meridian", captain: "T. Okafor", dest: "Caribbean", month: "Aug", price: 1690, seats: 1 },
  { id: 104, ship: "MV Polaris", captain: "K. Ibarra", dest: "Mediterranean", month: "Jul", price: 1990, seats: 2 },
  { id: 105, ship: "MS Borealis", captain: "A. Chen", dest: "Norway", month: "Aug", price: 1490, seats: 0 },
];

type Screen = "menu" | "add" | "book" | "seats" | "repairs" | "passengers" | "view" | "quit";

const MENU: { key: Screen; label: string }[] = [
  { key: "add", label: "Add Data" },
  { key: "book", label: "Book a Cruise" },
  { key: "seats", label: "Available Seats" },
  { key: "repairs", label: "Repairs Info" },
  { key: "passengers", label: "Passengers Info" },
  { key: "view", label: "View Data" },
  { key: "quit", label: "Quit" },
];

// Swing-style button
function JButton({ children, onClick, wide = true }: { children: React.ReactNode; onClick: () => void; wide?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer border border-[#7a96b8] px-4 py-1.5 text-[15px] font-bold text-[#1c1b1a] active:translate-y-px ${wide ? "w-64" : ""}`}
      style={{
        background: "linear-gradient(#f4f9fd, #d9e6f2 45%, #c7d8ea)",
        borderRadius: 4,
        fontFamily: "'Trebuchet MS', Verdana, sans-serif",
        boxShadow: "inset 0 1px 0 #fff",
      }}
    >
      {children}
    </button>
  );
}

export default function CruiseSim() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [cruises, setCruises] = useState<Cruise[]>(SEED);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [repairs, setRepairs] = useState<string[]>(["MS Borealis — radar calibration (open)"]);
  const [sql, setSql] = useState<string[]>(["-- connected to shipdb as app_user"]);
  const [nextRes, setNextRes] = useState(5001);
  const [nextCruise, setNextCruise] = useState(106);
  // form state
  const [selCruise, setSelCruise] = useState<number | null>(null);
  const [pname, setPname] = useState("");
  const [addShip, setAddShip] = useState("");
  const [addDest, setAddDest] = useState("");
  const [repairText, setRepairText] = useState("");

  const log = (q: string) => setSql((s) => [...s.slice(-7), q]);

  function open(s: Screen) {
    setScreen(s);
    const q: Partial<Record<Screen, string>> = {
      book: "SELECT * FROM cruises WHERE seats_available > 0;",
      seats: "SELECT ship, destination, seats_available FROM cruises ORDER BY id;",
      repairs: "SELECT * FROM repairs ORDER BY filed_at DESC;",
      passengers: "SELECT r.id, r.customer, c.ship FROM reservations r JOIN cruises c ON c.id = r.cruise_id;",
      view: "SELECT * FROM cruises; SELECT * FROM reservations; SELECT * FROM repairs;",
    };
    if (q[s]) log(q[s]!);
  }

  function addData() {
    if (!addShip.trim() || !addDest.trim()) return;
    const c: Cruise = { id: nextCruise, ship: addShip.trim(), captain: "TBD", dest: addDest.trim(), month: "Oct", price: 999, seats: 6 };
    setCruises((cs) => [...cs, c]);
    setNextCruise((n) => n + 1);
    log(`INSERT INTO cruises (id, ship, destination, seats_available) VALUES (${c.id}, '${c.ship}', '${c.dest}', 6);`);
    setAddShip("");
    setAddDest("");
    setScreen("menu");
  }

  function book() {
    const c = cruises.find((x) => x.id === selCruise);
    if (!c || !pname.trim() || c.seats <= 0) return;
    const rid = `R-${nextRes}`;
    setNextRes((n) => n + 1);
    setReservations((r) => [...r, { id: rid, cruiseId: c.id, name: pname.trim() }]);
    setCruises((cs) => cs.map((x) => (x.id === c.id ? { ...x, seats: x.seats - 1 } : x)));
    log(`INSERT INTO reservations VALUES ('${rid}', ${c.id}, '${pname.trim()}');`);
    log(`UPDATE cruises SET seats_available = seats_available - 1 WHERE id = ${c.id};`);
    setPname("");
    setSelCruise(null);
    setScreen("passengers");
  }

  function cancel(r: Reservation) {
    setReservations((rs) => rs.filter((x) => x.id !== r.id));
    setCruises((cs) => cs.map((x) => (x.id === r.cruiseId ? { ...x, seats: x.seats + 1 } : x)));
    log(`DELETE FROM reservations WHERE id = '${r.id}';`);
  }

  function fileRepair() {
    if (!repairText.trim()) return;
    setRepairs((r) => [...r, repairText.trim() + " (open)"]);
    log(`INSERT INTO repairs (note, status) VALUES ('${repairText.trim().slice(0, 40)}', 'open');`);
    setRepairText("");
  }

  const swing = { fontFamily: "'Trebuchet MS', Verdana, sans-serif", color: "#1c1b1a" };
  const th = "pb-1 pr-3 text-left text-[10px] font-extrabold uppercase text-[#6e6e73]";
  const input = "border border-[#9aa7b5] bg-white px-2 py-1 text-sm focus:outline-none";

  return (
    <div className="flex min-h-0 flex-1 flex-col font-mono text-[13px]">
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[3fr_2fr]">
        {/* the Swing window */}
        <div className="relative self-start border border-[#b5b5b5] bg-[#ececec] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.35)]" style={swing}>
          {screen !== "menu" && (
            <button
              onClick={() => open("menu")}
              aria-label="Back to menu"
              className="absolute left-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#9e9e9e] font-bold text-white hover:bg-[#7e7e7e]"
            >
              ‹
            </button>
          )}

          {screen === "menu" && (
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "Verdana, sans-serif" }}>
                Ship Management System
              </h2>
              <div className="mt-6 flex flex-col items-center gap-2.5 pb-4">
                {MENU.map((m) => (
                  <JButton key={m.key} onClick={() => open(m.key)}>
                    {m.label}
                  </JButton>
                ))}
              </div>
            </div>
          )}

          {screen === "add" && (
            <div className="mx-auto max-w-sm pt-6 text-center">
              <h3 className="text-xl font-extrabold">Add Data</h3>
              <div className="mt-4 flex flex-col gap-2.5 text-left text-sm">
                <label className="font-bold">Ship name
                  <input value={addShip} onChange={(e) => setAddShip(e.target.value)} className={`mt-1 block w-full ${input}`} placeholder="MS Example" />
                </label>
                <label className="font-bold">Destination
                  <input value={addDest} onChange={(e) => setAddDest(e.target.value)} className={`mt-1 block w-full ${input}`} placeholder="Baltic" />
                </label>
              </div>
              <div className="mt-4"><JButton onClick={addData}>Insert Record</JButton></div>
            </div>
          )}

          {screen === "book" && (
            <div className="pt-6">
              <h3 className="text-center text-xl font-extrabold">Book a Cruise</h3>
              <table className="mx-auto mt-3 text-sm">
                <thead><tr><th className={th}></th><th className={th}>ship</th><th className={th}>route</th><th className={th}>price</th><th className={th}>seats</th></tr></thead>
                <tbody>
                  {cruises.filter((c) => c.seats > 0).map((c) => (
                    <tr key={c.id} onClick={() => setSelCruise(c.id)} className="cursor-pointer hover:bg-white">
                      <td className="py-1 pr-2"><input type="radio" readOnly checked={selCruise === c.id} /></td>
                      <td className="py-1 pr-3 font-bold">{c.ship}</td>
                      <td className="py-1 pr-3">{c.dest} · {c.month}</td>
                      <td className="py-1 pr-3">${c.price}</td>
                      <td className="py-1">{c.seats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-center gap-2">
                <input value={pname} onChange={(e) => setPname(e.target.value)} placeholder="Passenger name" aria-label="Passenger name" className={input} />
                <JButton wide={false} onClick={book}>Book</JButton>
              </div>
            </div>
          )}

          {screen === "seats" && (
            <div className="pt-6">
              <h3 className="text-center text-xl font-extrabold">Available Seats</h3>
              <table className="mx-auto mt-3 text-sm">
                <thead><tr><th className={th}>ship</th><th className={th}>destination</th><th className={th}>seats</th></tr></thead>
                <tbody>
                  {cruises.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1 pr-4 font-bold">{c.ship}</td>
                      <td className="py-1 pr-4">{c.dest} · {c.month}</td>
                      <td className={`py-1 font-bold ${c.seats === 0 ? "text-[#b06a5d]" : ""}`}>{c.seats === 0 ? "FULL" : c.seats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {screen === "repairs" && (
            <div className="mx-auto max-w-md pt-6">
              <h3 className="text-center text-xl font-extrabold">Repairs Info</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {repairs.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              <div className="mt-3 flex gap-2">
                <input value={repairText} onChange={(e) => setRepairText(e.target.value)} placeholder="New repair note" aria-label="Repair note" className={`w-full ${input}`} />
                <JButton wide={false} onClick={fileRepair}>File</JButton>
              </div>
            </div>
          )}

          {screen === "passengers" && (
            <div className="mx-auto max-w-md pt-6">
              <h3 className="text-center text-xl font-extrabold">Passengers Info</h3>
              {reservations.length === 0 && <p className="mt-3 text-center text-sm text-[#6e6e73]">No reservations on file.</p>}
              <ul className="mt-3 space-y-1.5 text-sm">
                {reservations.map((r) => {
                  const c = cruises.find((x) => x.id === r.cruiseId)!;
                  return (
                    <li key={r.id} className="flex items-center justify-between border border-[#c9c9c9] bg-white px-2.5 py-1.5">
                      <span><strong>{r.id}</strong> · {r.name} · {c.ship} → {c.dest}</span>
                      <button onClick={() => cancel(r)} className="cursor-pointer font-bold text-[#b06a5d] underline">cancel</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {screen === "view" && (
            <div className="pt-6 text-xs">
              <h3 className="text-center text-xl font-extrabold">View Data</h3>
              <pre className="mt-3 max-h-56 overflow-auto border border-[#c9c9c9] bg-white p-3 leading-relaxed">
{`cruises (${cruises.length})
${cruises.map((c) => `  ${c.id}  ${c.ship.padEnd(14)} ${c.dest.padEnd(14)} capt ${c.captain.padEnd(10)} $${c.price}  seats:${c.seats}`).join("\n")}

reservations (${reservations.length})
${reservations.map((r) => `  ${r.id}  cruise:${r.cruiseId}  ${r.name}`).join("\n") || "  (none)"}

repairs (${repairs.length})
${repairs.map((r) => `  • ${r}`).join("\n")}`}
              </pre>
            </div>
          )}

          {screen === "quit" && (
            <div className="flex flex-col items-center gap-4 py-14">
              <p className="text-lg font-extrabold">System exited. Goodbye! 👋</p>
              <JButton onClick={() => open("menu")}>Restart</JButton>
            </div>
          )}
        </div>

        {/* SQL log */}
        <div className="self-start rounded-md border border-pane-edge bg-black/25 p-3">
          <p className="text-[10px] uppercase tracking-widest text-pane-dim">postgres query log</p>
          <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
            {sql.map((q, i) => (
              <p key={i} className={i === sql.length - 1 ? "text-moss" : "text-pane-dim"}>{q}</p>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-pane-dim">
            A recreation of the real Java Swing GUI — same menu, same flows — over the normalized
            PostgreSQL schema it ran on. Every action shows the query it would execute.
          </p>
        </div>
      </div>
    </div>
  );
}
