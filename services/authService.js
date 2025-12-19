/**
 * Authentication Service
 * Handles user authentication and session management
 */

class AuthService {
    constructor() {
        this.observers = [];
        this.disabled = (window.CONSTANTS && window.CONSTANTS.AUTH_ENABLED === false);

        if (this.disabled) {
            this.auth = null;
            this.db = null;
            this.currentUser = {
                uid: 'dev-admin',
                email: 'admin@local',
                role: (window.CONSTANTS && window.CONSTANTS.USER_ROLES && window.CONSTANTS.USER_ROLES.ADMIN) || 'admin',
                isActive: true
            };
            // Immediately notify subscribers in disabled mode
            // Defer to next tick to allow subscriber registration first when needed
            setTimeout(() => this.notifyObservers('auth-change', this.currentUser), 0);
            return;
        }

        this.auth = window.firebaseApp.auth;
        this.db = window.firebaseApp.db;
        this.currentUser = null;
        this.initAuthStateListener();
    }

    /**
     * Initialize auth state listener
     */
    initAuthStateListener() {
        if (this.disabled) return; // no-op when disabled
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = await this.getUserProfile(user.uid);
                this.notifyObservers('auth-change', this.currentUser);
            } else {
                this.currentUser = null;
                this.notifyObservers('auth-change', null);
            }
        });
    }

    /**
     * Sign up new user
     */
    async signUp(email, password, userData) {
        if (this.disabled) {
            this.currentUser = {
                uid: 'dev-admin', email: email || 'admin@local',
                role: (CONSTANTS.USER_ROLES.ADMIN), isActive: true
            };
            this.notifyObservers('auth-change', this.currentUser);
            return { success: true, uid: this.currentUser.uid };
        }
        try {
            const credential = await this.auth.createUserWithEmailAndPassword(email, password);
            const uid = credential.user.uid;

            // Create user profile in Firestore
            await this.db.collection(CONSTANTS.COLLECTIONS.USERS).doc(uid).set({
                uid,
                email,
                displayName: userData.displayName || '',
                phone: userData.phone || '',
                role: userData.role || CONSTANTS.USER_ROLES.CUSTOMER,
                address: userData.address || {},
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
                emailVerified: false
            });

            // Send verification email
            await credential.user.sendEmailVerification();

            return { success: true, uid };
        } catch (error) {
            console.error('SignUp error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign in user
     */
    async signIn(email, password) {
        if (this.disabled) {
            this.currentUser = {
                uid: 'dev-admin', email: email || 'admin@local',
                role: (CONSTANTS.USER_ROLES.ADMIN), isActive: true
            };
            this.notifyObservers('auth-change', this.currentUser);
            return { success: true, user: { uid: this.currentUser.uid } };
        }
        try {
            const credential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: credential.user };
        } catch (error) {
            console.error('SignIn error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        if (this.disabled) {
            return this.signIn('admin@local', '');
        }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const credential = await this.auth.signInWithPopup(provider);
            const uid = credential.user.uid;

            // Check if user exists, if not create profile
            const userSnap = await this.db.collection(CONSTANTS.COLLECTIONS.USERS).doc(uid).get();
            if (!userSnap.exists) {
                await this.db.collection(CONSTANTS.COLLECTIONS.USERS).doc(uid).set({
                    uid,
                    email: credential.user.email,
                    displayName: credential.user.displayName,
                    photoURL: credential.user.photoURL,
                    role: CONSTANTS.USER_ROLES.CUSTOMER,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    emailVerified: true
                });
            }

            return { success: true, user: credential.user };
        } catch (error) {
            console.error('Google SignIn error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        if (this.disabled) {
            this.currentUser = null;
            this.notifyObservers('auth-change', null);
            return { success: true };
        }
        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('SignOut error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(uid) {
        if (this.disabled) {
            return this.currentUser || { uid: 'dev-admin', email: 'admin@local', role: CONSTANTS.USER_ROLES.ADMIN, isActive: true };
        }
        try {
            const userSnap = await this.db.collection(CONSTANTS.COLLECTIONS.USERS).doc(uid).get();
            return userSnap.exists ? userSnap.data() : null;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(uid, updates) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.USERS).doc(uid).update({
                ...updates,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Password reset
     */
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        if (this.disabled) return this.currentUser;
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        if (this.disabled) return true;
        return !!this.currentUser;
    }

    /**
     * Check user role
     */
    hasRole(role) {
        if (this.disabled) return role === CONSTANTS.USER_ROLES.ADMIN;
        return this.currentUser && this.currentUser.role === role;
    }

    /**
     * Subscribe to auth changes
     */
    subscribe(callback) {
        this.observers.push(callback);
        // Immediately notify in disabled mode to simulate signed-in admin
        if (this.disabled) {
            try { callback('auth-change', this.currentUser); } catch (_) {}
        }
    }

    /**
     * Notify observers
     */
    notifyObservers(event, data) {
        this.observers.forEach(callback => callback(event, data));
    }
}

// Create singleton instance
const authService = new AuthService();
window.authService = authService;
