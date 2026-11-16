// @ts-nocheck -- binary parsing with indexed access; validated at runtime
import JSZip from "jszip";
import forge from "node-forge";
import { log } from "./store";

const STORE_RE = /(^resources\.arsc$|\.so$|\.png$|\.jpg$|\.ogg$|\.mp3$|\.webp$)/i;

async function sha256b64(data: Uint8Array | string) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const h = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  let s = "";
  new Uint8Array(h).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

/** JAR manifest lines are limited to 72 bytes; continuation lines start with a space. */
function wrap(line: string) {
  if (line.length <= 70) return line + "\r\n";
  let out = line.slice(0, 70) + "\r\n";
  let rest = line.slice(70);
  while (rest.length) {
    out += " " + rest.slice(0, 69) + "\r\n";
    rest = rest.slice(69);
  }
  return out;
}

/** Read the package name out of a binary AndroidManifest.xml (best effort). */
export async function readPackageName(zip: JSZip): Promise<string | null> {
  const f = zip.file("AndroidManifest.xml");
  if (!f) return null;
  const buf = await f.async("uint8array");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  try {
    // string pool chunk starts at offset 8
    const count = dv.getUint32(8 + 8, true);
    const flags = dv.getUint32(8 + 16, true);
    const stringsStart = dv.getUint32(8 + 20, true);
    const utf8 = (flags & 0x100) !== 0;
    const strs: string[] = [];
    for (let i = 0; i < Math.min(count, 400); i++) {
      const off = 8 + stringsStart + dv.getUint32(8 + 28 + i * 4, true);
      if (utf8) {
        let p = off;
        let n = buf[p]; p += n & 0x80 ? 2 : 1;
        n = buf[p]; let len = n; p++;
        if (n & 0x80) { len = ((n & 0x7f) << 8) | buf[p]; p++; }
        strs.push(new TextDecoder().decode(buf.slice(p, p + len)));
      } else {
        const len = dv.getUint16(off, true);
        let s = "";
        for (let j = 0; j < len; j++) s += String.fromCharCode(dv.getUint16(off + 2 + j * 2, true));
        strs.push(s);
      }
    }
    return strs.find((s) => /^[a-z][\w]*(\.[a-z_][\w]*){1,}$/i.test(s) && !s.startsWith("android.")) ?? null;
  } catch {
    return null;
  }
}

export async function decompile(file: File) {
  log.step(`Loading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  const zip = await JSZip.loadAsync(file);
  const names = Object.keys(zip.files);
  log.ok(`Opened archive: ${names.length} entries`);
  const dex = names.filter((n) => /^classes\d*\.dex$/.test(n));
  const libs = names.filter((n) => n.startsWith("lib/") && n.endsWith(".so"));
  const abis = [...new Set(libs.map((n) => n.split("/")[1]))];
  log.info(`DEX files: ${dex.join(", ") || "none"}`);
  log.info(`Native libs: ${libs.length} across ABIs [${abis.join(", ") || "none"}]`);
  log.info(`Assets: ${names.filter((n) => n.startsWith("assets/")).length} files`);
  if (names.some((n) => n.includes("libil2cpp.so"))) log.ok("Unity IL2CPP game detected (libil2cpp.so + global-metadata.dat)");
  else if (names.some((n) => n.includes("Assembly-CSharp.dll"))) log.ok("Unity Mono game detected (Assembly-CSharp.dll)");
  const pkg = await readPackageName(zip);
  log.info(`Package: ${pkg ?? "unknown"}`);
  const oldSig = names.filter((n) => /^META-INF\/.*\.(SF|RSA|DSA|EC|MF)$/i.test(n));
  log.info(`Existing signature files: ${oldSig.length}`);
  log.ok("Decompile finished — files are ready to edit in the workspace");
  return { zip, pkg };
}

export async function signAndBuild(zip: JSZip, opts: { cn?: string } = {}) {
  log.step("Removing old signature (META-INF/*.SF, *.RSA, *.MF)");
  Object.keys(zip.files)
    .filter((n) => /^META-INF\/(.*\.(SF|RSA|DSA|EC)|MANIFEST\.MF)$/i.test(n))
    .forEach((n) => zip.remove(n));

  const entries = Object.values(zip.files).filter((f) => !f.dir).sort((a, b) => a.name.localeCompare(b.name));
  log.step(`Hashing ${entries.length} files with SHA-256`);
  let manifest = "Manifest-Version: 1.0\r\nCreated-By: 1.0 (mestro_ac)\r\n\r\n";
  let sf = "";
  const sections: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const d = await sha256b64(await e.async("uint8array"));
    const sec = wrap(`Name: ${e.name}`) + wrap(`SHA-256-Digest: ${d}`) + "\r\n";
    sections.push(sec);
    manifest += sec;
    if (i % 200 === 0 && i) log.info(`  hashed ${i}/${entries.length}`);
  }
  log.ok("MANIFEST.MF written");
  for (let i = 0; i < entries.length; i++) {
    sf += wrap(`Name: ${entries[i].name}`) + wrap(`SHA-256-Digest: ${await sha256b64(sections[i])}`) + "\r\n";
  }
  sf =
    "Signature-Version: 1.0\r\n" +
    wrap(`SHA-256-Digest-Manifest: ${await sha256b64(manifest)}`) +
    "Created-By: 1.0 (mestro_ac)\r\n\r\n" + sf;
  log.ok("CERT.SF written");

  log.step("Generating 2048-bit RSA signing key + self-signed certificate");
  const keys = await new Promise<forge.pki.rsa.KeyPair>((res, rej) =>
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, kp) => (err ? rej(err) : res(kp))),
  );
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01" + forge.util.bytesToHex(forge.random.getBytesSync(8));
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 30);
  const attrs = [{ name: "commonName", value: opts.cn || "mestro_ac" }, { name: "organizationName", value: "mestro_ac" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  log.ok("Certificate created (valid 30 years)");

  log.step("Creating PKCS#7 signature block (CERT.RSA)");
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(sf, "raw");
  p7.addCertificate(cert);
  p7.addSigner({ key: keys.privateKey, certificate: cert, digestAlgorithm: forge.pki.oids.sha256 });
  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const rsa = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) rsa[i] = der.charCodeAt(i);
  log.ok("CERT.RSA written");

  const out = new JSZip();
  out.file("META-INF/MANIFEST.MF", manifest);
  out.file("META-INF/CERT.SF", sf);
  out.file("META-INF/CERT.RSA", rsa);
  log.step("Packing APK (resources.arsc & .so stored uncompressed)");
  for (const e of entries) {
    out.file(e.name, await e.async("uint8array"), { compression: STORE_RE.test(e.name) ? "STORE" : "DEFLATE" });
  }
  const blob = await out.generateAsync({
    type: "blob",
    mimeType: "application/vnd.android.package-archive",
    compressionOptions: { level: 6 },
  });
  log.ok(`APK built & signed: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
  return blob;
}
