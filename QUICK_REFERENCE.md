# FedEx Clone - Developer Quick Reference

## 🚀 Quick Start

### Access Points
| Feature | URL | Status |
|---------|-----|--------|
| Public Site | `index.html` | ✅ Live |
| Authentication | `login.html` / `signup.html` | ✅ Live |
| Ship Parcel | `ship.html` | ✅ Live |
| Track Parcel | `tracking.html` | ✅ Live |
| User Dashboard | `dashboard.html` | ✅ Live |
| Driver Register | `driver-register.html` | ✅ Live |
| Driver Dashboard | `driver-dashboard.html` | ✅ Live |
| Admin Panel | `admin-dashboard.html` | ✅ Live |
| Int'l Shipping | `international-shipping.html` | ✅ Live |
| API Docs | `api-documentation.html` | ✅ Live |

---

## 🔌 Service Methods Quick Reference

### 🔐 authService
```javascript
// Authentication
await authService.login(email, password)
await authService.signup(email, password, fullName)
await authService.logout()
await authService.resetPassword(email)
await authService.subscribe(callback) // Real-time auth state

// Properties
window.firebaseAuth.currentUser // Current logged-in user
```

### 📦 shipmentService
```javascript
// Shipment Operations
await shipmentService.createShipment(shipmentData)
await shipmentService.getShipment(shipmentId)
await shipmentService.getShipmentByTracking(trackingNumber)
await shipmentService.updateShipment(shipmentId, updates)
await shipmentService.getUserShipments(userId)
await shipmentService.getShipmentsByStatus(status)
```

### 💰 rateService
```javascript
// Rate Calculation
await rateService.calculateRate(weight, distance, shippingType)
await rateService.getShippingTypes()
await rateService.updateRate(rateId, updates)
```

### 📍 locationService
```javascript
// Location & Tracking
await locationService.getCurrentLocation()
await locationService.addTrackingEvent(shipmentId, event)
await locationService.getTrackingEvents(shipmentId)
await locationService.subscribeToTracking(shipmentId, callback)
```

### 💳 paymentService
```javascript
// Payment Operations
await paymentService.createPayment(shipmentId, amount, method)
await paymentService.getPaymentStatus(paymentId)
await paymentService.generateInvoice(shipmentId)
await paymentService.processRefund(paymentId, amount)
```

### 👨‍💼 driverService
```javascript
// Driver Management
await driverService.registerDriver(driverData)
await driverService.getDriver(driverId)
await driverService.updateDriverLocation(driverId, lat, lng)
await driverService.assignShipment(driverId, shipmentId)
await driverService.completeDelivery(driverId, shipmentId, proof)
await driverService.rateDriver(driverId, rating, comment)
await driverService.getAvailableDrivers()
await driverService.getDriverEarnings(driverId, startDate, endDate)
```

### 👨‍💻 adminService
```javascript
// Admin Operations
await adminService.getSystemStats()
await adminService.getAllUsers(filters)
await adminService.getAllShipments(filters)
await adminService.getAllDrivers(filters)
await adminService.verifyDriver(driverId)
await adminService.rejectDriver(driverId, reason)
await adminService.deactivateUser(userId)
await adminService.updateRate(rateId, updates)
await adminService.getSystemSettings()
await adminService.updateSystemSettings(settings)
```

### 🌍 internationalService
```javascript
// International Shipping
internationalService.getCountry(countryCode)
internationalService.getAllCountries()
internationalService.calculateCustomsDuty(value, type, country)
internationalService.getShippingRestrictions(country)
internationalService.validateInternationalShipment(shipment)
internationalService.generateCustomsForm(shipment, formType)
await internationalService.convertCurrency(amount, from, to)
internationalService.getInternationalShippingTime(origin, dest, type)
internationalService.calculateInternationalShippingCost(weight, orig, dest, type)
internationalService.recommendInsurance(value, country)
```

### 🔌 apiService
```javascript
// API Management
apiService.getEndpoints()
await apiService.registerWebhook(url, events)
await apiService.getWebhooks()
await apiService.triggerWebhook(webhookId, eventType, data)
await apiService.getWebhookLogs(webhookId)
await apiService.batchCreateShipments(shipmentsArray)
await apiService.advancedSearch(filters)
apiService.generateDocumentation()
await apiService.getAPIKeys(userId)
await apiService.createAPIKey(userId, name)
await apiService.revokeAPIKey(keyId)
```

### 🎨 uiService
```javascript
// UI Utilities
uiService.showToast(message, type)
uiService.showLoading(show)
uiService.formatDate(date)
uiService.formatCurrency(amount)
uiService.formatPhone(phone)
```

---

## 🗄️ Firestore Queries

### Common Patterns
```javascript
// Single document
const doc = await db.collection('shipments').doc(id).get()

// Query with filter
const query = await db.collection('shipments')
  .where('status', '==', 'DELIVERED')
  .orderBy('deliveredAt', 'desc')
  .limit(10)
  .get()

// Real-time listener
db.collection('drivers').doc(driverId).onSnapshot(doc => {
  console.log('Updated:', doc.data())
})

// Batch write
const batch = db.batch()
batch.set(docRef1, data1)
batch.update(docRef2, data2)
await batch.commit()
```

### Collection Structures
```
users/{uid}
├── email: string
├── role: "customer|driver|admin"
├── profile: object

shipments/{shipmentId}
├── trackingNumber: string
├── status: "PENDING|IN_TRANSIT|DELIVERED"
├── senderName: string
├── recipientName: string

drivers/{driverId}
├── fullName: string
├── verified: boolean
├── rating: number
├── currentLocation: geolocation

payments/{paymentId}
├── shipmentId: string
├── amount: number
├── status: "pending|completed|failed"
```

