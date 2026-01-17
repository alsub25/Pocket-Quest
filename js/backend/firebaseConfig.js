/**
 * Firebase Configuration
 * 
 * This module provides Firebase integration for authentication and cloud saves.
 * Firebase is a free backend-as-a-service that works with static hosting like GitHub Pages.
 * 
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Authentication > Sign-in method > Email/Password
 * 3. Enable Firestore Database
 * 4. Copy your Firebase config values below
 * 5. Update Firestore rules to secure user data
 */

// Firebase configuration
// IMPORTANT: Replace these values with your own Firebase project configuration
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Feature flag to enable/disable backend features
// Set to false to disable backend and use localStorage only
export const BACKEND_ENABLED = firebaseConfig.apiKey !== "YOUR_API_KEY";

/**
 * Firestore Security Rules (to be set in Firebase Console):
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Users can only read/write their own saves
 *     match /users/{userId}/saves/{saveId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     
 *     // Users can only read/write their own profile
 *     match /users/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */
