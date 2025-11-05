# Firestore Security Rules

To secure your Firebase Firestore database, apply the following security rules in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Customers collection
    match /customers/{customerId} {
      // Users can only read/write their own customers
      allow read, write: if isOwner(resource.data.userId);
      // Allow create if the userId matches the authenticated user
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Credits collection
    match /credits/{creditId} {
      // Users can only read/write their own credits
      allow read, write: if isOwner(resource.data.userId);
      // Allow create if the userId matches the authenticated user
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Payments collection
    match /payments/{paymentId} {
      // Users can only read/write their own payments
      allow read, write: if isOwner(resource.data.userId);
      // Allow create if the userId matches the authenticated user
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Important Notes:

1. **Authentication Required**: All operations require users to be authenticated
2. **Data Isolation**: Users can only access their own data (filtered by userId)
3. **Create Operations**: New documents must include the correct userId matching the authenticated user
4. **Update/Delete**: Users can only modify documents they own

## Testing the Rules:

After applying the rules, test them in the Firebase Console:
1. Go to **Firestore Database** → **Rules** → **Rules Playground**
2. Test read/write operations with different user IDs to ensure proper isolation

## Additional Security Recommendations:

1. Enable **Email Enumeration Protection** in Authentication settings
2. Set up **App Check** to prevent abuse from unauthorized clients
3. Monitor usage in the **Usage** tab to detect unusual activity
4. Regularly review and audit your security rules
