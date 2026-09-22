// Explicit application directories keep this JavaScript Strapi backend independent
// from the Next.js TypeScript project in the parent directory.
process.chdir(__dirname);
const {createStrapi}=require('@strapi/strapi');
createStrapi({appDir:__dirname,distDir:__dirname}).start();
