const cron = require('node-cron');
const Share = require('./../database/models/share');

async function cleanupExpiredShares() {
    try {
        console.log('Starting cleanup of expired shares...');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const result = await Share.deleteMany({
            'settings.validUntil': {
                $ne: null,
                $lt: yesterday
            }
        });
        
        console.log(`Cleanup completed. Removed ${result.deletedCount} expired shares.`);
    } catch (error) {
        console.error('Error during shares cleanup:', error);
    }
}

cleanupExpiredShares();

// Programme la tâche de nettoyage des partages expirés tous les jours à 3h00 UTC
if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 3 * * *', async () => {
        console.log('Running scheduled cleanup of expired shares');
        await cleanupExpiredShares();
    }, {
        timezone: "UTC"
    });
}
