import { parseAny, parseCSV, sniffDelimiter } from "./parse";
import { profile } from "./profile";
import { SAMPLES } from "./samples";

let fails = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`  FAIL ${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
  else console.log(`  ok   ${label} = ${JSON.stringify(got)}`);
}

for (const s of SAMPLES) {
  const text = s.text();
  const t = parseAny(text);
  const r = profile(t, 1);
  console.log(`\n=== ${s.label} (${r.rowCount} rows x ${r.colCount} cols) ===`);
  for (const c of r.columns) {
    console.log(`  ${c.name.padEnd(16)} ${c.type.padEnd(9)} ${(c.format ?? "").padEnd(14)} nulls=${c.nullPct.toFixed(1)}% distinct=${c.distinct}${c.isKey ? " KEY" : ""}${c.pii ? " PII:" + c.pii : ""}${c.outliers ? " outliers=" + c.outliers : ""}`);
  }
  console.log(`  dupRows=${r.dupRows}  findings=${r.findings.length}`);
  console.log(r.findings.slice(0, 4).map((f) => `   - [${f.level}] ${f.column ?? ""} ${f.text}`).join("\n"));
}

console.log("\n=== orders assertions ===");
{
  const r = profile(parseAny(SAMPLES[0].text()), 1);
  const by = Object.fromEntries(r.columns.map((c) => [c.name, c]));
  eq("order_id type", by.order_id.type, "integer");
  eq("created_at type", by.created_at.type, "datetime");
  eq("created_at format", by.created_at.format, "ISO-8601");
  eq("email pii", by.customer_email.pii, "email");
  eq("amount type", by.amount.type, "decimal");
  eq("amount format", by.amount.format, "currency");
  eq("region type", by.region.type, "category");
  eq("refunded type", by.refunded.type, "boolean");
  eq("coupon nulls>25%", by.coupon_code.nullPct > 25, true);
  eq("dupRows", r.dupRows, 6);
  eq("amount has outliers", (by.amount.outliers ?? 0) > 0, true);
  eq("order_id not a key (dupes)", by.order_id.isKey, false);
}

console.log("\n=== sensors assertions ===");
{
  const r = profile(parseAny(SAMPLES[1].text()), 1);
  const by = Object.fromEntries(r.columns.map((c) => [c.name, c]));
  eq("reading_ts type", by.reading_ts.type, "datetime");
  eq("reading_ts format", by.reading_ts.format, "epoch seconds");
  eq("temp_c type", by.temp_c.type, "decimal");
  eq("humidity format", by.humidity.format, "percent");
  eq("battery_pct type", by.battery_pct.type, "decimal");
  eq("status type", by.status.type, "category");
  eq("status has nulls", by.status.nulls > 0, true);
}

console.log("\n=== habits assertions ===");
{
  const r = profile(parseAny(SAMPLES[2].text()), 1);
  const by = Object.fromEntries(r.columns.map((c) => [c.name, c]));
  eq("log_date type", by.log_date.type, "datetime");
  eq("habit type", by.habit.type, "category");
  eq("completed type", by.completed.type, "boolean");
  eq("streak_days type", by.streak_days.type, "integer");
  eq("minutes has nulls", by.minutes.nulls > 0, true);
}

console.log("\n=== parser edge cases ===");
{
  const t = parseCSV('a,b,c\n1,"hello, world","line\nbreak"\n2,"say ""hi""",x\n');
  eq("cols", t.columns, ["a", "b", "c"]);
  eq("quoted comma", t.rows[0][1], "hello, world");
  eq("embedded newline", t.rows[0][2], "line\nbreak");
  eq("escaped quote", t.rows[1][1], 'say "hi"');
  eq("rowcount", t.rows.length, 2);

  eq("tab sniff", sniffDelimiter("a\tb\tc\n1\t2\t3\n4\t5\t6"), "\t");
  eq("semicolon sniff", sniffDelimiter("a;b;c\n1;2;3\n4;5;6"), ";");
  eq("prose commas do not beat pipe", sniffDelimiter("name|desc\nx|a, b, c and d\ny|e, f, g and h"), "|");

  const ragged = parseCSV("a,b,c\n1,2\n3,4,5,6\n");
  eq("ragged padded", ragged.rows[0], ["1", "2", null]);
  eq("ragged truncated to header width", ragged.rows[1].length, 3);

  const dup = parseCSV("id,id,name\n1,2,x");
  eq("dup header renamed", dup.columns, ["id", "id_2", "name"]);

  const nulls = parseCSV("a,b\nN/A,-\nnull,3");
  eq("null tokens", nulls.rows[0], [null, null]);

  const j = parseAny('[{"a":1,"b":{"c":"x"}},{"a":2,"b":{"c":"y"},"d":true}]');
  eq("json flattened cols", j.columns, ["a", "b.c", "d"]);
  eq("json missing -> null", j.rows[0][2], null);
  eq("json format", j.format, "json");

  const nd = parseAny('{"a":1}\n{"a":2}\n{"a":3}');
  eq("ndjson rows", nd.rows.length, 3);
  eq("ndjson format", nd.format, "ndjson");

  // an id column must not be read as a timestamp
  const ids = profile(parseCSV("id\n" + Array.from({ length: 30 }, (_, i) => 1234567890123 + i).join("\n")), 1);
  eq("13-digit ids in epoch range are datetime", ids.columns[0].type, "datetime");
  const smallIds = profile(parseCSV("id\n" + Array.from({ length: 30 }, (_, i) => 100000 + i).join("\n")), 1);
  eq("plain ids stay integer", smallIds.columns[0].type, "integer");

  // Luhn: real card vs random 16 digits
  const cards = profile(parseCSV("pan\n4111111111111111\n4012888888881881\n5555555555554444"), 1);
  eq("luhn-valid -> card pii", cards.columns[0].pii, "card");
  const notCards = profile(parseCSV("ref\n4111111111111112\n4012888888881882\n5555555555554443"), 1);
  eq("luhn-invalid -> no card pii", notCards.columns[0].pii, undefined);
}

console.log(fails ? `\n${fails} FAILURE(S)` : "\nall assertions passed");

console.log("\n=== phone rule ===");
{
  const good = profile(parseCSV("phone\n(415) 555-0142\n212-555-9981\n+44 20 7946 0958\n415.555.0199"), 1);
  eq("punctuated phones -> phone pii", good.columns[0].pii, "phone");
  const dates = profile(parseCSV("d\n2026-03-01\n2026-03-02\n2026-03-03"), 1);
  eq("iso dates -> no pii", dates.columns[0].pii, undefined);
  const epochs = profile(parseCSV("t\n1748736000\n1748736600\n1748737200"), 1);
  eq("epochs -> no pii", epochs.columns[0].pii, undefined);
}
console.log(fails ? `${fails} FAILURE(S)` : "phone rule ok");
