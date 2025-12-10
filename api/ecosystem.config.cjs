module.exports = {
  apps: [{
    name: 'bradfoster-api',
    script: './server.js',
    cwd: '/home/compsmart/htdocs/www.bradfoster.co.uk/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/home/compsmart/htdocs/www.bradfoster.co.uk/api/logs/error.log',
    out_file: '/home/compsmart/htdocs/www.bradfoster.co.uk/api/logs/out.log',
    log_file: '/home/compsmart/htdocs/www.bradfoster.co.uk/api/logs/combined.log',
    time: true,
    merge_logs: true,
  }]
};
