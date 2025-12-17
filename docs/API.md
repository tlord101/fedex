# API Reference - FedEx Clone

## Authentication Service

### Methods

#### `signUp(email, password, userData)`
Create a new user account.

**Parameters:**
- `email` (string): User email
- `password` (string): User password (min 8 chars)
- `userData` (object): Additional user data
  - `displayName`: User's full name
  - `phone`: Phone number
  - `address`: Address object

**Returns:** Promise with `{ success, uid, error }`

```javascript
const result = await authService.signUp('user@example.com', 'password123', {
  displayName: 'John Doe',
  phone: '555-1234',
  address: { city: 'New York' }
});
```

#### `signIn(email, password)`
Sign in with email and password.

**Returns:** Promise with `{ success, user, error }`

```javascript
const result = await authService.signIn('user@example.com', 'password123');
```

#### `signInWithGoogle()`
Sign in using Google OAuth.

**Returns:** Promise with `{ success, user, error }`

```javascript
const result = await authService.signInWithGoogle();
```

#### `signOut()`
Sign out current user.

**Returns:** Promise with `{ success, error }`

```javascript
await authService.signOut();
```

#### `resetPassword(email)`
Send password reset email.

**Returns:** Promise with `{ success, error }`

```javascript
const result = await authService.resetPassword('user@example.com');
```

#### `updateProfile(uid, updates)`
Update user profile.

**Parameters:**
- `uid` (string): User ID
- `updates` (object): Fields to update

**Returns:** Promise with `{ success, error }`

```javascript
await authService.updateProfile(userId, {
  displayName: 'New Name',
  phone: '555-9999'
});
```

#### `getCurrentUser()`
Get currently authenticated user.

**Returns:** User object or null

```javascript
const user = authService.getCurrentUser();
```

#### `isAuthenticated()`
Check if user is logged in.

**Returns:** Boolean

```javascript
if (authService.isAuthenticated()) {
  // User is logged in
}
```

#### `subscribe(callback)`
Subscribe to authentication state changes.

**Parameters:**
- `callback` (function): Called with (event, data)

```javascript
authService.subscribe((event, user) => {
  if (event === 'auth-change') {
    console.log('Auth state changed:', user);
  }
});
```

---

## Shipment Service

### Methods

#### `createShipment(shipmentData)`
Create a new shipment.

**Parameters:**
- `shipmentData` (object): Shipment details
  - `senderId`: Sender user ID
  - `senderName`, `senderPhone`, `senderEmail`
  - `senderAddress`: Address object
  - `recipientName`, `recipientPhone`, `recipientEmail`
  - `recipientAddress`: Address object
  - `packageDescription`: Description
  - `weight`: Weight in lbs
  - `shippingType`: 'standard', 'express', 'overnight', 'international'
  - `totalCost`: Total cost

**Returns:** Promise with `{ success, shipmentId, error }`

```javascript
const result = await shipmentService.createShipment({
  senderId: 'user123',
  senderName: 'John Doe',
  senderPhone: '555-1234',
  senderEmail: 'john@example.com',
  senderAddress: { street: '123 Main', city: 'NY', state: 'NY', zip: '10001', country: 'USA' },
  recipientName: 'Jane Smith',
  recipientPhone: '555-5678',
  recipientEmail: 'jane@example.com',
  recipientAddress: { street: '456 Oak', city: 'LA', state: 'CA', zip: '90001', country: 'USA' },
  packageDescription: 'Electronics',
  weight: 2.5,
  shippingType: 'express',
  totalCost: 12.99
});
```

#### `getShipment(shipmentId)`
Get shipment by ID.

**Parameters:**
- `shipmentId` (string): Shipment document ID

**Returns:** Promise with shipment object or null

```javascript
const shipment = await shipmentService.getShipment('shipment123');
```

#### `trackShipment(trackingNumber)`
Track shipment by tracking number.

**Parameters:**
- `trackingNumber` (string): Shipment tracking number

**Returns:** Promise with `{ success, shipment, error }`

```javascript
const result = await shipmentService.trackShipment('FDX36KZPXY2J');
```

#### `getUserShipments(userId, filters)`
Get all shipments for a user.

**Parameters:**
- `userId` (string): User ID
- `filters` (object, optional):
  - `status`: Filter by status
  - `pageSize`: Number of results (default: 20)

**Returns:** Promise with array of shipments

```javascript
const shipments = await shipmentService.getUserShipments(userId, {
  status: 'delivered',
  pageSize: 10
});
```

#### `updateShipmentStatus(shipmentId, status, eventData)`
Update shipment status.

**Parameters:**
- `shipmentId` (string): Shipment ID
- `status` (string): New status
- `eventData` (object, optional): Additional event data
  - `location`: Current location
  - `description`: Status description

**Returns:** Promise with `{ success, error }`

```javascript
await shipmentService.updateShipmentStatus(shipmentId, 'in_transit', {
  location: 'Chicago, IL',
  description: 'Package in transit'
});
```

#### `getTrackingHistory(shipmentId)`
Get tracking history for shipment.

**Parameters:**
- `shipmentId` (string): Shipment ID

**Returns:** Promise with array of tracking events

```javascript
const history = await shipmentService.getTrackingHistory(shipmentId);
```

