/**
 * Parcel Service
 * Handles all Firestore operations for parcel tracking
 */

(function() {
    'use strict';

    const ParcelService = {
        // Create a new parcel with origin, destination, and duration
        async createParcel(parcelData) {
            try {
                const { origin, destination, durationMinutes } = parcelData;
                
                // Validate input
                if (!origin || !origin.name || !origin.coords || origin.coords.length !== 2) {
                    throw new Error('Invalid origin data');
                }
                if (!destination || !destination.name || !destination.coords || destination.coords.length !== 2) {
                    throw new Error('Invalid destination data');
                }
                if (!durationMinutes || durationMinutes < 1) {
                    throw new Error('Invalid duration');
                }

                const now = Date.now();
                const endTime = now + (durationMinutes * 60 * 1000);

                const parcel = {
                    origin: {
                        name: origin.name,
                        coords: origin.coords
                    },
                    destination: {
                        name: destination.name,
                        coords: destination.coords
                    },
                    startTime: now,
                    endTime: endTime,
                    durationMinutes: durationMinutes,
                    progressPercent: 0,
                    currentStatus: 'Picked Up',
                    lastUpdated: now,
                    createdAt: now,
                    isActive: true
                };

                // Add to Firestore
                const docRef = await window.firebaseApp.db.collection('parcels').add(parcel);
                
                console.log('Parcel created with ID:', docRef.id);
                return docRef.id;
            } catch (error) {
                console.error('Error creating parcel:', error);
                throw error;
            }
        },

        // Get a specific parcel by ID
        async getParcel(parcelId) {
            try {
                const doc = await window.firebaseApp.db.collection('parcels').doc(parcelId).get();
                
                if (!doc.exists) {
                    throw new Error('Parcel not found');
                }

                return {
                    id: doc.id,
                    ...doc.data()
                };
            } catch (error) {
                console.error('Error fetching parcel:', error);
                throw error;
            }
        },

        // Get recent parcels (for admin panel)
        async getRecentParcels(limit = 10) {
            try {
                const snapshot = await window.firebaseApp.db.collection('parcels')
                    .orderBy('createdAt', 'desc')
                    .limit(limit)
                    .get();

                const parcels = [];
                snapshot.forEach(doc => {
                    parcels.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                return parcels;
            } catch (error) {
                console.error('Error fetching recent parcels:', error);
                throw error;
            }
        },

        // Listen to real-time updates for a parcel
        listenToParcel(parcelId, callback) {
            try {
                const unsubscribe = window.firebaseApp.db.collection('parcels')
                    .doc(parcelId)
                    .onSnapshot(doc => {
                        if (doc.exists) {
                            callback({
                                id: doc.id,
                                ...doc.data()
                            });
                        } else {
                            callback(null);
                        }
                    }, error => {
                        console.error('Error listening to parcel:', error);
                        callback(null, error);
                    });

                return unsubscribe;
            } catch (error) {
                console.error('Error setting up parcel listener:', error);
                throw error;
            }
        },

        // Update parcel progress (used by cron job)
        async updateParcelProgress(parcelId, progressPercent, status) {
            try {
                await window.firebaseApp.db.collection('parcels').doc(parcelId).update({
                    progressPercent: progressPercent,
                    currentStatus: status,
                    lastUpdated: Date.now()
                });
            } catch (error) {
                console.error('Error updating parcel progress:', error);
                throw error;
            }
        },

        // Delete a parcel
        async deleteParcel(parcelId) {
            try {
                await window.firebaseApp.db.collection('parcels').doc(parcelId).delete();
                console.log('Parcel deleted:', parcelId);
            } catch (error) {
                console.error('Error deleting parcel:', error);
                throw error;
            }
        },

        // Calculate current progress based on time (frontend read-only calculation)
        calculateProgress(startTime, endTime) {
            const now = Date.now();
            
            if (now < startTime) {
                return 0;
            }
            
            if (now >= endTime) {
                return 100;
            }
            
            const totalDuration = endTime - startTime;
            const elapsed = now - startTime;
            const progress = (elapsed / totalDuration) * 100;
            
            return Math.min(100, Math.max(0, progress));
        },

        // Get status based on progress percentage
        getStatusFromProgress(progressPercent) {
            if (progressPercent >= 100) {
                return 'Delivered';
            } else if (progressPercent >= 75) {
                return 'Out for Delivery';
            } else if (progressPercent >= 25) {
                return 'In Transit';
            } else {
                return 'Picked Up';
            }
        },

        // Calculate interpolated coordinates based on progress
        interpolatePosition(origin, destination, progressPercent) {
            const progress = Math.min(100, Math.max(0, progressPercent)) / 100;
            
            const lat = origin[0] + (destination[0] - origin[0]) * progress;
            const lng = origin[1] + (destination[1] - origin[1]) * progress;
            
            return [lat, lng];
        },

        // Calculate ETA
        calculateETA(startTime, endTime) {
            const now = Date.now();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                return 'Delivered';
            }
            
            const minutes = Math.floor(remaining / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) {
                return `${days} day${days > 1 ? 's' : ''}`;
            } else if (hours > 0) {
                return `${hours} hour${hours > 1 ? 's' : ''}`;
            } else if (minutes > 0) {
                return `${minutes} minute${minutes > 1 ? 's' : ''}`;
            } else {
                return 'Less than 1 minute';
            }
        },

        // Format timestamp
        formatTimestamp(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    // Export to window
    window.parcelService = ParcelService;
})();
