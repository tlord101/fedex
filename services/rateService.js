/**
 * Rate Calculator Service
 * Handles shipping rate calculations
 */

class RateService {
    constructor() {
        this.db = window.firebaseApp.db;
        this.baseRates = {
            standard: {
                base: 5.99,
                perPound: 0.50
            },
            express: {
                base: 12.99,
                perPound: 0.75
            },
            overnight: {
                base: 24.99,
                perPound: 1.00
            },
            international: {
                base: 35.00,
                perPound: 1.50
            }
        };
    }

    /**
     * Calculate shipping rate
     */
    calculateRate(shippingType, weight, distance = null, isInternational = false) {
        try {
            const rates = this.baseRates[shippingType] || this.baseRates.standard;
            let totalCost = rates.base + (weight * rates.perPound);

            // Distance surcharge (if provided)
            if (distance && distance > 1000) {
                totalCost *= 1.10; // 10% surcharge for long distance
            }

            // International surcharge
            if (isInternational) {
                totalCost *= 1.25; // 25% surcharge for international
            }

            return {
                baseRate: rates.base,
                weightCharge: weight * rates.perPound,
                surcharges: totalCost - rates.base - (weight * rates.perPound),
                totalCost: Math.round(totalCost * 100) / 100,
                estimatedDelivery: this.getEstimatedDelivery(shippingType)
            };
        } catch (error) {
            console.error('Calculate rate error:', error);
            return null;
        }
    }

    /**
     * Get estimated delivery date
     */
    getEstimatedDelivery(shippingType) {
        const today = new Date();
        const deliveryDays = {
            standard: 5,
            express: 3,
            overnight: 1,
            international: 10
        };

        const days = deliveryDays[shippingType] || 5;
        const deliveryDate = new Date(today);
        deliveryDate.setDate(deliveryDate.getDate() + days);

        return deliveryDate;
    }

    /**
     * Get all available shipping types with rates
     */
    async getShippingOptions(shipmentDetails) {
        try {
            const options = [];

            for (const [type, _] of Object.entries(CONSTANTS.SHIPPING_TYPES)) {
                const typeKey = type.toLowerCase();
                const rateInfo = this.calculateRate(
                    typeKey,
                    shipmentDetails.weight || 1,
                    shipmentDetails.distance,
                    shipmentDetails.isInternational
                );

                options.push({
                    type: typeKey,
                    displayName: this.formatShippingType(typeKey),
                    ...rateInfo
                });
            }

            return { success: true, options };
        } catch (error) {
            console.error('Get shipping options error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Format shipping type for display
     */
    formatShippingType(type) {
        const names = {
            standard: 'Standard (5 days)',
            express: 'Express (3 days)',
            overnight: 'Overnight',
            international: 'International'
        };
        return names[type] || type;
    }

    /**
     * Apply discount/promo code
     */
    applyDiscount(rate, discountCode) {
        const discounts = {
            'WELCOME10': 0.10,
            'SAVE15': 0.15,
            'BULK20': 0.20
        };

        const discountPercent = discounts[discountCode] || 0;
        const discountAmount = rate * discountPercent;
        const finalRate = rate - discountAmount;

        return {
            originalRate: rate,
            discountPercent: discountPercent * 100,
            discountAmount: Math.round(discountAmount * 100) / 100,
            finalRate: Math.round(finalRate * 100) / 100
        };
    }
}

// Create singleton instance
const rateService = new RateService();
window.rateService = rateService;
