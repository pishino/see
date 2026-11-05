// app.json holds the config; this only adds what a build is told from outside.
// SEE_PHONE_BASE: where the phone app's web preview is served from (GitHub Pages: /see/phone).
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...(config.experiments ?? {}), ...(process.env.SEE_PHONE_BASE ? { baseUrl: process.env.SEE_PHONE_BASE } : {}) },
});
