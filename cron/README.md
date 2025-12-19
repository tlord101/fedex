# Parcel Progress Cron Job

## Overview
Automated service that updates parcel progress and status in Firestore at regular intervals.

## Features
- ⏰ Runs every minute (configurable)
- 🔄 Calculates progress based on elapsed time
- 📊 Auto-updates status based on progress percentage
- 💾 Only writes to Firestore when changes occur
- 🔍 Handles errors gracefully
- 📝 Detailed logging

## Deployment Options

### 1. Browser Simulator (Development)
**Best for:** Testing, demos, development

**How to use:**
1. Open `../pages/parcel-cron.html` in browser
2. Click "Start Cron"
3. Keep tab open

**Pros:**
- No setup required
- Visual feedback
- Easy to test

**Cons:**
- Must keep browser tab open
- Not suitable for production

### 2. Node.js Server (Production)
**Best for:** Dedicated server, VPS, local machine

**Setup:**
```bash
# Install dependencies
npm install

# Get Firebase service account key
# 1. Go to Firebase Console
# 2. Project Settings → Service Accounts
# 3. Generate new private key
# 4. Save as serviceAccountKey.json in this directory

# Run the cron job
npm start
```

**Pros:**
- Always running
- Production-ready
- Easy to manage

**Cons:**
- Requires server
- Manual deployment

### 3. Firebase Cloud Functions (Recommended)
**Best for:** Serverless, scalable, managed

**Setup:**
```bash
# Initialize Firebase Functions
firebase init functions

# Install dependencies
cd functions
npm install firebase-admin

# Copy the cron logic
# From: parcel-progress-cron.js
# To: functions/index.js

# Deploy
firebase deploy --only functions
```

**In functions/index.js:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.updateParcelProgress = functions.pubsub
    .schedule('every 1 minutes')
    .timeZone('America/New_York')
    .onRun(async (context) => {
        // Copy updateAllParcels logic here
        return null;
    });
```

**Pros:**
- No server management
- Auto-scaling
- Highly reliable

**Cons:**
- Requires Firebase Blaze plan
- Cold start delays

### 4. External Cron Service
**Best for:** Triggering via HTTP, existing infrastructure

Services like:
- cron-job.org
- EasyCron
- AWS EventBridge

**Setup:**
1. Create HTTP endpoint (Firebase Function or API)
2. Add API key authentication
3. Schedule external cron to call endpoint

## Configuration

### Interval
Default: Every 1 minute

**To change in Node.js:**
```javascript
// In parcel-progress-cron.js
cron.schedule('*/5 * * * *', () => {  // Every 5 minutes
    updateAllParcels();
});
```

**Cron syntax:**
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight

### Status Thresholds
```javascript
function getStatusFromProgress(progressPercent) {
    if (progressPercent >= 100) return 'Delivered';
    if (progressPercent >= 75) return 'Out for Delivery';  // Change threshold
    if (progressPercent >= 25) return 'In Transit';        // Change threshold
    return 'Picked Up';
}
```

## How It Works

1. **Query Active Parcels**
   ```javascript
   db.collection('parcels')
     .where('progressPercent', '<', 100)
     .get()
   ```

2. **Calculate Progress**
   ```javascript
   progress = ((now - startTime) / (endTime - startTime)) * 100
   ```

3. **Determine Status**
   - 0-24%: Picked Up
   - 25-74%: In Transit
   - 75-99%: Out for Delivery
   - 100%: Delivered

4. **Update Firestore** (only if changed)
   ```javascript
   db.collection('parcels').doc(id).update({
       progressPercent: newProgress,
       currentStatus: newStatus,
       lastUpdated: Date.now()
   })
   ```

## Monitoring

### Browser Simulator
- Visual activity log
- Real-time statistics
- Success/error indicators

### Node.js
Check console output:
```
🔄 Starting parcel progress update job...
📦 Found 3 active parcel(s) to update
✅ Updated parcel abc123... → 45.5% (In Transit)
✅ Updated parcel def456... → 78.2% (Out for Delivery)
✅ Job completed in 234ms
   Updated: 2 parcels
   Skipped: 1 parcels (no change)
```

### Firebase Functions
Check logs in Firebase Console:
```bash
firebase functions:log --only updateParcelProgress
```

## Error Handling

The cron job handles:
- Missing parcels (skips)
- Firestore connection errors (retries on next run)
- Invalid data (logs and continues)
- Permission errors (logs detailed error)

## Performance

### Firestore Writes
- Only writes when progress changes (>0.1% difference)
- Average: 1-2 writes per minute per active parcel
- Cost optimization built-in

### Query Optimization
- Uses `where` clause to filter completed parcels
- Efficient indexing
- Minimal data transfer

## Testing

### Test with Demo Parcel
```javascript
// Create parcel with 5-minute duration
{
    origin: { name: "Start", coords: [40, -74] },
    destination: { name: "End", coords: [34, -118] },
    startTime: Date.now(),
    endTime: Date.now() + (5 * 60 * 1000),  // 5 minutes
    progressPercent: 0,
    currentStatus: "Picked Up"
}
```

### Expected Updates
- Minute 0: 0% - Picked Up
- Minute 1: 20% - Picked Up
- Minute 2: 40% - In Transit
- Minute 3: 60% - In Transit
- Minute 4: 80% - Out for Delivery
- Minute 5: 100% - Delivered

## Troubleshooting

**Cron not running:**
- Check process is running: `ps aux | grep node`
- Verify Firebase credentials
- Check Firestore permissions

**Parcels not updating:**
- Verify parcel exists in Firestore
- Check progressPercent is < 100
- Ensure startTime and endTime are valid
- Review cron logs for errors

**High Firestore costs:**
- Verify write optimization is working
- Check if multiple crons are running
- Review write frequency

## Security

### Service Account
- Download from Firebase Console
- Store securely (not in git)
- Use environment variables in production

### Firestore Rules
```javascript
match /parcels/{parcelId} {
    allow read: if true;
    // Only allow server to write
    allow write: if false;  // Client writes disabled
}
```

Note: Server-side (Admin SDK) bypasses rules.

## Scaling

### High Volume (1000+ parcels)
- Consider batching updates
- Use Firestore transactions
- Implement parallel processing

### Multiple Regions
- Deploy cron in each region
- Use Firestore multi-region
- Load balance across instances

## Dependencies

```json
{
  "firebase-admin": "^11.11.1",  // Firestore access
  "node-cron": "^3.0.3"          // Scheduling
}
```

## Environment Variables

For production, use environment variables:
```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_PRIVATE_KEY="your-private-key"
export FIREBASE_CLIENT_EMAIL="your-client-email"
```

## Logs Location

- **Browser:** In-page activity log
- **Node.js:** Console output
- **Firebase Functions:** Cloud Functions logs
- **Docker:** Container logs

## Support

For issues:
1. Check logs for detailed errors
2. Verify Firebase connection
3. Test with simple parcel
4. Review Firestore console

---

**Quick Start:** Use browser simulator first, then deploy to production when ready!
