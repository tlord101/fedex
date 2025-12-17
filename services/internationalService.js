/**
 * International Service
 * Handles international shipping, customs, and multi-currency support
 */

class InternationalService {
    constructor() {
        this.db = window.firebaseApp.db;
        this.countries = {};
        this.loadCountriesData();
    }

    /**
     * Load countries database
     */
    async loadCountriesData() {
        try {
            const snap = await this.db.collection('countries').get();
            snap.forEach(doc => {
                this.countries[doc.id] = doc.data();
            });
        } catch (error) {
            console.error('Load countries error:', error);
        }
    }

    /**
     * Get country information
     */
    getCountry(countryCode) {
        return this.countries[countryCode] || null;
    }

    /**
     * Get all countries
     */
    getAllCountries() {
        return Object.values(this.countries);
    }

    /**
     * Calculate customs duty
     */
    calculateCustomsDuty(itemValue, itemType, destinationCountry) {
        const country = this.getCountry(destinationCountry);
        if (!country) {
            return { duty: 0, taxRate: 0, error: 'Country not found' };
        }

        // Get duty rate by item type
        const itemTypeRates = country.dutyRates || {};
        const dutyRate = itemTypeRates[itemType] || country.defaultDutyRate || 0;

        // Calculate duty
        const dutyAmount = (itemValue * dutyRate) / 100;

        // Calculate tax (VAT)
        const taxRate = country.vat || 0;
        const taxAmount = ((itemValue + dutyAmount) * taxRate) / 100;

        return {
            success: true,
            itemValue,
            dutyRate: dutyRate / 100,
            dutyAmount: dutyAmount.toFixed(2),
            taxRate: taxRate / 100,
            taxAmount: taxAmount.toFixed(2),
            totalDutyAndTax: (dutyAmount + taxAmount).toFixed(2)
        };
    }

    /**
     * Get shipping restrictions
     */
    getShippingRestrictions(destinationCountry) {
        const country = this.getCountry(destinationCountry);
        if (!country) {
            return { error: 'Country not found' };
        }

        return {
            success: true,
            country: country.name,
            prohibitedItems: country.prohibitedItems || [],
            restrictedItems: country.restrictedItems || [],
            requiresDeclaration: country.requiresDeclaration !== false,
            customsDocuments: country.customsDocuments || ['CN23', 'CN22'],
            maxWeight: country.maxWeight || 30,
            maxValue: country.maxValue || 5000
        };
    }

