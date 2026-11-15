import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

execFileSync(process.execPath, [new URL('cloudflare-build.mjs', import.meta.url).pathname], {stdio: 'inherit'});
const root = new URL('../', import.meta.url);
const bundle = fs.readFileSync(new URL('dist/server/cloudflare.js', root), 'utf8');
if (!bundle.includes('export default {')) throw new Error('Worker export missing');
const handler = bundle.replace('export default {', 'const radarWorker = {') + `
export default async function handler(request) {
  return radarWorker.fetch(request, process.env);
}
export const config = {path: '/api/*'};
`;
fs.mkdirSync(new URL('dist/functions/', root), {recursive: true});
fs.writeFileSync(new URL('dist/functions/api.mjs', root), handler);
console.log('Built Netlify website and event API function.');
