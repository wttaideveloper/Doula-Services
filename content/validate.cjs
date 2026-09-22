const defaults = require('./defaults.json');
function validateContent(value) {
  const errors = [];
  const visit = (data, model, path) => {
    if (errors.length > 20) return;
    if (Array.isArray(model)) {
      if (!Array.isArray(data) || data.length < 1 || data.length > 30) {errors.push(`${path}: use 1–30 items`);return;}
      data.forEach((item, i) => visit(item, model[0], `${path}.${i}`));return;
    }
    if (model && typeof model === 'object') {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {errors.push(`${path}: invalid section`);return;}
      for (const key of Object.keys(model)) visit(data[key], model[key], `${path}.${key}`);
      for (const key of Object.keys(data)) if (!Object.hasOwn(model, key)) errors.push(`${path}.${key}: unknown field`);
      return;
    }
    if (typeof data !== typeof model) {errors.push(`${path}: invalid value`);return;}
    if (typeof data === 'string') {
      if (data.length > 12000) errors.push(`${path}: text is too long`);
      if (/\.(href|src|instagramUrl|bookingUrl)$/.test(path) && data && !(/^(\/(?!\/)|https:\/\/|mailto:|tel:|#)/i.test(data))) errors.push(`${path}: use a site path, https link, email or telephone link`);
      if (/\.(href|src|instagramUrl|bookingUrl)$/.test(path) && /[\\\u0000-\u0020]/.test(data)) errors.push(`${path}: links cannot contain spaces, backslashes or control characters`);
      if (path.endsWith('.src') && (!data || !/^(\/(?!\/)|https:\/\/)/i.test(data))) errors.push(`${path}: choose an image`);
      if (path.endsWith('.email') && data && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) errors.push(`${path}: enter a valid email`);
    }
    if (typeof data === 'number' && (!Number.isFinite(data) || data < 3 || data > 30)) errors.push(`${path}: choose 3–30 seconds`);
  };
  visit(value, defaults, 'content');
  return errors;
}
module.exports = { validateContent };

