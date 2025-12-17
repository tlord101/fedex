/**
 * REST API Service
 * Provides API endpoints documentation and webhook management
 * Note: This requires a backend server. For frontend, we provide the service structure.
 */

class APIService {
    constructor() {
        this.db = window.firebaseApp.db;
        this.apiEndpoints = {
            // Shipment endpoints
            'POST /api/shipments': 'Create a new shipment',
            'GET /api/shipments/:id': 'Get shipment details',
            'GET /api/shipments': 'List all shipments (with filters)',
            'PUT /api/shipments/:id': 'Update shipment',
            'DELETE /api/shipments/:id': 'Cancel shipment',

            // Tracking endpoints
            'GET /api/tracking/:trackingNumber': 'Get tracking information',
            'GET /api/tracking/:trackingNumber/events': 'Get tracking events',

            // User endpoints
            'POST /api/users/register': 'Register new user',
            'POST /api/users/login': 'User login',
            'GET /api/users/:id': 'Get user details',
            'PUT /api/users/:id': 'Update user profile',
            'DELETE /api/users/:id': 'Delete user account',

            // Driver endpoints
            'POST /api/drivers/register': 'Register new driver',
            'GET /api/drivers': 'List available drivers',
            'GET /api/drivers/:id': 'Get driver details',
            'PUT /api/drivers/:id/location': 'Update driver location',
            'POST /api/drivers/:id/deliveries/:shipmentId/complete': 'Complete delivery',

            // Payment endpoints
            'POST /api/payments': 'Create payment',
            'GET /api/payments/:id': 'Get payment details',
            'GET /api/invoices/:id': 'Get invoice',
            'POST /api/refunds': 'Request refund',

            // Admin endpoints
            'GET /api/admin/stats': 'Get system statistics',
            'GET /api/admin/users': 'List all users',
            'GET /api/admin/drivers': 'List all drivers',
            'PUT /api/admin/drivers/:id/verify': 'Verify driver',
            'POST /api/admin/rates': 'Update shipping rates',

            // International endpoints
            'GET /api/international/countries': 'List countries',
            'GET /api/international/countries/:code': 'Get country details',
            'POST /api/international/customs': 'Generate customs form',
            'GET /api/international/exchange-rates': 'Get exchange rates'
        };
    }

    /**
     * Get all API endpoints
     */
    getEndpoints() {
        return this.apiEndpoints;
    }

