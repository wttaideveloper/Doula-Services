'use strict';

const path = require('node:path');
const fs = require('node:fs');
const readline = require('node:readline');

const USER = 'plugin::users-permissions.user';

async function resetPassword(strapi, email, password) {
  if (typeof password !== 'string' || password.length < 14) throw new Error('Password must contain at least 14 characters.');
  const user = await strapi.db.query(USER).findOne({where: {email}, populate: ['role']});
  if (!user) throw new Error('No account exists for that email.');
  if (user.email.toLowerCase() !== email || user.provider !== 'local' || user.role?.type !== 'site-editor') {
    throw new Error('The account is not the expected local website editor; no password was changed.');
  }
  const updated = await strapi.plugin('users-permissions').service('user').edit(user.id, {password});
  if (!updated) throw new Error('The account no longer exists; no password was changed.');
}

function hiddenPrompt(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Run this command in an interactive terminal.');
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(label);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    function finish(error) {
      process.stdin.removeListener('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      error ? reject(error) : resolve(value);
    }
    function onKey(text, key = {}) {
      if (key.ctrl && key.name === 'c') return finish(new Error('Reset cancelled.'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') value = Array.from(value).slice(0, -1).join('');
      else if (text && !key.ctrl && !key.meta && !/[\x00-\x1f\x7f]/.test(text)) value += text;
    }
    process.stdin.on('keypress', onKey);
  });
}

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (process.argv.length !== 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Supply exactly one editor email: npm run editor:reset-password -- editor@example.com');
  const password = await hiddenPrompt('New password (at least 14 characters, hidden): ');
  if (password.length < 14) throw new Error('Password must contain at least 14 characters.');
  const confirmation = await hiddenPrompt('Confirm new password (hidden): ');
  if (password !== confirmation) throw new Error('Passwords do not match.');

  const appDir = path.resolve(__dirname, '..');
  process.chdir(appDir);
  // Prevent the normal bootstrap from creating an account when loading this utility.
  process.env.EDITOR_PASSWORD = '';
  const {createStrapi} = require('@strapi/strapi');
  const app = createStrapi({appDir, distDir: appDir});
  try {
    const filename = app.config.get('database.connection.connection.filename');
    if (!filename || !fs.existsSync(filename)) throw new Error('Configured SQLite database does not exist; no account was changed.');
    await app.load();
    await resetPassword(app, email, password);
    console.log('Editor password updated.');
  } finally {
    await app.destroy();
  }
}

if (require.main === module) main().catch(error => {
  const safe = new Set(['Password must contain at least 14 characters.', 'No account exists for that email.', 'The account is not the expected local website editor; no password was changed.', 'The account no longer exists; no password was changed.', 'Run this command in an interactive terminal.', 'Reset cancelled.', 'Passwords do not match.', 'Configured SQLite database does not exist; no account was changed.', 'Supply exactly one editor email: npm run editor:reset-password -- editor@example.com']);
  console.error(safe.has(error.message) ? error.message : 'Password reset failed. Check the application configuration and try again.');
  process.exitCode = 1;
});

module.exports = {resetPassword};
