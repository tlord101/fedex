# Admin Setup

This project does not hardcode admin credentials. Use the secure seeding script to create an admin user.

## Option A: Firebase Console (UI)
1. Go to Firebase Console → Authentication → Users → Add user.
2. Enter email and password (choose your own strong password).
3. Copy the new user UID.
4. Go to Firestore → Create/Select collection `users` → Create document with ID = UID.
5. Set fields:
   - `uid`: string (same UID)
   - `email`: string (same email)
   - `role`: `admin`
   - `isActive`: `true`
   - `createdAt`, `updatedAt`: current timestamp
6. Sign in at `/admin` using that email/password.

## Option B: Secure Seeder (CLI)
Requires a Firebase service account JSON (do not commit) and the Firebase Admin SDK.

1. Ensure dependencies are installed:
   ```bash
   npm install
   ```
2. Export service account credentials and (optionally) project ID:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
   export PROJECT_ID=your-project-id   # optional
   ```
3. Run the seeder:
   ```bash
   npm run seed:admin -- --email=admin@example.com --password='Str0ngP@ss' --name="Admin User"
   ```
4. Log in at `/admin` with the email/password you chose.

Notes
- Never hardcode credentials in the repo.
- The seeder sets the Firestore user doc role to `admin` and adds a custom claim.
- You can re-run the script to update the password safely.
