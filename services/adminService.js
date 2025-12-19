/**
 * Admin Service
 * Handles admin operations and system management
 */

class AdminService {
    constructor() {
        this.db = window.firebaseApp.db;
    }

    /**
     * Log admin action for audit trail
     */
    async logAdminAction(action, target = {}, meta = {}) {
        try {
            const admin = window.authService?.getCurrentUser?.() || null;
            const payload = {
                action,
                targetType: target.type || null,
                targetId: target.id || null,
                meta: meta || {},
                adminId: admin?.uid || null,
                adminEmail: admin?.email || null,
                createdAt: new Date()
            };
            await this.db.collection(CONSTANTS.COLLECTIONS.ADMIN_LOGS).add(payload);
        } catch (e) {
            console.warn('Admin log write failed:', e?.message || e);
        }
    }

    /**
     * Get system statistics
     */
    async getSystemStats() {
        try {
            const usersSnap = await this.db.collection(CONSTANTS.COLLECTIONS.USERS).get();
            const shipmentsSnap = await this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS).get();
            const driversSnap = await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).get();

            const totalRevenue = shipmentsSnap.docs.reduce((sum, doc) => {
                return sum + (doc.data().totalCost || 0);
            }, 0);

            const shipmentsByStatus = {};
            shipmentsSnap.docs.forEach(doc => {
                const status = doc.data().status;
                shipmentsByStatus[status] = (shipmentsByStatus[status] || 0) + 1;
            });

            return {
                success: true,
                stats: {
                    totalUsers: usersSnap.size,
                    totalShipments: shipmentsSnap.size,
                    totalDrivers: driversSnap.size,
                    totalRevenue,
                    shipmentsByStatus
                }
            };
        } catch (error) {
            console.error('Get system stats error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all users with filtering
     */
    async getAllUsers(filters = {}) {
        try {
            let query = this.db.collection(CONSTANTS.COLLECTIONS.USERS);

            if (filters.role) {
                query = query.where('role', '==', filters.role);
            }

            if (filters.isActive !== undefined) {
                query = query.where('isActive', '==', filters.isActive);
            }

            const snapshot = await query.limit(filters.limit || 50).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get all users error:', error);
            return [];
        }
    }

    /**
     * Get all shipments with filtering
     */
    async getAllShipments(filters = {}) {
        try {
            let query = this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS);

            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            if (filters.shippingType) {
                query = query.where('shippingType', '==', filters.shippingType);
            }

            const snapshot = await query.orderBy('createdAt', 'desc').limit(filters.limit || 50).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get all shipments error:', error);
            return [];
        }
    }

    /**
     * Get all drivers with filtering
     */
    async getAllDrivers(filters = {}) {
        try {
            let query = this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS);

            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            if (filters.verified !== undefined) {
                query = query.where('verified', '==', filters.verified);
            }

            const snapshot = await query.limit(filters.limit || 50).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get all drivers error:', error);
            return [];
        }
    }

    /**
     * Verify driver
     */
    async verifyDriver(driverId) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).doc(driverId).update({
                verified: true,
                status: 'active',
                verifiedAt: new Date(),
                updatedAt: new Date()
            });
            await this.logAdminAction('verify_driver', { type: 'driver', id: driverId });
            return { success: true };
        } catch (error) {
            console.error('Verify driver error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reject driver
     */
    async rejectDriver(driverId, reason) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).doc(driverId).update({
                verified: false,
                status: 'rejected',
                rejectionReason: reason,
                updatedAt: new Date()
            });
            await this.logAdminAction('reject_driver', { type: 'driver', id: driverId }, { reason });
            return { success: true };
        } catch (error) {
            console.error('Reject driver error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deactivate user
     */
    async deactivateUser(userId) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.USERS).doc(userId).update({
                isActive: false,
                deactivatedAt: new Date(),
                updatedAt: new Date()
            });
            await this.logAdminAction('deactivate_user', { type: 'user', id: userId });
            return { success: true };
        } catch (error) {
            console.error('Deactivate user error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update shipping rates
     */
    async updateRate(rateId, updates) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.RATES).doc(rateId).update({
                ...updates,
                updatedAt: new Date()
            });
            await this.logAdminAction('update_rate', { type: 'rate', id: rateId }, { updates });
            return { success: true };
        } catch (error) {
            console.error('Update rate error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get system settings
     */
    async getSystemSettings() {
        try {
            const snap = await this.db.collection('system').doc('settings').get();
            return snap.exists ? snap.data() : null;
        } catch (error) {
            console.error('Get system settings error:', error);
            return null;
        }
    }

    /**
     * Update system settings
     */
    async updateSystemSettings(settings) {
        try {
            await this.db.collection('system').doc('settings').set({
                ...settings,
                updatedAt: new Date()
            }, { merge: true });
            await this.logAdminAction('update_settings', { type: 'system', id: 'settings' }, { settings });
            return { success: true };
        } catch (error) {
            console.error('Update system settings error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate report
     */
    async generateReport(reportType, filters = {}) {
        try {
            let query;
            let collectionName;

            if (reportType === 'revenue') {
                collectionName = CONSTANTS.COLLECTIONS.SHIPMENTS;
                query = this.db.collection(collectionName);
            } else if (reportType === 'users') {
                collectionName = CONSTANTS.COLLECTIONS.USERS;
                query = this.db.collection(collectionName);
            } else if (reportType === 'deliveries') {
                collectionName = CONSTANTS.COLLECTIONS.SHIPMENTS;
                query = this.db.collection(collectionName);
            }

            const snapshot = await query.get();
            return {
                success: true,
                report: {
                    type: reportType,
                    generatedAt: new Date(),
                    data: snapshot.docs.map(doc => doc.data()),
                    totalRecords: snapshot.size
                }
            };
        } catch (error) {
            console.error('Generate report error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Fetch admin logs with optional filters
     */
    async getAdminLogs({ limit = 50, action, adminId } = {}) {
        try {
            let query = this.db.collection(CONSTANTS.COLLECTIONS.ADMIN_LOGS).orderBy('createdAt', 'desc').limit(limit);
            if (action) query = query.where('action', '==', action);
            if (adminId) query = query.where('adminId', '==', adminId);
            const snap = await query.get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error('Get admin logs error:', error);
            return [];
        }
    }
}

// Create singleton instance
const adminService = new AdminService();
window.adminService = adminService;
