#!/usr/bin/env node
/*
  Secure Admin Seeder
  Creates a Firebase Auth user and grants admin role in Firestore.
  Usage:
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json \
    PROJECT_ID=your-project-id \
    node tools/seedAdmin.js --email=admin@example.com --password=Str0ngP@ss --name="Admin User"

  Notes:
  - Requires a Firebase service account with permissions to Auth and Firestore.
  - Never commit credentials. Use env var GOOGLE_APPLICATION_CREDENTIALS.
*/

const admin = require('firebase-admin');

function parseArgs(argv){
  const args = {};
  argv.slice(2).forEach(a=>{
    const m = a.match(/^--([^=]+)=(.*)$/);
    if(m) args[m[1]] = m[2];
  });
  return args;
}

(async () => {
  try {
    const { email, password, name } = parseArgs(process.argv);
    if (!email || !password) {
      console.error('Missing required args. Example: --email=admin@example.com --password=Str0ngP@ss --name="Admin User"');
      process.exit(1);
    }

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS not set. Point it to your service account JSON.');
      process.exit(1);
    }

    const projectId = process.env.PROJECT_ID; // optional override

    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId || undefined,
    });

    const auth = admin.auth();
    const db = admin.firestore();

    // Create or get user
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`[info] User exists: ${userRecord.uid}`);
      if (password) {
        await auth.updateUser(userRecord.uid, { password });
        console.log('[info] Updated user password');
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({ email, password, displayName: name || 'Admin' });
        console.log(`[info] Created user: ${userRecord.uid}`);
      } else {
        throw e;
      }
    }

    // Set Firestore profile
    const uid = userRecord.uid;
    const now = new Date();
    await db.collection('users').doc(uid).set({
      uid,
      email,
      fullName: name || 'Admin',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('[info] Firestore profile set with admin role');

    // Optional: set custom claims
    try {
      await auth.setCustomUserClaims(uid, { role: 'admin' });
      console.log('[info] Custom claims set: role=admin');
    } catch (e) {
      console.warn('[warn] Could not set custom claims (non-fatal):', e.message);
    }

    console.log('\n✅ Admin ready');
    console.log('Email:', email);
  } catch (err) {
    console.error('[error] Failed to seed admin:', err.message || err);
    process.exit(1);
  }
})();
