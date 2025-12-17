// Payment Service
// Handles payment processing and invoicing

class PaymentService {
    constructor() {
        this.db = window.firebaseApp.db;
    }

    /**
     * Create payment
     */
    async createPayment(paymentData) {
        try {
            const paymentRef = await this.db.collection(CONSTANTS.COLLECTIONS.PAYMENTS).add({
                ...paymentData,
                status: CONSTANTS.PAYMENT_STATUS.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return { success: true, paymentId: paymentRef.id };
        } catch (error) {
            console.error('Create payment error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get payment
     */
    async getPayment(paymentId) {
        try {
            const paymentSnap = await this.db.collection(CONSTANTS.COLLECTIONS.PAYMENTS)
                .doc(paymentId).get();
            return paymentSnap.exists ? paymentSnap.data() : null;
        } catch (error) {
            console.error('Get payment error:', error);
            return null;
        }
    }

    /**
     * Get user payments
     */
    async getUserPayments(userId) {
        try {
            const snapshot = await this.db.collection(CONSTANTS.COLLECTIONS.PAYMENTS)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get user payments error:', error);
            return [];
        }
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(paymentId, status) {
        try {
            await this.db.collection(CONSTANTS.COLLECTIONS.PAYMENTS).doc(paymentId).update({
                status,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Update payment status error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process refund
     */
    async processRefund(paymentId, amount, reason) {
        try {
            const payment = await this.getPayment(paymentId);
            if (!payment) {
                return { success: false, error: 'Payment not found' };
            }

            const refundedAmount = (payment.refundedAmount || 0) + amount;
            const refundStatus = refundedAmount >= payment.amount 
                ? CONSTANTS.PAYMENT_STATUS.REFUNDED 
                : CONSTANTS.PAYMENT_STATUS.PARTIALLY_REFUNDED;

            await this.db.collection(CONSTANTS.COLLECTIONS.PAYMENTS).doc(paymentId).update({
                refundedAmount,
                status: refundStatus,
                refundReason: reason,
                refundedAt: new Date(),
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Process refund error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate invoice
     */
    async generateInvoice(shipmentId, paymentId) {
        try {
            const invoiceRef = await this.db.collection(CONSTANTS.COLLECTIONS.INVOICES).add({
                shipmentId,
                paymentId,
                invoiceNumber: `INV-${Date.now()}`,
                createdAt: new Date(),
                status: 'generated'
            });

            return { success: true, invoiceId: invoiceRef.id };
        } catch (error) {
            console.error('Generate invoice error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const paymentService = new PaymentService();
window.paymentService = paymentService;
