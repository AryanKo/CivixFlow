/** Dependency-free static preview: only public frontend paths are served. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const flag = process.argv.indexOf('--port');
const port = Number(flag >= 0 ? process.argv[flag + 1] : process.env.PORT || 8000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be 0-65535 (0 selects a free port)');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const server = createServer(async (request, response) => {
  try {
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path !== '/' && path !== '/index.html' && !path.startsWith('/js/') && !path.startsWith('/assets/')) throw new Error('Not public');
    const target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    const allowed = target === resolve(root, 'index.html') || ['js','assets'].some(folder => target.startsWith(resolve(root, folder) + sep));
    if (!allowed || !(await stat(target)).isFile()) throw new Error('Not public');
    const body = await readFile(target);
    response.writeHead(200, {'Content-Type':types[extname(target)] || 'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404, {'Content-Type':'text/plain'}); response.end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`CivixFlow: http://127.0.0.1:${server.address().port} (Ctrl+C to stop)`));
