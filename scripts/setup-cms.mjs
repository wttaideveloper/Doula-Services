import fs from 'node:fs';
import crypto from 'node:crypto';
const secret=()=>crypto.randomBytes(32).toString('hex');
if(!fs.existsSync('backend/.env')){
  const password=crypto.randomBytes(18).toString('base64url');
  fs.writeFileSync('backend/.env',`HOST=127.0.0.1\nPORT=1337\nPUBLIC_URL=http://localhost:1337\nDATABASE_FILENAME=.tmp/data.db\nAPP_KEYS=${secret()},${secret()}\nADMIN_JWT_SECRET=${secret()}\nAPI_TOKEN_SALT=${secret()}\nTRANSFER_TOKEN_SALT=${secret()}\nENCRYPTION_KEY=${secret()}\nJWT_SECRET=${secret()}\nEDITOR_EMAIL=owner@compassion.local\nEDITOR_PASSWORD=${password}\n`);
  fs.writeFileSync('.local-admin.txt',`Website Studio: http://localhost:3000/admin\nEmail: owner@compassion.local\nPassword: ${password}\n\nLocal development credentials. Store these securely. Before production, create a dedicated editor account in Strapi and use production secrets.\n`);
  console.log('Created backend secrets and local editor credentials in .local-admin.txt.');
}else console.log('Existing backend environment preserved.');
if(!fs.existsSync('.env.local'))fs.writeFileSync('.env.local','STRAPI_URL=http://127.0.0.1:1337\nAPP_ORIGIN=http://localhost:3000\n');
