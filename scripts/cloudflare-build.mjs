import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
execFileSync(process.execPath, [new URL('build.mjs', import.meta.url).pathname], {stdio: 'inherit'});
const bundled = fs.readFileSync(new URL('dist/server/index.js', root), 'utf8');
const assetDeclaration = /^const ASSETS=.*;\n/m;
const assetLookup = "const asset=ASSETS[u.pathname==='/'?'/index.html':u.pathname];";
if (!assetDeclaration.test(bundled) || !bundled.includes(assetLookup)) {
  throw new Error('Unexpected Worker build structure. Deployment stopped.');
}
const edge = bundled.replace(assetDeclaration, 'const ASSETS={};\n')
  .replace(assetLookup, 'if(env.STATIC)return env.STATIC.fetch(request);'+assetLookup);
fs.writeFileSync(new URL('dist/server/cloudflare.js', root), edge);
fs.cpSync(new URL('public/', root), new URL('dist/public/', root), {recursive: true});
console.log('Built Cloudflare Worker with separately hosted static assets.');
