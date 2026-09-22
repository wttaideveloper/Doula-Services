import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../backend/package.json',import.meta.url))('sharp');
const origin='http://localhost:3000';
const env=Object.fromEntries(fs.readFileSync('backend/.env','utf8').split(/\r?\n/).filter(Boolean).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)]}));
let cookie='';
async function api(path,method='GET',body,authorized=true){const r=await fetch(origin+'/api/'+path,{method,headers:{origin,...(authorized&&cookie?{cookie}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});const data=await r.json();return {status:r.status,data,headers:r.headers}}
const live=async()=>{const r=await fetch('http://127.0.0.1:1337/api/website/live');assert.equal(r.status,200);return r.json()};
assert.equal((await api('cms/content')).status,401);
for(const path of ['editor','media','inquiries'])assert.ok([401,403].includes((await fetch('http://127.0.0.1:1337/api/website/'+path)).status));
const initialLive=await live();assert.deepEqual(Object.keys(initialLive).sort(),['content','publishedOn']);
const login=await api('cms/login','POST',{email:env.EDITOR_EMAIL,password:env.EDITOR_PASSWORD});assert.equal(login.status,200,JSON.stringify(login.data));cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/i);
const initial=(await api('cms/content')).data;assert.ok(initial.content);
let changed=false;
try{
  const draft=structuredClone(initial.content);draft.home.hero.eyebrow='CMS smoke test — private draft';
  let saved=await api('cms/draft','PUT',{content:draft,revision:initial.revision});assert.equal(saved.status,200,JSON.stringify(saved.data));changed=true;
  assert.deepEqual((await live()).content,initialLive.content,'Saving a draft must not alter published content');
  assert.equal((await api('cms/draft','PUT',{content:draft,revision:initial.revision})).status,409);
  const unsafe=structuredClone(draft);unsafe.brand.contactButton.href='javascript:alert(1)';assert.equal((await api('cms/draft','PUT',{content:unsafe,revision:saved.data.revision})).status,400);
  assert.equal((await api('cms/publish','POST',{revision:saved.data.revision})).status,200);
  assert.equal((await live()).content.home.hero.eyebrow,draft.home.hero.eyebrow);
  const bad=new FormData();bad.set('file',new Blob(['<svg></svg>'],{type:'image/svg+xml'}),'invalid.svg');assert.equal((await api('cms/media','POST',bad)).status,400);
  const good=new FormData();good.set('file',new Blob([await sharp({create:{width:32,height:32,channels:3,background:'#819078'}}).png().toBuffer()],{type:'image/png'}),'smoke-test.png');
  const uploaded=await api('cms/media','POST',good);assert.equal(uploaded.status,200,JSON.stringify(uploaded.data));const media=await fetch(origin+uploaded.data.url.replace('/uploads/','/api/media/'));assert.equal(media.status,200);assert.match(media.headers.get('content-type'),/image/);
  const inquiry=await api('contact','POST',{name:'CMS verification',email:'test@example.invalid',message:'Local integration test. No response required.'});assert.equal(inquiry.status,200,JSON.stringify(inquiry.data));assert.ok((await api('cms/inquiries')).data.items.some(i=>i.email==='test@example.invalid'));
  const cross=await fetch(origin+'/api/cms/publish',{method:'POST',headers:{origin:'https://untrusted.example',cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(cross.status,403);
  console.log('PASS: authentication, private drafts, publishing, stale edit protection, URL validation, upload validation, media delivery, inquiry inbox, origin checks.');
}finally{
  if(changed){let state=(await api('cms/content')).data;state=(await api('cms/draft','PUT',{content:initialLive.content,revision:state.revision})).data;assert.equal((await api('cms/publish','POST',{revision:state.revision})).status,200);if(JSON.stringify(initial.content)!==JSON.stringify(initialLive.content)){state=(await api('cms/content')).data;assert.equal((await api('cms/draft','PUT',{content:initial.content,revision:state.revision})).status,200)}assert.deepEqual((await live()).content,initialLive.content);console.log('Original website content restored.');}
}