#### `cancelShipment(shipmentId, reason)`
Cancel a shipment.

**Parameters:**
- `shipmentId` (string): Shipment ID
- `reason` (string): Cancellation reason

**Returns:** Promise with `{ success, error }`

```javascript
const result = await shipmentService.cancelShipment(shipmentId, 'Customer request');
```

---

## Rate Service

### Methods

#### `calculateRate(shippingType, weight, distance, isInternational)`
Calculate shipping rate.

**Parameters:**
- `shippingType` (string): 'standard', 'express', 'overnight', 'international'
- `weight` (number): Package weight in lbs
- `distance` (number, optional): Distance in miles
- `isInternational` (boolean, optional): International shipment

**Returns:** Object with pricing info

```javascript
const rate = rateService.calculateRate('express', 2.5, 1500, false);
// Returns: {
//   baseRate: 12.99,
//   weightCharge: 1.875,
//   surcharges: 2.15,
//   totalCost: 16.99,
//   estimatedDelivery: Date
// }
```

#### `getShippingOptions(shipmentDetails)`
Get all shipping options with pricing.

**Parameters:**
- `shipmentDetails` (object):
  - `weight`: Package weight
  - `distance`: Optional distance
  - `isInternational`: Boolean

**Returns:** Promise with `{ success, options, error }`

```javascript
const result = await rateService.getShippingOptions({
  weight: 2.5,
  distance: 1500,
  isInternational: false
});
```

#### `applyDiscount(rate, discountCode)`
Apply discount code to rate.

**Parameters:**
- `rate` (number): Original rate
- `discountCode` (string): Discount code

**Returns:** Object with discount details

```javascript
const discounted = rateService.applyDiscount(12.99, 'WELCOME10');
// Returns: {
//   originalRate: 12.99,
//   discountPercent: 10,
//   discountAmount: 1.30,
//   finalRate: 11.69
// }
```

**Available Codes:**
- `WELCOME10`: 10% off
- `SAVE15`: 15% off
- `BULK20`: 20% off

---

## UI Service

### Methods

#### `showToast(message, type, duration)`
Show a toast notification.

**Parameters:**
- `message` (string): Notification message
- `type` (string): 'info', 'success', 'error', 'warning' (default: 'info')
- `duration` (number): Display time in ms (default: 3000)

```javascript
uiService.showToast('Shipment created!', 'success', 3000);
```

#### `showModal(title, content, buttons)`
Show a modal dialog.

**Parameters:**
- `title` (string): Modal title
- `content` (string): Modal content
- `buttons` (array): Button configuration
  - `label`: Button text
  - `type`: 'primary', 'secondary', 'danger'
  - `action`: Action identifier
  - `onClick`: Callback function

```javascript
uiService.showModal('Confirm', 'Are you sure?', [
  {
    label: 'Yes',
    type: 'primary',
    action: 'confirm',
    onClick: () => { /* handle confirm */ }
  },
  {
    label: 'No',
    type: 'secondary',
    action: 'cancel'
  }
]);
```

#### `showLoading(message)`
Show loading overlay.

**Parameters:**
- `message` (string): Loading message (default: 'Loading...')

```javascript
uiService.showLoading('Processing shipment...');
```

#### `hideLoading()`
Hide loading overlay.

```javascript
uiService.hideLoading();
```

#### `formatCurrency(amount, currency)`
Format number as currency.

**Parameters:**
- `amount` (number): Amount to format
- `currency` (string): Currency code (default: 'USD')

**Returns:** Formatted string

```javascript
uiService.formatCurrency(12.99, 'USD'); // Returns: "$12.99"
uiService.formatCurrency(12.99, 'EUR'); // Returns: "€12.99"
```

#### `formatDate(date, format)`
Format date for display.

**Parameters:**
- `date` (Date or string): Date to format
- `format` (string): 'short', 'long', 'time' (default: 'short')

**Returns:** Formatted date string

```javascript
uiService.formatDate(new Date(), 'short');     // "12/26/2024"
uiService.formatDate(new Date(), 'long');      // "Wednesday, December 26, 2024"
uiService.formatDate(new Date(), 'time');      // "2:30:45 PM"
```

---

## Constants

### Shipping Types
```javascript
CONSTANTS.SHIPPING_TYPES = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  OVERNIGHT: 'overnight',
  INTERNATIONAL: 'international'
}
```

### Status Values
```javascript
CONSTANTS.STATUS = {
  PENDING: 'pending',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
}
```

### User Roles
```javascript
CONSTANTS.USER_ROLES = {
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  ADMIN: 'admin',
  AGENT: 'agent'
}
```

---

## Error Handling

All service methods return objects with `success` boolean and optional `error`:

```javascript
const result = await authService.signIn(email, password);
if (result.success) {
  console.log('Logged in');
} else {
  console.error('Error:', result.error);
  uiService.showToast(result.error, 'error');
}
```

---

## Best Practices

1. **Always check success** before using returned data
2. **Handle errors gracefully** with user-friendly messages
3. **Show loading states** for async operations
4. **Validate input** before calling services
5. **Subscribe to auth changes** to handle logged-out state
6. **Use proper error types** for specific error messages

---

Last Updated: December 2024
