/**
 * Firebase Configuration
 * Initialize Firebase with credentials and core setup
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Export Firebase services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const functions = firebase.functions();

// Set Firestore settings
db.settings({
    ignoreUndefinedProperties: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open. Offline persistence disabled.');
        } else if (err.code === 'unimplemented') {
            console.warn('Offline persistence not supported.');
        }
    });

// Export for use in other modules
window.firebaseApp = { app, db, auth, storage, functions };