---

## 🎯 Common Tasks

### Add New Collection
```javascript
// 1. Create service
class NewService {
  async add(data) {
    return await window.firebaseApp.db.collection('newCollection')
      .add({...data, createdAt: new Date()})
  }
}

// 2. Export singleton
window.newService = new NewService()

// 3. Use in page
const result = await newService.add(data)
```

### Add Page with Form
```html
<!-- 1. Create HTML with form -->
<form id="myForm">
  <input type="text" id="name" required>
  <button type="submit">Submit</button>
</form>

<!-- 2. Add JavaScript -->
<script>
document.getElementById('myForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = document.getElementById('name').value
  const result = await someService.create({name})
  if (result.success) {
    uiService.showToast('Success!')
  }
})
</script>
```

### Real-Time Update
```javascript
// Subscribe to changes
db.collection('shipments').doc(shipmentId).onSnapshot(doc => {
  const shipment = doc.data()
  // Update UI
  document.getElementById('status').textContent = shipment.status
})
```

### Filter & Search
```javascript
// Filter query
const results = await db.collection('shipments')
  .where('status', '==', 'PENDING')
  .where('totalCost', '>', 100)
  .get()

// Client-side filter
let filtered = results.filter(r => 
  r.originCity.includes('New York')
)
```

---

## 📱 UI Components

### Toast Notification
```javascript
uiService.showToast('Message', 'success|error|info')
// Auto-dismisses after 3 seconds
```

### Loading State
```javascript
uiService.showLoading(true)  // Show
uiService.showLoading(false) // Hide
```

### Form Validation
```html
<input type="email" id="email" required>
<input type="number" id="weight" min="0" step="0.1" required>
<input type="tel" id="phone" pattern="[0-9-]{10,}" required>
```

### Status Badge
```html
<span class="status-badge status-active">Active</span>
<span class="status-badge status-pending">Pending</span>
<span class="status-badge status-delivered">Delivered</span>
```

### Form Layout
```html
<div class="form-group">
  <label>Field Name</label>
  <input type="text" required>
</div>

<div class="form-row">
  <div class="form-group">First Col</div>
  <div class="form-group">Second Col</div>
</div>
```

---

## 🔒 Authentication Patterns

### Check User Logged In
```javascript
authService.subscribe((user) => {
  if (!user) {
    window.location.href = '../login.html'
  }
})
```

### Get Current User
```javascript
const user = window.firebaseAuth.currentUser
const email = user.email
const uid = user.uid
```

### Check Admin Role
```javascript
const user = window.firebaseAuth.currentUser
const userDoc = await window.firebaseApp.db
  .collection('users').doc(user.uid).get()
const isAdmin = userDoc.data().role === 'admin'
```

---

## 🐛 Debugging Tips

### Console Logging
```javascript
console.log('Value:', value)
console.table(arrayOfObjects)
console.error('Error:', error)
```

### Check Firestore
1. Open Firebase Console
2. Click Firestore Database
3. View collections and documents
4. Check security rules

### Check Authentication
1. Firebase Console → Authentication
2. View registered users
3. Check email verification status

### Network Requests
1. Open DevTools (F12)
2. Network tab to see API calls
3. Check response times and errors

### Local Testing
```bash
# Serve locally
firebase serve

# Opens at http://localhost:5000
# Check console for errors
```

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| README.md | Project overview |
| API.md | API endpoint reference |
| SETUP.md | Installation guide |
| IMPLEMENTATION_COMPLETE.md | Full implementation details |
| PHASES_6-10_REPORT.md | Current phase status |

---

## ⚡ Performance Tips

### Reduce Firestore Reads
```javascript
// ❌ Bad: Read entire collection
const all = await db.collection('shipments').get()
const filtered = all.docs.filter(d => d.data().status === 'PENDING')

// ✅ Good: Filter in query
const filtered = await db.collection('shipments')
  .where('status', '==', 'PENDING')
  .get()
```

### Cache Results
```javascript
let cache = null
async function getData() {
  if (cache) return cache
  cache = await someService.fetch()
  return cache
}
```

### Limit Results
```javascript
const docs = await db.collection('shipments')
  .limit(50)  // Don't fetch all
  .get()
```

### Create Indexes
Firebase will suggest indexes when needed. Create them in Firebase Console for faster queries.

---

## 🔄 Deployment

### Deploy to Firebase Hosting
```bash
firebase login
firebase deploy
# Opens at https://[project-id].web.app
```

### Deploy to Netlify
```bash
netlify deploy
# Auto-deploys from Git push
```

### Custom Domain
1. Firebase Console → Hosting → Domain
2. Add custom domain
3. Follow DNS setup instructions

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't login | Check email/password, verify user exists in Firebase |
| Shipment not saving | Check Firestore security rules and user permissions |
| Data not updating | Verify real-time listener is attached and active |
| API request failing | Check browser console for CORS errors, verify URL |
| Map not showing | Ensure Google Maps API key is configured |
| Images not loading | Check Firebase Storage rules and URL validity |

---

## 💾 Backup & Recovery

### Export Data
```bash
firebase firestore:export gs://bucket-name/export
```

### Import Data
```bash
firebase firestore:import gs://bucket-name/export
```

### Database Rules Backup
1. Firebase Console → Firestore → Rules
2. Copy current rules
3. Save to version control

---

## 🎓 Learning Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Query Guide:** https://firebase.google.com/docs/firestore/query-data/queries
- **JavaScript MDN:** https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **CSS Grid Guide:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout

---

**Last Updated:** January 2024  
**Version:** 2.0  
**Status:** Complete for Phases 0-8
