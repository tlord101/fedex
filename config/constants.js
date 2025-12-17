/**
 * Application Constants
 */

const CONSTANTS = {
    // Shipping Types
    SHIPPING_TYPES: {
        STANDARD: 'standard',
        EXPRESS: 'express',
        OVERNIGHT: 'overnight',
        INTERNATIONAL: 'international'
    },

    // Delivery Status
    STATUS: {
        PENDING: 'pending',
        PICKED_UP: 'picked_up',
        IN_TRANSIT: 'in_transit',
        OUT_FOR_DELIVERY: 'out_for_delivery',
        DELIVERED: 'delivered',
        FAILED: 'failed',
        CANCELLED: 'cancelled',
        RETURNED: 'returned'
    },

    // User Roles
    USER_ROLES: {
        CUSTOMER: 'customer',
        DRIVER: 'driver',
        ADMIN: 'admin',
        AGENT: 'agent'
    },

    // Payment Status
    PAYMENT_STATUS: {
        PENDING: 'pending',
        PAID: 'paid',
        FAILED: 'failed',
        REFUNDED: 'refunded',
        PARTIALLY_REFUNDED: 'partially_refunded'
    },

    // Collections
    COLLECTIONS: {
        USERS: 'users',
        SHIPMENTS: 'shipments',
        TRACKING_EVENTS: 'tracking_events',
        RATES: 'rates',
        LOCATIONS: 'locations',
        DRIVERS: 'drivers',
        PAYMENTS: 'payments',
        INVOICES: 'invoices'
    },

    // API Endpoints (for future REST integration)
    API_BASE_URL: 'https://api.fedex-clone.com/v1',

    // Pagination
    PAGE_SIZE: 20,

    // Timeouts
    REQUEST_TIMEOUT: 30000,
    SESSION_TIMEOUT: 3600000, // 1 hour

    // Error Messages
    ERRORS: {
        NETWORK: 'Network error. Please check your connection.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        NOT_FOUND: 'Resource not found.',
        VALIDATION: 'Please check your input and try again.',
        SERVER_ERROR: 'Server error. Please try again later.'
    }
};

// Export for use in other modules
window.CONSTANTS = CONSTANTS;
