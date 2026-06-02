module.exports = {
  apps: [
    {
      name: "aura-connect-backend",
      script: "backend/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      watch: false,
    },
  ],
};
