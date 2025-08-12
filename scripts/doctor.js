// scripts/doctor.js
/* Usage:
 *  node scripts/doctor.js           -> chỉ báo cáo
 *  node scripts/doctor.js --fix     -> báo cáo + move file lỗi sang src/commands/__disabled__/
 */
const fs = require("fs");
const path = require("path");

const FIX = process.argv.includes("--fix");
const ROOT = path.resolve(__dirname, "..");
const CMDS = path.join(ROOT, "src", "commands");
const DISABLED_ROOT = path.join(ROOT, "src", "commands", "__disabled__");

function* walk(dir) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of list) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "__disabled__") continue;
      yield* walk(full);
    } else if (ent.isFile() && ent.name.endsWith(".js")) {
      yield full;
    }
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function moveToDisabled(file) {
  const rel = path.relative(CMDS, file);
  const dest = path.join(DISABLED_ROOT, rel);
  ensureDir(path.dirname(dest));
  fs.renameSync(file, dest);
  return dest;
}

function fmt(s, color = 37) {
  return `\x1b[${color}m${s}\x1b[0m`;
}
const green = (s) => fmt(s, 32);
const red = (s) => fmt(s, 31);
const yellow = (s) => fmt(s, 33);
const cyan = (s) => fmt(s, 36);

const results = [];
for (const file of walk(CMDS)) {
  let mod, err;
  try {
    delete require.cache[require.resolve(file)];
    mod = require(file);
  } catch (e) {
    err = e;
  }
  if (err) {
    results.push({ file, ok: false, reason: `Require error: ${err.message}` });
    continue;
  }
  const hasData = !!(mod && mod.data && typeof mod.data.name === "string");
  const hasExec = !!(mod && typeof mod.execute === "function");
  if (!hasData || !hasExec) {
    results.push({
      file,
      ok: false,
      reason: `Missing ${!hasData ? "data" : ""}${!hasData && !hasExec ? " & " : ""}${!hasExec ? "execute" : ""}`,
    });
  } else {
    results.push({ file, ok: true, reason: "OK" });
  }
}

let ok = 0,
  bad = 0;
for (const r of results) {
  r.ok ? ok++ : bad++;
}

console.log(cyan(`\n[doctor] Scanned commands under ${CMDS}`));
for (const r of results) {
  const label = r.ok ? green("OK ") : red("BAD");
  console.log(
    `${label}  ${path.relative(ROOT, r.file)}  ${r.ok ? "" : yellow("=> " + r.reason)}`,
  );
}

console.log(cyan(`\n[doctor] Summary: ${ok} OK, ${bad} BAD`));

if (FIX && bad) {
  console.log(
    yellow(`\n[doctor] --fix enabled: moving BAD files to __disabled__ ...`),
  );
  ensureDir(DISABLED_ROOT);
  for (const r of results.filter((x) => !x.ok)) {
    const dest = moveToDisabled(r.file);
    console.log(
      yellow(
        `  moved  ${path.relative(ROOT, r.file)}  ->  ${path.relative(ROOT, dest)}`,
      ),
    );
  }
  console.log(green(`\n[doctor] Done. BAD commands have been disabled.`));
}
