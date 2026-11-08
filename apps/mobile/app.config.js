module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.TENDAY_WEB_BASE_URL
      ? { baseUrl: process.env.TENDAY_WEB_BASE_URL }
      : {}),
  },
});
