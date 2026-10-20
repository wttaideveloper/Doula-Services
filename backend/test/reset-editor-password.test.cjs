'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {resetPassword} = require('../scripts/reset-editor-password.cjs');

function fixture(user) {
  const edits = [];
  return {edits, strapi: {
    db: {query: () => ({findOne: async () => user})},
    plugin: () => ({service: () => ({edit: async (...args) => { edits.push(args); return user; }})}),
  }};
}
const editor = {id: 7, email: 'editor@example.com', provider: 'local', role: {type: 'site-editor'}};
test('updates only the password of the existing editor', async () => {
  const f = fixture(editor);
  await resetPassword(f.strapi, editor.email, 'a secure password');
  assert.deepEqual(f.edits, [[7, {password: 'a secure password'}]]);
});
test('rejects missing or unexpected accounts and short passwords', async () => {
  for (const user of [null, {...editor, role: {type: 'authenticated'}}, {...editor, provider: 'google'}, {...editor, email: 'other@example.com'}]) {
    const f = fixture(user);
    await assert.rejects(resetPassword(f.strapi, editor.email, 'a secure password'));
    assert.equal(f.edits.length, 0);
  }
  const f = fixture(editor);
  await assert.rejects(resetPassword(f.strapi, editor.email, 'short'));
  assert.equal(f.edits.length, 0);
});
test('reset does not print the password', async () => {
  const f = fixture(editor);
  const logs = [];
  const original = console.log;
  console.log = (...args) => logs.push(args);
  try { await resetPassword(f.strapi, editor.email, 'a secure password'); } finally { console.log = original; }
  assert.deepEqual(logs, []);
});
test('bootstrap does not reset an existing user', async () => {
  const bootstrap = require('../src/index').bootstrap;
  const previous = {email: process.env.EDITOR_EMAIL, password: process.env.EDITOR_PASSWORD};
  process.env.EDITOR_EMAIL = editor.email;
  process.env.EDITOR_PASSWORD = 'a different password';
  const calls = [];
  const strapi = {
    store: () => ({get: async () => ({}), set: async () => {}}),
    db: {query: uid => ({findOne: async () => uid === 'plugin::users-permissions.role' ? {id: 1} : {id: 7}, create: async () => calls.push(uid)})},
    plugin: () => ({service: () => ({add: async () => calls.push('add'), edit: async () => calls.push('edit')})}),
  };
  try { await bootstrap({strapi}); } finally {
    for (const [key, value] of Object.entries({EDITOR_EMAIL: previous.email, EDITOR_PASSWORD: previous.password})) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
  assert.deepEqual(calls, []);
});