    /**
     * Register webhook
     */
    async registerWebhook(webhookUrl, events) {
        try {
            const webhook = {
                url: webhookUrl,
                events: events,
                active: true,
                createdAt: new Date(),
                lastTriggered: null,
                failureCount: 0
            };

            const docRef = await this.db.collection('webhooks').add(webhook);
            return { success: true, webhookId: docRef.id };
        } catch (error) {
            console.error('Register webhook error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get registered webhooks
     */
    async getWebhooks() {
        try {
            const snapshot = await this.db.collection('webhooks').where('active', '==', true).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get webhooks error:', error);
            return [];
        }
    }

    /**
     * Trigger webhook
     */
    async triggerWebhook(webhookId, eventType, data) {
        try {
            const webhook = await this.db.collection('webhooks').doc(webhookId).get();
            if (!webhook.exists || !webhook.data().active) {
                return { success: false, error: 'Webhook not found' };
            }

            // In production, this would make actual HTTP request
            const payload = {
                event: eventType,
                timestamp: new Date(),
                data: data
            };

            // Log webhook call
            await this.db.collection('webhookLogs').add({
                webhookId,
                eventType,
                status: 'pending',
                payload,
                createdAt: new Date()
            });

            return { success: true, payload };
        } catch (error) {
            console.error('Trigger webhook error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get webhook logs
     */
    async getWebhookLogs(webhookId, limit = 50) {
        try {
            const snapshot = await this.db.collection('webhookLogs')
                .where('webhookId', '==', webhookId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get webhook logs error:', error);
            return [];
        }
    }

    /**
     * Batch create shipments
     */
    async batchCreateShipments(shipmentsData) {
        try {
            const batch = this.db.batch();
            const results = [];

            for (const shipment of shipmentsData) {
                const docRef = this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS).doc();
                batch.set(docRef, {
                    ...shipment,
                    status: 'PENDING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                results.push({ id: docRef.id });
            }

            await batch.commit();
            return { success: true, created: results.length, results };
        } catch (error) {
            console.error('Batch create shipments error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Advanced search with filters
     */
    async advancedSearch(filters) {
        try {
            let query = this.db.collection(CONSTANTS.COLLECTIONS.SHIPMENTS);

            // Apply filters
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.minValue) {
                query = query.where('totalCost', '>=', filters.minValue);
            }
            if (filters.maxValue) {
                query = query.where('totalCost', '<=', filters.maxValue);
            }

            const snapshot = await query.limit(filters.limit || 50).get();
            let results = snapshot.docs.map(doc => doc.data());

            // Apply text search
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                results = results.filter(r =>
                    r.trackingNumber.toLowerCase().includes(term) ||
                    r.originCity.toLowerCase().includes(term) ||
                    r.destCity.toLowerCase().includes(term) ||
                    r.senderName.toLowerCase().includes(term) ||
                    r.recipientName.toLowerCase().includes(term)
                );
            }

            return { success: true, results, count: results.length };
        } catch (error) {
            console.error('Advanced search error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate API documentation
     */
    generateDocumentation() {
        return {
            title: 'FedEx Clone REST API',
            version: '1.0.0',
            baseUrl: 'https://api.fedexclone.com/api',
            authentication: {
                type: 'Bearer Token',
                header: 'Authorization: Bearer YOUR_TOKEN'
            },
            endpoints: this.apiEndpoints,
            webhookEvents: [
                'shipment.created',
                'shipment.updated',
                'shipment.picked_up',
                'shipment.in_transit',
                'shipment.delivered',
                'shipment.cancelled',
                'delivery.completed',
                'payment.received',
                'driver.verified',
                'driver.status_changed'
            ],
            rateLimits: {
                requests: 1000,
                period: 'hour',
                message: 'Rate limit exceeded'
            },
            errorCodes: {
                400: 'Bad Request',
                401: 'Unauthorized',
                403: 'Forbidden',
                404: 'Not Found',
                422: 'Validation Error',
                429: 'Too Many Requests',
                500: 'Internal Server Error'
            }
        };
    }

    /**
     * Get API keys for user
     */
    async getAPIKeys(userId) {
        try {
            const snapshot = await this.db.collection('apiKeys')
                .where('userId', '==', userId)
                .where('active', '==', true)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                key: doc.data().key,
                name: doc.data().name,
                createdAt: doc.data().createdAt,
                lastUsed: doc.data().lastUsed
            }));
        } catch (error) {
            console.error('Get API keys error:', error);
            return [];
        }
    }

    /**
     * Create new API key
     */
    async createAPIKey(userId, keyName) {
        try {
            const apiKey = this._generateAPIKey();
            
            const docRef = await this.db.collection('apiKeys').add({
                userId,
                key: apiKey,
                name: keyName,
                active: true,
                createdAt: new Date(),
                lastUsed: null,
                permissions: ['read:shipments', 'create:shipments', 'read:tracking']
            });

            return { success: true, apiKey, keyId: docRef.id };
        } catch (error) {
            console.error('Create API key error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Revoke API key
     */
    async revokeAPIKey(keyId) {
        try {
            await this.db.collection('apiKeys').doc(keyId).update({
                active: false,
                revokedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Revoke API key error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate random API key
     */
    _generateAPIKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'fex_';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
}

// Create singleton instance
const apiService = new APIService();
window.apiService = apiService;
