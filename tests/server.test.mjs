import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { request } from 'node:http';

test('preview serves browser assets and rejects private files and traversal', {timeout:10000}, async t => {
  const child = spawn(process.execPath, ['scripts/serve.mjs','--port','0'], {cwd:new URL('..',import.meta.url), stdio:['ignore','pipe','pipe']});
  t.after(() => child.kill());
  const port = await new Promise((resolve,reject) => {
    child.on('error',reject);
    child.on('exit',code => reject(new Error(`Server exited ${code}`)));
    child.stdout.on('data',chunk => { const match=String(chunk).match(/127\.0\.0\.1:(\d+)/); if(match) resolve(Number(match[1])); });
  });
  const get = path => new Promise((resolve,reject) => {
    request({host:'127.0.0.1',port,path}, response => {
      response.resume(); response.on('end',()=>resolve({status:response.statusCode,type:response.headers['content-type']}));
    }).on('error',reject).end();
  });
  assert.equal((await get('/')).status,200);
  assert.match((await get('/js/app.js')).type,/javascript/);
  assert.equal((await get('/assets/vendor/tailwind.css')).status,200);
  for(const path of ['/.git/config','/package.json','/run.py','/assets/../.git/config','/assets/%2e%2e/run.py','/js/../../package.json']) {
    assert.equal((await get(path)).status,404,path);
  }
});
