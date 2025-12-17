/**
 * Driver Service
 * Handles driver registration, authentication, and management
 */

class DriverService {
    constructor() {
        this.db = window.firebaseApp.db;
        this.storage = window.firebaseApp.storage;
    }

    /**
     * Register new driver
     */
    async registerDriver(driverData) {
        try {
            const driverRef = await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).add({
                ...driverData,
                status: 'pending',
                verified: false,
                rating: 5.0,
                totalDeliveries: 0,
                totalEarnings: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
                currentLocation: null,
                currentShipmentId: null
            });

            return { success: true, driverId: driverRef.id };
        } catch (error) {
            console.error('Register driver error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get driver by ID
     */
    async getDriver(driverId) {
        try {
            const driverSnap = await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS)
                .doc(driverId).get();
            return driverSnap.exists ? { id: driverSnap.id, ...driverSnap.data() } : null;
        } catch (error) {
            console.error('Get driver error:', error);
            return null;
        }
    }

    /**
     * Update driver profile
     */
    async updateDriverProfile(driverId, updates) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).doc(driverId).update({
                ...updates,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Update driver profile error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update driver location
     */
    async updateDriverLocation(driverId, latitude, longitude) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).doc(driverId).update({
                currentLocation: {
                    latitude,
                    longitude,
                    timestamp: new Date()
                },
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Update driver location error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Assign shipment to driver
     */
    async assignShipment(driverId, shipmentId) {
        try {
            const driver = await this.getDriver(driverId);
            if (driver.currentShipmentId) {
                return { success: false, error: 'Driver currently has active shipment' };
            }

            await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).doc(driverId).update({
                currentShipmentId: shipmentId,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Assign shipment error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Complete delivery
     */
    async completeDelivery(driverId, shipmentId, deliveryProof) {
        try {
            const driver = await this.getDriver(driverId);
            const newDeliveries = (driver.totalDeliveries || 0) + 1;

            await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).doc(driverId).update({
                currentShipmentId: null,
                totalDeliveries: newDeliveries,
                updatedAt: new Date()
            });

            // Update shipment status
            await this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS).doc(shipmentId).update({
                status: CONSTANTS.STATUS.DELIVERED,
                deliveryProof: deliveryProof || null,
                deliveredAt: new Date(),
                deliveredBy: driverId,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Complete delivery error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Rate driver
     */
    async rateDriver(driverId, rating, comment) {
        try {
            const driver = await this.getDriver(driverId);
            const totalRatings = (driver.totalRatings || 0) + 1;
            const oldRating = driver.rating || 5;
            const newRating = ((oldRating * (totalRatings - 1)) + rating) / totalRatings;

            await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS).doc(driverId).update({
                rating: newRating,
                totalRatings: totalRatings,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Rate driver error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get available drivers
     */
    async getAvailableDrivers(limit = 10) {
        try {
            const snapshot = await this.db.collection(CONSTANTS.COLLECTIONS.DRIVERS)
                .where('isActive', '==', true)
                .where('currentShipmentId', '==', null)
                .where('verified', '==', true)
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get available drivers error:', error);
            return [];
        }
    }

    /**
     * Get driver earnings
     */
    async getDriverEarnings(driverId, startDate, endDate) {
        try {
            const snapshot = await this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS)
                .where('deliveredBy', '==', driverId)
                .where('deliveredAt', '>=', startDate)
                .where('deliveredAt', '<=', endDate)
                .get();

            const earnings = snapshot.docs.reduce((sum, doc) => {
                const shipment = doc.data();
                return sum + (shipment.driverEarnings || shipment.totalCost * 0.15);
            }, 0);

            return { success: true, earnings };
        } catch (error) {
            console.error('Get driver earnings error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get driver statistics
     */
    async getDriverStats(driverId) {
        try {
            const driver = await this.getDriver(driverId);
            
            const deliveries = await this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS)
                .where('deliveredBy', '==', driverId)
                .get();

            const totalDistance = driver.totalDistance || 0;
            const averageRating = driver.rating || 0;
            const totalDeliveries = driver.totalDeliveries || 0;
            const totalEarnings = driver.totalEarnings || 0;

            return {
                success: true,
                stats: {
                    totalDeliveries,
                    averageRating,
                    totalDistance,
                    totalEarnings,
                    joiningDate: driver.createdAt
                }
            };
        } catch (error) {
            console.error('Get driver stats error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const driverService = new DriverService();
window.driverService = driverService;