    /**
     * Validate international shipment
     */
    validateInternationalShipment(shipmentData) {
        const errors = [];
        const warnings = [];

        const country = this.getCountry(shipmentData.destCountry);
        if (!country) {
            errors.push('Invalid destination country');
            return { valid: false, errors, warnings };
        }

        // Check weight limit
        if (shipmentData.weight > (country.maxWeight || 30)) {
            errors.push(`Weight exceeds limit of ${country.maxWeight}kg`);
        }

        // Check value limit
        if (shipmentData.itemValue > (country.maxValue || 5000)) {
            errors.push(`Item value exceeds limit of $${country.maxValue}`);
        }

        // Check prohibited items
        const prohibitedItems = country.prohibitedItems || [];
        if (prohibitedItems.some(item => shipmentData.itemType.includes(item))) {
            errors.push('Item type is prohibited in destination country');
        }

        // Check if declaration required
        if (country.requiresDeclaration && !shipmentData.customsDeclaration) {
            warnings.push('Customs declaration required for this destination');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Generate customs form (CN23 or CN22)
     */
    generateCustomsForm(shipmentData, formType = 'CN23') {
        return {
            formType,
            generatedAt: new Date(),
            shipper: {
                name: shipmentData.senderName,
                address: shipmentData.originCity,
                country: shipmentData.originCountry,
                phone: shipmentData.senderPhone,
                email: shipmentData.senderEmail
            },
            recipient: {
                name: shipmentData.recipientName,
                address: `${shipmentData.destCity}, ${shipmentData.destState}`,
                country: shipmentData.destCountry,
                phone: shipmentData.recipientPhone,
                email: shipmentData.recipientEmail
            },
            contents: {
                description: shipmentData.itemDescription,
                quantity: shipmentData.quantity || 1,
                weight: shipmentData.weight,
                value: shipmentData.itemValue,
                currency: shipmentData.currency || 'USD'
            },
            totalWeight: shipmentData.weight,
            totalValue: shipmentData.itemValue,
            declaration: shipmentData.customsDeclaration || '',
            trackingNumber: shipmentData.trackingNumber,
            referenceNumber: shipmentData.id
        };
    }

    /**
     * Convert currency
     */
    async convertCurrency(amount, fromCurrency, toCurrency) {
        try {
            if (fromCurrency === toCurrency) {
                return { success: true, originalAmount: amount, convertedAmount: amount, rate: 1 };
            }

            // Get conversion rate from Firestore cache
            const rateDoc = await this.db.collection('exchangeRates')
                .doc(`${fromCurrency}_${toCurrency}`)
                .get();

            if (rateDoc.exists) {
                const rate = rateDoc.data().rate;
                const convertedAmount = (amount * rate).toFixed(2);
                return {
                    success: true,
                    originalAmount: amount,
                    originalCurrency: fromCurrency,
                    convertedAmount,
                    convertedCurrency: toCurrency,
                    rate,
                    timestamp: rateDoc.data().lastUpdated
                };
            }

            return {
                success: false,
                error: 'Exchange rate not available'
            };
        } catch (error) {
            console.error('Currency conversion error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get shipping time estimate for international shipment
     */
    getInternationalShippingTime(origin, destination, shippingType) {
        const origin_code = origin.toUpperCase();
        const dest_code = destination.toUpperCase();

        // Estimate based on distance (simplified)
        const isAdjacent = ['US', 'CA', 'MX'].some(c => c === origin_code) &&
                          ['US', 'CA', 'MX'].some(c => c === dest_code);

        let estimate;
        if (shippingType === 'OVERNIGHT') {
            estimate = isAdjacent ? 1 : 3;
        } else if (shippingType === 'EXPRESS') {
            estimate = isAdjacent ? 2 : 7;
        } else {
            estimate = isAdjacent ? 3 : 14;
        }

        return {
            estimatedDays: estimate,
            estimatedDeliveryDate: new Date(Date.now() + estimate * 24 * 60 * 60 * 1000)
        };
    }

    /**
     * Calculate international shipping cost
     */
    calculateInternationalShippingCost(weight, originCountry, destCountry, shippingType) {
        const baseRate = 20; // Base international rate
        const weightMultiplier = weight * 2; // $2 per kg
        
        const typeMultiplier = {
            'STANDARD': 1,
            'EXPRESS': 1.5,
            'OVERNIGHT': 2.5
        };

        const multiplier = typeMultiplier[shippingType] || 1;

        const baseShipping = (baseRate + weightMultiplier) * multiplier;

        // Add customs clearance fee
        const customsFee = 25;

        // Add insurance (optional, 1% of declared value)
        const insurance = 0; // User decides

        const totalCost = baseShipping + customsFee + insurance;

        return {
            baseShipping: baseShipping.toFixed(2),
            customsFee: customsFee.toFixed(2),
            insurance: insurance.toFixed(2),
            totalCost: totalCost.toFixed(2),
            breakdown: {
                weight: weight,
                shippingType,
                origin: originCountry,
                destination: destCountry
            }
        };
    }

    /**
     * Check if insurance is recommended
     */
    recommendInsurance(itemValue, destination) {
        const country = this.getCountry(destination);
        
        // Recommend insurance if:
        // 1. Item value > $500
        // 2. Destination country has high loss/damage rate
        // 3. Shipping type is STANDARD (longer transit)

        return {
            recommended: itemValue > 500 || (country && country.highRisk),
            estimatedCost: (itemValue * 0.01).toFixed(2),
            coverage: itemValue > 500 ? '100% coverage' : '50% coverage'
        };
    }

    /**
     * Initialize countries database (setup)
     */
    async initializeCountriesDatabase() {
        const countries = [
            {
                code: 'CA',
                name: 'Canada',
                defaultDutyRate: 5,
                vat: 5,
                maxWeight: 30,
                maxValue: 5000,
                dutyRates: { 'electronics': 10, 'textiles': 15, 'food': 0 },
                prohibitedItems: ['weapons', 'narcotics'],
                restrictedItems: ['lithium batteries', 'hazmat'],
                customsDocuments: ['CN23', 'CN22']
            },
            {
                code: 'UK',
                name: 'United Kingdom',
                defaultDutyRate: 10,
                vat: 20,
                maxWeight: 30,
                maxValue: 3000,
                dutyRates: { 'electronics': 15, 'textiles': 12, 'food': 5 },
                prohibitedItems: ['weapons'],
                restrictedItems: ['hazmat'],
                customsDocuments: ['CN23', 'CN22', 'C86'],
                highRisk: false
            },
            {
                code: 'AU',
                name: 'Australia',
                defaultDutyRate: 15,
                vat: 10,
                maxWeight: 20,
                maxValue: 2000,
                dutyRates: { 'electronics': 10, 'food': 100, 'animals': 100 },
                prohibitedItems: ['food', 'animals', 'plants'],
                restrictedItems: ['hazmat'],
                customsDocuments: ['CN23', 'CN22'],
                highRisk: true
            },
            {
                code: 'JP',
                name: 'Japan',
                defaultDutyRate: 5,
                vat: 10,
                maxWeight: 30,
                maxValue: 4000,
                dutyRates: { 'electronics': 0, 'textiles': 10, 'food': 15 },
                prohibitedItems: ['weapons', 'narcotics'],
                restrictedItems: ['hazmat'],
                customsDocuments: ['CN23', 'CN22']
            }
        ];

        try {
            for (const country of countries) {
                await this.db.collection('countries').doc(country.code).set(country);
            }
            console.log('Countries database initialized');
            await this.loadCountriesData();
        } catch (error) {
            console.error('Initialize countries error:', error);
        }
    }
}

// Create singleton instance
const internationalService = new InternationalService();
window.internationalService = internationalService;
