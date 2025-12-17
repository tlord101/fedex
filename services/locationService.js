// Location Service
// Handles location data and pickup points

class LocationService {
    constructor() {
        this.db = window.firebaseApp.db;
    }

    /**
     * Get nearby locations
     */
    async getNearbyLocations(latitude, longitude, radiusKm = 10) {
        try {
            // Note: Firestore doesn't have native geospatial queries
            // This is a simplified implementation
            const snapshot = await this.db.collection(CONSTANTS.COLLECTIONS.LOCATIONS).get();
            
            const locations = snapshot.docs.map(doc => doc.data());
            
            // Filter by distance (simplified)
            return locations.filter(loc => {
                const distance = this.calculateDistance(
                    latitude, longitude,
                    loc.latitude, loc.longitude
                );
                return distance <= radiusKm;
            });
        } catch (error) {
            console.error('Get nearby locations error:', error);
            return [];
        }
    }

    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Get location by ID
     */
    async getLocation(locationId) {
        try {
            const locationSnap = await this.db.collection(CONSTANTS.COLLECTIONS.LOCATIONS)
                .doc(locationId).get();
            return locationSnap.exists ? locationSnap.data() : null;
        } catch (error) {
            console.error('Get location error:', error);
            return null;
        }
    }

    /**
     * Get all locations
     */
    async getAllLocations() {
        try {
            const snapshot = await this.db.collection(CONSTANTS.COLLECTIONS.LOCATIONS)
                .orderBy('name')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Get all locations error:', error);
            return [];
        }
    }
}

// Create singleton instance
const locationService = new LocationService();
window.locationService = locationService;
