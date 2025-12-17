/**
 * Shipment Service
 * Handles shipment creation, retrieval, and tracking
 */

class ShipmentService {
    constructor() {
        this.db = window.firebaseApp.db;
        this.storage = window.firebaseApp.storage;
    }

    /**
     * Create new shipment
     */
    async createShipment(shipmentData) {
        try {
            const shipmentRef = await this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS).add({
                ...shipmentData,
                trackingNumber: this.generateTrackingNumber(),
                status: CONSTANTS.STATUS.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
                events: []
            });

            // Create initial tracking event
            await this.addTrackingEvent(shipmentRef.id, {
                status: CONSTANTS.STATUS.PENDING,
                location: 'Order placed',
                description: 'Your shipment has been created',
                timestamp: new Date()
            });

            return { success: true, shipmentId: shipmentRef.id };
        } catch (error) {
            console.error('Create shipment error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get shipment by ID
     */
    async getShipment(shipmentId) {
        try {
            const shipmentSnap = await this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS)
                .doc(shipmentId).get();
            return shipmentSnap.exists ? shipmentSnap.data() : null;
        } catch (error) {
            console.error('Get shipment error:', error);
            return null;
        }
    }

    /**
     * Get shipments for user
     */
    async getUserShipments(userId, filters = {}) {
        try {
            let query = this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS)
                .where('senderId', '==', userId);

            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            const pageSize = filters.pageSize || CONSTANTS.PAGE_SIZE;
            query = query.orderBy('createdAt', 'desc').limit(pageSize);

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get user shipments error:', error);
            return [];
        }
    }

    /**
     * Track shipment by tracking number
     */
    async trackShipment(trackingNumber) {
        try {
            const snapshot = await this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS)
                .where('trackingNumber', '==', trackingNumber)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Tracking number not found' };
            }

            const shipment = snapshot.docs[0].data();
            return { success: true, shipment };
        } catch (error) {
            console.error('Track shipment error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update shipment status
     */
    async updateShipmentStatus(shipmentId, status, eventData = {}) {
        try {
            const shipmentRef = this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS).doc(shipmentId);
            
            await shipmentRef.update({
                status,
                updatedAt: new Date()
            });

            // Add tracking event
            await this.addTrackingEvent(shipmentId, {
                status,
                ...eventData,
                timestamp: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Update shipment status error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add tracking event
     */
    async addTrackingEvent(shipmentId, eventData) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.TRACKING_EVENTS).add({
                shipmentId,
                ...eventData,
                createdAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Add tracking event error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get tracking history
     */
    async getTrackingHistory(shipmentId) {
        try {
            const snapshot = await this.db.collection(CONSTANTS.COLLECTIONS.TRACKING_EVENTS)
                .where('shipmentId', '==', shipmentId)
                .orderBy('createdAt', 'asc')
                .get();

            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Get tracking history error:', error);
            return [];
        }
    }

    /**
     * Generate tracking number
     */
    generateTrackingNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `FDX${timestamp}${random}`;
    }

    /**
     * Cancel shipment
     */
    async cancelShipment(shipmentId, reason) {
        try {
            const shipmentRef = this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS).doc(shipmentId);
            const shipment = await shipmentRef.get();

            if (!shipment.exists) {
                return { success: false, error: 'Shipment not found' };
            }

            const data = shipment.data();
            if (data.status !== CONSTANTS.STATUS.PENDING) {
                return { success: false, error: 'Can only cancel pending shipments' };
            }

            await shipmentRef.update({
                status: CONSTANTS.STATUS.CANCELLED,
                cancellationReason: reason,
                cancelledAt: new Date(),
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Cancel shipment error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const shipmentService = new ShipmentService();
window.shipmentService = shipmentService;
