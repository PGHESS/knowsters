#!/usr/bin/env node
/**
 * GLB auf den Knowsters-Exportvertrag normieren, ohne die Geometrie anzufassen:
 * legt einen Wurzelknoten mit Skalierung, Drehung (Yaw) und Verschiebung über die Szene, sodass
 * Bodenlinie Y = 0, Modell mittig über dem Ursprung, gewünschte Höhe, Blickrichtung +Z.
 * Gedacht für KI-Exporte (Meshy zentriert am Ursprung, beliebiger Maßstab, beliebige Ausrichtung).
 *
 *   node scripts/normalize-glb.mjs <in.glb> <out.glb> --height 0.9 [--yaw 90] [--name pyro]
 *
 * --height  Zielhöhe in Metern (Bind-Pose, Bounding-Box)
 * --yaw     Drehung um Y in Grad, damit „vorn“ auf +Z zeigt (0, 90, 180, -90 …)
 * --name    Name des neuen Wurzelknotens (Standard: knowsters_root)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseGlb, worldBounds } from './check-glb.mjs';

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
if (files.length < 2) {
  console.log('Aufruf: node scripts/normalize-glb.mjs <in.glb> <out.glb> --height 0.9 [--yaw 90] [--name pyro]');
  process.exit(2);
}
const [inFile, outFile] = files;
const height = Number(opt('height', '1'));
const yawDeg = Number(opt('yaw', '0'));
const rootName = opt('name', 'knowsters_root');

const buf = readFileSync(inFile);
const { json: g, bin } = parseGlb(buf);
const { min, max } = worldBounds(g, bin);
if (!Number.isFinite(min[1])) throw new Error('keine Geometrie gefunden');
const h = max[1] - min[1];
const s = height / h;
const yaw = (yawDeg * Math.PI) / 180;
// Zentrum der Bodenfläche im Originalraum
const c = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2];
// world = T · R · S · v  →  T = −R·(s·c)
const sc = c.map((v) => v * s);
const rx = Math.cos(yaw) * sc[0] + Math.sin(yaw) * sc[2];
const rz = -Math.sin(yaw) * sc[0] + Math.cos(yaw) * sc[2];
const t = [-rx, -sc[1], -rz];
const q = [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)];

const scene = g.scenes[g.scene ?? 0];
const root = { name: rootName, children: [...scene.nodes], translation: t, rotation: q, scale: [s, s, s] };
g.nodes.push(root);
scene.nodes = [g.nodes.length - 1];
g.asset.generator = `${g.asset.generator ?? '?'} + knowsters normalize-glb`;
g.asset.extras = { ...(g.asset.extras ?? {}), knowsters: { normalized: true, sourceHeight: +h.toFixed(4), scale: +s.toFixed(6), yawDeg, sourceFile: inFile.split(/[\\/]/).pop() } };

const raw = JSON.stringify(g);
const jsonBuf = Buffer.from(raw + ' '.repeat((4 - (raw.length % 4)) % 4));
const binPad = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
const chunk = (type, b) => {
  const hd = Buffer.alloc(8);
  hd.writeUInt32LE(b.length, 0);
  hd.writeUInt32LE(type, 4);
  return Buffer.concat([hd, b]);
};
const body = Buffer.concat([chunk(0x4e4f534a, jsonBuf), chunk(0x004e4942, binPad)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + body.length, 8);
writeFileSync(outFile, Buffer.concat([header, body]));
const nb = worldBounds(g, binPad);
console.log(`${outFile}: Höhe ${h.toFixed(3)} → ${height} m (scale ${s.toFixed(4)}), yaw ${yawDeg}°, Bounding-Box jetzt X ${nb.min[0].toFixed(2)}…${nb.max[0].toFixed(2)} · Y ${nb.min[1].toFixed(2)}…${nb.max[1].toFixed(2)} · Z ${nb.min[2].toFixed(2)}…${nb.max[2].toFixed(2)}`);
