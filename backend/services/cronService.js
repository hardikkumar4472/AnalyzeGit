const cron = require('node-cron');
const { pingSupabase } = require('./supabaseService');

const startCronJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Initiating daily automated Supabase ping...');
        await pingSupabase();
    });

    console.log('[Cron] Automated Supabase health checks initialized.');
};

module.exports = startCronJobs;
