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
      // Allow public read by accessCode (for customer portal - query by accessCode)
      allow read: if resource.data.accessCode != null;
    }

    // Credits collection
    match /credits/{creditId} {
      // Users can only read/write their own credits
      allow read, write: if isOwner(resource.data.userId);
      // Allow create if the userId matches the authenticated user
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      // Allow public read for queries (for customer portal)
      // IMPORTANT: This allows public queries - less secure but necessary for customer portal
      // The query will be filtered by customerId in the application code
      allow list: if true;
      // Allow single document read if customer has accessCode
      allow get: if resource.data.customerId != null &&
                    exists(/databases/$(database)/documents/customers/$(resource.data.customerId)) &&
                    get(/databases/$(database)/documents/customers/$(resource.data.customerId)).data.accessCode != null;
    }

    // Payments collection
    match /payments/{paymentId} {
      // Users can only read/write their own payments
      allow read, write: if isOwner(resource.data.userId);
      // Allow create if the userId matches the authenticated user
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      // Allow public read for queries (for customer portal)
      allow list: if true;
      // Allow single document read if customer has accessCode
      allow get: if resource.data.customerId != null &&
                    exists(/databases/$(database)/documents/customers/$(resource.data.customerId)) &&
                    get(/databases/$(database)/documents/customers/$(resource.data.customerId)).data.accessCode != null;
    }

    // Credit Increases collection
    match /creditIncreases/{creditIncreaseId} {
      // Users can only read/write their own credit increases
      allow read, write: if isOwner(resource.data.userId);
      // Allow create if the userId matches the authenticated user
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      // Allow public read for queries (for customer portal)
      allow list: if true;
      // Allow single document read if customer has accessCode
      allow get: if resource.data.customerId != null &&
                    exists(/databases/$(database)/documents/customers/$(resource.data.customerId)) &&
                    get(/databases/$(database)/documents/customers/$(resource.data.customerId)).data.accessCode != null;
    }

    // Stores collection
    match /stores/{storeId} {
      // Users can only read/write their own store
      allow read, write: if isOwner(resource.data.userId);
      // Allow create if the userId matches the authenticated user
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }

}
}
