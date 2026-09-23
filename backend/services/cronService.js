const cron = require('node-cron');

const startCronJobs = () => {
    console.log('[Cron] Background cron scheduler initialized.');
};

module.exports = startCronJobs;
