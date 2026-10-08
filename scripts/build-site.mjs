#!/usr/bin/env node
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const defaultSrc =
  process.env.CAPTURE_SRC ||
  path.join(process.env.TEMP || "/tmp", "athena-exact-replica-ref");
const outRoot = path.join(repoRoot, "site");

const REBRAND = [
  [/athenaNet Sign-On/gi, "Disconnected Application Sign-On"],
  [/athenaOne/g, "Disconnected Application"],
  [/athenahealth/gi, "Disconnected Application"],
  [/athenaCollector/gi, "Disconnected Application"],
  [/Valley Health System Gateway/gi, "Disconnected Application Gateway"],
  [/Valley Health System/gi, "Disconnected Application"],
  [/Valley User Name/gi, "User Name"],
  [/Valley Password/gi, "Password"],
  [/Valley Medical Group/gi, "Disconnected Application"],
  [/NJ\s*-\s*Valley Medical Group/gi, "Disconnected Application"],
  [/Demo Health/gi, "Disconnected Application"],
  [/UserAdmin Demo/gi, "Disconnected Application"],
];

const PAGE_SLUGS = {
  "Extension/Login Valley Health System Gateway.html": "gateway/login.html",
  "Extension/department athenaOne.html": "app/department.html",
  "Extension/find user.html": "app/find-user.html",
  "Extension/find user all users.html": "app/find-user-all.html",
  "Extension/create user.html": "app/create-user-profile.html",
  "Extension/create user security.html": "app/create-user-security.html",
  "Extension/create user 2.html": "app/create-user-roles.html",
  "Extension/update roles read only.html": "app/update-user-roles-readonly.html",
  "Extension/roles edit.html": "app/roles-edit.html",
  "user to department.html": "app/user-to-department.html",
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) rimraf(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

function rebrandText(text) {
  let out = text;
  for (const [re, rep] of REBRAND) out = out.replace(re, rep);
  return out;
}

function walkFiles(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function main() {
  if (!fs.existsSync(defaultSrc)) {
    if (fs.existsSync(path.join(outRoot, "index.html"))) {
      console.log("CAPTURE_SRC missing; using committed site/.");
      process.exit(0);
    }
    console.error(`Capture source not found: ${defaultSrc}`);
    process.exit(1);
  }

  console.log("Source:", defaultSrc);
  rimraf(outRoot);
  ensureDir(outRoot);

  const hashCache = new Map();
  const assetRelByAbs = new Map();

  function assetRelFor(absPath) {
    if (assetRelByAbs.has(absPath)) return assetRelByAbs.get(absPath);
    let h = hashCache.get(absPath);
    if (!h) {
      h = crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
      hashCache.set(absPath, h);
    }
    const base = path.basename(absPath);
    const rel = path.posix.join("_assets", `${h.slice(0, 12)}_${base}`);
    const dest = path.join(outRoot, rel);
    if (!fs.existsSync(dest)) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(absPath, dest);
    }
    assetRelByAbs.set(absPath, rel);
    return rel;
  }

  function relUrl(fromOutFile, assetRel) {
    let rel = path.relative(path.dirname(fromOutFile), path.join(outRoot, assetRel));
    rel = rel.split(path.sep).join("/");
    if (!rel.startsWith(".")) rel = "./" + rel;
    return rel;
  }

  function rewriteRefs(html, srcHtmlPath, destOutPath) {
    return html.replace(
      /(\s(?:src|href)=["'])([^"']+)(["'])/gi,
      (full, pre, ref, post) => {
        if (!ref.includes("_files/") && !ref.startsWith("./")) return full;
        if (/^https?:/i.test(ref)) return full;
        const abs = path.normalize(path.join(path.dirname(srcHtmlPath), ref));
        if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return full;
        const rel = assetRelFor(abs);
        return pre + relUrl(destOutPath, rel) + post;
      }
    );
  }

  function sanitizeUrls(html) {
    return html.replace(/https?:\/\/[^\s"'<>]+/g, (url) => {
      if (/\.(css|js|png|jpe?g|gif|ico|woff2?)(\?|$)/i.test(url)) return "#";
      if (url.includes("/cgi/login")) return "./app/department.html";
      if (/valleyhealth|athenahealth|athena\.io|athenahealth\.com/i.test(url))
        return "#";
      return url;
    });
  }

  const htmlSources = walkFiles(defaultSrc).filter((f) =>
    /\.html?$/i.test(f)
  );
  const routes = {};

  for (const srcHtml of htmlSources) {
    const relKey = path.relative(defaultSrc, srcHtml).split(path.sep).join("/");
    const destRel =
      PAGE_SLUGS[relKey] ||
      path.posix.join(
        "pages",
        relKey.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase()
      );
    const destPath = path.join(outRoot, destRel);
    let html = fs.readFileSync(srcHtml, "utf8");
    html = rewriteRefs(html, srcHtml, destPath);
    html = sanitizeUrls(html);
    html = rebrandText(html);
    ensureDir(path.dirname(destPath));
    fs.writeFileSync(destPath, html, "utf8");
    routes[relKey] = destRel;
  }

  const loginPath = PAGE_SLUGS["Extension/Login Valley Health System Gateway.html"];
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${loginPath}">
<title>Disconnected Application</title>
</head>
<body>
<p><a href="${loginPath}">Disconnected Application</a></p>
<script src="./fixture-nav.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(outRoot, "index.html"), indexHtml, "utf8");

  const navJs = `// Offline navigation stubs for captured fixture pages
(function(){
  var map = ${JSON.stringify(routes, null, 2)};
  document.addEventListener('submit', function(e){
    var f = e.target;
    if (f && f.id === 'vpnForm') {
      e.preventDefault();
      window.location.href = './app/department.html';
    }
  }, true);
})();
`;
  fs.writeFileSync(path.join(outRoot, "fixture-nav.js"), navJs, "utf8");

  const legacy = path.join(repoRoot, "user-admin.html");
  if (fs.existsSync(legacy)) {
    let legacyHtml = rebrandText(fs.readFileSync(legacy, "utf8"));
    legacyHtml = legacyHtml.replace(
      /<div class="product-name">[^<]*<\/div>/,
      '<div class="product-name">Disconnected Application</div>'
    );
    fs.writeFileSync(path.join(outRoot, "user-admin.html"), legacyHtml, "utf8");
  }

  fs.writeFileSync(
    path.join(outRoot, "routes.json"),
    JSON.stringify({ login: loginPath, routes }, null, 2),
    "utf8"
  );

  const files = walkFiles(outRoot);
  const bytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);
  console.log(`Built ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB`);
}

main();
