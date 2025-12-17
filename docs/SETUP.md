# Setup Guide - FedEx Clone

## Quick Start (5 minutes)

### 1. Firebase Configuration

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Create Project"
   - Enter project name "fedex-clone"
   - Continue through setup wizard

2. **Enable Services**
   - Go to Authentication
   - Enable "Email/Password"
   - Enable "Google" (OAuth)
   - Go to Firestore
   - Create database in test mode

3. **Get Configuration**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click "Web" icon (</>)
   - Copy the configuration

4. **Update config/firebase.js**
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456"
   };
   ```

### 2. Run Locally

**Option A: Python**
```bash
cd /workspaces/fedex
python -m http.server 8000
# Access http://localhost:8000
```

**Option B: Node.js**
```bash
cd /workspaces/fedex
npx http-server
# Access http://localhost:8080
```

### 3. Test Application

1. **Homepage**: http://localhost:8000
2. **Sign Up**: Create new account
3. **Create Shipment**: Test shipping form
4. **Track**: Use tracking number from dashboard

## Firestore Security Rules

For development (test mode), use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For production, use more restrictive rules (see README.md).

## File Structure Quick Reference

```
index.html               ← Start here (Homepage)
pages/
├── login.html          ← User login
├── signup.html         ← User registration
├── ship.html           ← Create shipment
├── tracking.html       ← Track shipment
└── dashboard.html      ← User dashboard

config/
├── firebase.js         ← Firebase setup
└── constants.js        ← App constants

services/
├── authService.js      ← Auth management
├── shipmentService.js  ← Shipment operations
├── rateService.js      ← Rate calculation
└── uiService.js        ← UI utilities

assets/css/
└── styles.css          ← All styling
```

## Key Features to Test

### 1. Authentication
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Google Sign-In
- [ ] Logout
- [ ] Password reset

### 2. Shipping
- [ ] Quick rate calculator
- [ ] Create new shipment
- [ ] Multiple shipping types
- [ ] Real-time price updates

### 3. Tracking
- [ ] Track by number from homepage
- [ ] View tracking details
- [ ] See timeline
- [ ] Print tracking

### 4. Dashboard
- [ ] View shipment history
- [ ] See statistics
- [ ] Filter by status
- [ ] Access tracking

## Development Tips

### Adding New Pages

1. Create HTML file in `pages/` folder
2. Include scripts at bottom:
   ```html
   <script src="../config/firebase.js"></script>
   <script src="../config/constants.js"></script>
   <script src="../services/authService.js"></script>
   <script src="../services/shipmentService.js"></script>
   <script src="../services/rateService.js"></script>
   <script src="../services/uiService.js"></script>
   ```

3. Use services in your script:
   ```javascript
   // Check authentication
   if (!authService.isAuthenticated()) {
     window.location.href = 'login.html';
   }
   
   // Use services
   await shipmentService.getShipment(id);
   uiService.showToast('Success!', 'success');
   ```

### Customizing Styles

Edit `assets/css/styles.css`:
- Change color scheme in `:root` section
- Modify component styles
- Add new utility classes as needed

### Adding Shipping Types

Edit `config/constants.js`:
```javascript
SHIPPING_TYPES: {
  YOUR_TYPE: 'your-type'
}
```

Then update `services/rateService.js`:
```javascript
this.baseRates = {
  'your-type': {
    base: 10.00,
    perPound: 0.50
  }
}
```

## Common Issues

### Firebase not loading
- Check internet connection
- Verify Firebase config in `config/firebase.js`
- Check browser console for errors

### Styles not loading
- Clear browser cache (Ctrl+Shift+R)
- Check CSS file path
- Verify styles.css exists in assets/css/

### Authentication not working
- Enable Email/Password in Firebase
- Check Firestore security rules
- Verify email format

### Database errors
- Ensure Firestore database exists
- Check security rules allow your operations
- Verify user is authenticated for protected operations

## Next Steps

1. **Customize Branding**
   - Update colors in styles.css
   - Change logo text
   - Update copy/text

2. **Add Real Data**
   - Configure Firestore with actual data
   - Set up real shipping rates
   - Add location information

3. **Test Payment**
   - Integrate Stripe (Phase 9)
   - Test payment flow
   - Set up invoicing

4. **Deploy**
   - Use Firebase Hosting
   - Or deploy to Netlify/Vercel
   - Set up custom domain

## Support

For issues:
1. Check browser console (F12)
2. Check Firebase console for errors
3. Review README.md for details
4. Check Firestore security rules

---

**Ready to start?** Open `index.html` in your browser!
