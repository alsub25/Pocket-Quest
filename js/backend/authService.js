/**
 * Authentication Service
 * 
 * Handles user authentication using Firebase Auth.
 * Provides login, logout, registration, and password reset functionality.
 */

import { firebaseConfig, BACKEND_ENABLED } from './firebaseConfig.js';

let auth = null;
let currentUser = null;
let authStateListeners = [];

/**
 * Initialize Firebase Authentication
 */
export async function initAuth() {
  if (!BACKEND_ENABLED) {
    console.log('[Auth] Backend disabled, skipping Firebase initialization');
    return { success: true, offline: true };
  }

  try {
    // Dynamically import Firebase SDK from CDN
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } = 
      await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Store auth methods for later use
    window._firebaseAuthMethods = {
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      sendPasswordResetEmail
    };

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      // Notify all listeners
      authStateListeners.forEach(listener => listener(user));
    });

    console.log('[Auth] Firebase Auth initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Failed to initialize Firebase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Register a listener for auth state changes
 */
export function onAuthStateChange(callback) {
  authStateListeners.push(callback);
  // Immediately call with current user if available
  if (currentUser !== null) {
    callback(currentUser);
  }
  // Return unsubscribe function
  return () => {
    authStateListeners = authStateListeners.filter(l => l !== callback);
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  if (!BACKEND_ENABLED || !auth) {
    return { success: false, error: 'Backend not enabled' };
  }

  try {
    const { signInWithEmailAndPassword } = window._firebaseAuthMethods;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('[Auth] Sign in failed:', error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

/**
 * Create a new user account
 */
export async function signUp(email, password) {
  if (!BACKEND_ENABLED || !auth) {
    return { success: false, error: 'Backend not enabled' };
  }

  try {
    const { createUserWithEmailAndPassword } = window._firebaseAuthMethods;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('[Auth] Sign up failed:', error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  if (!BACKEND_ENABLED || !auth) {
    return { success: false, error: 'Backend not enabled' };
  }

  try {
    const { signOut } = window._firebaseAuthMethods;
    await signOut(auth);
    currentUser = null;
    return { success: true };
  } catch (error) {
    console.error('[Auth] Sign out failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!BACKEND_ENABLED || !auth) {
    return { success: false, error: 'Backend not enabled' };
  }

  try {
    const { sendPasswordResetEmail } = window._firebaseAuthMethods;
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Password reset failed:', error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(error) {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    default:
      return error.message || 'Authentication failed';
  }
}
