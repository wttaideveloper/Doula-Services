const {validateContent} = require('../../../../../content/validate.cjs');
const sharp = require('sharp');
const crypto = require('node:crypto');
const uid='api::website.website';
const attempts = new Map();
function limited(ip) {
  const now=Date.now();
  for(const [key,v] of attempts) if(v.until<now) attempts.delete(key);
  if(attempts.size>=10000&&!attempts.has(ip))return true;
  const value=attempts.get(ip)||{count:0,until:now+3600000};
  value.count++;attempts.set(ip,value);return value.count>5;
}
function normalize(content) {
  if(!content||typeof content!=='object')return content;
  return {...content,pages:Array.isArray(content.pages)?content.pages:[],brand:{...content.brand,theme:content.brand?.theme||'lavender-sage'}};
}
function output(row) {return {content:normalize(row.draft),revision:row.revision,liveRevision:row.liveRevision,publishedOn:row.publishedOn,hasUnpublishedChanges:JSON.stringify(row.draft)!==JSON.stringify(row.live)};}
module.exports = {
  async live(ctx) {
    const row=await strapi.db.query(uid).findOne({});
    ctx.set('Cache-Control','no-store');ctx.body={content:normalize(row.live),publishedOn:row.publishedOn};
  },
  async editor(ctx) {const row=await strapi.db.query(uid).findOne({});ctx.set('Cache-Control','no-store');ctx.body={...output(row),user:{name:ctx.state.user.username,email:ctx.state.user.email}};},
  async save(ctx) {
    const {content,revision}=ctx.request.body||{};
    const errors=validateContent(content);if(errors.length)return ctx.badRequest(errors.join('\n'));
    if(!Number.isInteger(revision))return ctx.badRequest('Missing revision');
    const result=await strapi.db.query(uid).updateMany({where:{revision},data:{draft:content,revision:revision+1}});
    if(!result.count){ctx.status=409;ctx.body={error:{message:'Someone saved a newer draft. Reload before saving your changes.'}};return;}
    ctx.body=output(await strapi.db.query(uid).findOne({}));
  },
  async publish(ctx) {
    const {revision}=ctx.request.body||{};
    const row=await strapi.db.query(uid).findOne({});
    if(revision!==row.revision){ctx.status=409;ctx.body={error:{message:'The draft changed. Reload before publishing.'}};return;}
    const errors=validateContent(row.draft);if(errors.length)return ctx.badRequest(errors.join('\n'));
    const result=await strapi.db.query(uid).updateMany({where:{revision},data:{live:row.draft,liveRevision:revision,revision:revision+1,publishedOn:new Date().toISOString()}});
    if(!result.count){ctx.status=409;ctx.body={error:{message:'The draft changed. Reload before publishing.'}};return;}
    // liveRevision tracks the revision of the published snapshot; publishing increments the edit revision.
    ctx.body=output(await strapi.db.query(uid).findOne({}));
  },
  async media(ctx) {
    const files=await strapi.db.query('plugin::upload.file').findMany({where:{mime:{$startsWith:'image/'}},orderBy:{createdAt:'desc'},limit:200});
    ctx.body={items:files.map(f=>({id:f.id,name:f.name,url:f.url,width:f.width,height:f.height,alternativeText:f.alternativeText||''}))};
  },
  async upload(ctx) {
    const file=ctx.request.files?.file;
    if(!file||Array.isArray(file))return ctx.badRequest('Choose one image');
    if(file.size>8*1024*1024)return ctx.badRequest('Images must be smaller than 8 MB');
    let metadata;
    try {metadata=await sharp(file.filepath,{limitInputPixels:40000000}).metadata();} catch {return ctx.badRequest('This file is not a supported image');}
    if(!['jpeg','png','webp'].includes(metadata.format))return ctx.badRequest('Use a JPG, PNG or WebP image');
    file.originalFilename=`image-${crypto.randomUUID()}.${metadata.format==='jpeg'?'jpg':metadata.format}`;
    file.mimetype=`image/${metadata.format}`;
    const files=await strapi.plugin('upload').service('upload').upload({data:{fileInfo:{name:file.originalFilename}},files:file});
    const f=files[0];ctx.body={id:f.id,name:f.name,url:f.url,width:f.width,height:f.height};
  },
  async inquiries(ctx) {
    ctx.body={items:await strapi.db.query('api::inquiry.inquiry').findMany({select:['id','name','email','dueDate','service','message','createdAt'],orderBy:{createdAt:'desc'},limit:100})};
  },
  async inquire(ctx) {
    const {name,email,dueDate='',service='',message,website=''}=ctx.request.body||{};
    if(website){ctx.body={ok:true};return;}
    if(typeof name!=='string'||!name.trim()||name.length>150||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof message!=='string'||!message.trim()||message.length>5000||typeof service!=='string'||service.length>200||typeof dueDate!=='string'||(dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)))return ctx.badRequest('Please check your name, email and message.');
    const sender=crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    if(limited(sender)){ctx.status=429;ctx.body={error:{message:'Please wait before sending another message.'}};return;}
    await strapi.db.query('api::inquiry.inquiry').create({data:{name:name.trim(),email:email.trim(),dueDate,service,message:message.trim()}});ctx.body={ok:true};
  }
};
