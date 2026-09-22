// Run while Strapi is stopped. Password input is not echoed or put in shell history.
const path=require('node:path');
const readline=require('node:readline/promises');
process.chdir(path.resolve(__dirname,'../backend'));
async function secret(prompt){process.stdout.write(prompt);return new Promise(resolve=>{let value='';process.stdin.setRawMode(true);process.stdin.resume();const listen=chunk=>{for(const c of chunk.toString()){if(c==='\r'||c==='\n'){process.stdin.removeListener('data',listen);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value);return}if(c==='\u0003')process.exit(1);if(c==='\u007f'||c==='\b')value=value.slice(0,-1);else value+=c}};process.stdin.on('data',listen)})}
(async()=>{
  if(!process.stdin.isTTY)throw new Error('Run this account command in an interactive terminal.');
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  const email=(await rl.question('Editor email: ')).trim().toLowerCase();rl.close();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email.');
  const password=await secret('New password (14+ characters, hidden): ');
  if(password.length<14||password.length>256)throw new Error('Use 14–256 characters.');
  const {createStrapi}=require('../backend/node_modules/@strapi/strapi');
  const strapi=await createStrapi({appDir:process.cwd(),distDir:process.cwd()}).load();
  try{const role=await strapi.db.query('plugin::users-permissions.role').findOne({where:{type:'site-editor'}});const user=await strapi.db.query('plugin::users-permissions.user').findOne({where:{email}});const service=strapi.plugin('users-permissions').service('user');if(user)await service.edit(user.id,{password,blocked:false,confirmed:true,role:role.id});else await service.add({username:email,email,password,provider:'local',confirmed:true,blocked:false,role:role.id});console.log('Editor account saved. You can now start Strapi and sign in.');}finally{await strapi.destroy()}
})().catch(error=>{console.error(error.message);process.exit(1)});
