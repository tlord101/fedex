/**
 * Parcel Progress Cron Job
 * 
 * This script updates parcel progress in Firestore at regular intervals.
 * It should be run as a scheduled job (cron) or cloud function.
 * 
 * DEPLOYMENT OPTIONS:
 * 
 * 1. Firebase Cloud Functions (Scheduled):
 *    - Deploy as a scheduled function that runs every minute
 *    - Use Firebase Functions with Cloud Scheduler
 * 
 * 2. Node.js Cron on Server:
 *    - Run this script with node-cron on a server
 *    - Schedule to run every minute
 * 
 * 3. External Cron Service:
 *    - Use services like EasyCron, cron-job.org
 *    - Make HTTP request to trigger this logic
 * 
 * RECOMMENDED: Firebase Cloud Functions (Scheduled)
 * 
 * To deploy to Firebase Functions:
 * 1. firebase init functions
 * 2. Copy this logic to functions/index.js
 * 3. firebase deploy --only functions
 */

// For Firebase Cloud Functions (uncomment when deploying)
// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// admin.initializeApp();
// const db = admin.firestore();

// For Node.js standalone with Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://tlord-1ab38-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

/**
 * Calculate progress percentage based on time
 */
function calculateProgress(startTime, endTime) {
    const now = Date.now();
    
    if (now < startTime) {
        return 0;
    }
    
    if (now >= endTime) {
        return 100;
    }
    
    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;
    const progress = (elapsed / totalDuration) * 100;
    
    return Math.min(100, Math.max(0, Math.round(progress * 100) / 100)); // Round to 2 decimal places
}

/**
 * Determine status based on progress percentage
 */
function getStatusFromProgress(progressPercent) {
    if (progressPercent >= 100) {
        return 'Delivered';
    } else if (progressPercent >= 75) {
        return 'Out for Delivery';
    } else if (progressPercent >= 25) {
        return 'In Transit';
    } else {
        return 'Picked Up';
    }
}

/**
 * Update a single parcel's progress
 */
async function updateParcel(parcelId, parcelData) {
    try {
        const currentProgress = calculateProgress(parcelData.startTime, parcelData.endTime);
        const currentStatus = getStatusFromProgress(currentProgress);
        
        // Only update if progress has changed (to avoid unnecessary writes)
        if (Math.abs(currentProgress - parcelData.progressPercent) < 0.01 && 
            currentStatus === parcelData.currentStatus) {
            return { updated: false, parcelId };
        }
        
        // Update Firestore
        await db.collection('parcels').doc(parcelId).update({
            progressPercent: currentProgress,
            currentStatus: currentStatus,
            lastUpdated: Date.now()
        });
        
        console.log(`✅ Updated parcel ${parcelId}: ${currentProgress}% - ${currentStatus}`);
        return { 
            updated: true, 
            parcelId, 
            progress: currentProgress, 
            status: currentStatus 
        };
    } catch (error) {
        console.error(`❌ Error updating parcel ${parcelId}:`, error);
        return { updated: false, parcelId, error: error.message };
    }
}

/**
 * Main cron job function - updates all active parcels
 */
async function updateAllParcels() {
    console.log('🔄 Starting parcel progress update job...');
    const startTime = Date.now();
    
    try {
        // Get all active parcels (not yet delivered)
        const snapshot = await db.collection('parcels')
            .where('progressPercent', '<', 100)
            .get();
        
        if (snapshot.empty) {
            console.log('ℹ️ No active parcels to update');
            return { success: true, count: 0, duration: Date.now() - startTime };
        }
        
        console.log(`📦 Found ${snapshot.size} active parcel(s) to update`);
        
        // Update each parcel
        const updatePromises = [];
        snapshot.forEach(doc => {
            updatePromises.push(updateParcel(doc.id, doc.data()));
        });
        
        const results = await Promise.all(updatePromises);
        
        // Summary
        const updatedCount = results.filter(r => r.updated).length;
        const errorCount = results.filter(r => r.error).length;
        const duration = Date.now() - startTime;
        
        console.log(`✅ Job completed in ${duration}ms`);
        console.log(`   Updated: ${updatedCount} parcels`);
        console.log(`   Skipped: ${results.length - updatedCount - errorCount} parcels (no change)`);
        if (errorCount > 0) {
            console.log(`   Errors: ${errorCount} parcels`);
        }
        
        return {
            success: true,
            total: snapshot.size,
            updated: updatedCount,
            skipped: results.length - updatedCount - errorCount,
            errors: errorCount,
            duration
        };
        
    } catch (error) {
        console.error('❌ Cron job failed:', error);
        return {
            success: false,
            error: error.message,
            duration: Date.now() - startTime
        };
    }
}

// ============================================
// DEPLOYMENT CONFIGURATIONS
// ============================================

// Option 1: Firebase Scheduled Function (runs every minute)
// Uncomment this when deploying to Firebase Functions
/*
exports.updateParcelProgress = functions.pubsub
    .schedule('every 1 minutes')
    .timeZone('America/New_York')
    .onRun(async (context) => {
        const result = await updateAllParcels();
        console.log('Scheduled job result:', result);
        return result;
    });
*/

// Option 2: Firebase HTTPS Callable Function (manual trigger or external cron)
// Uncomment this when deploying to Firebase Functions
/*
exports.updateParcelProgressHTTP = functions.https.onRequest(async (req, res) => {
    // Optional: Add authentication/API key check here
    const apiKey = req.get('X-API-Key');
    if (apiKey !== 'your-secret-api-key') {
        res.status(401).send({ error: 'Unauthorized' });
        return;
    }
    
    const result = await updateAllParcels();
    res.status(200).send(result);
});
*/

// Option 3: Node.js Standalone with node-cron
// Run this file directly with Node.js
if (require.main === module) {
    const cron = require('node-cron');
    
    console.log('🚀 Starting Parcel Progress Cron Service...');
    console.log('⏰ Job will run every minute');
    console.log('Press Ctrl+C to stop');
    
    // Run immediately on start
    updateAllParcels();
    
    // Schedule to run every minute
    cron.schedule('* * * * *', () => {
        updateAllParcels();
    });
}

// Export functions for use in other contexts
module.exports = {
    updateAllParcels,
    updateParcel,
    calculateProgress,
    getStatusFromProgress
};
