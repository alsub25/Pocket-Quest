/**
 * Backend UI Integration
 * 
 * Handles the UI for authentication and cloud saves.
 * Integrates with the existing game UI system.
 */

import { BACKEND_ENABLED } from './firebaseConfig.js';
import { initAuth, signIn, signUp, signOutUser, resetPassword, getCurrentUser, onAuthStateChange, isAuthenticated } from './authService.js';
import { initCloudSaves, saveToCloud, loadFromCloud, listCloudSaves, deleteCloudSave } from './cloudSaveService.js';

let uiState = {
  loginScreenShown: false,
  currentUser: null
};

/**
 * Initialize backend UI components
 */
export async function initBackendUI() {
  if (!BACKEND_ENABLED) {
    console.log('[BackendUI] Backend disabled, skipping UI initialization');
    // Hide all backend-related UI elements
    hideBackendElements();
    return { success: true, offline: true };
  }

  // Initialize auth and cloud saves
  const authResult = await initAuth();
  const cloudResult = await initCloudSaves();

  if (!authResult.success || !cloudResult.success) {
    console.warn('[BackendUI] Backend initialization failed, falling back to offline mode');
    hideBackendElements();
    return { success: false };
  }

  // Backend initialized successfully - show UI elements
  showBackendElements();

  // Setup UI event listeners
  setupLoginUI();
  setupCloudSaveUI();

  // Listen for auth state changes
  onAuthStateChange((user) => {
    uiState.currentUser = user;
    updateAuthUI(user);
  });

  console.log('[BackendUI] Backend UI initialized');
  return { success: true };
}

/**
 * Hide all backend-related UI elements
 */
function hideBackendElements() {
  const loginScreen = document.getElementById('loginScreen');
  const cloudSavesBtn = document.getElementById('btnCloudSaves');
  const accountBtn = document.getElementById('btnAccountManagement');
  const cloudHint = document.getElementById('cloudSaveHint');

  if (loginScreen) loginScreen.style.display = 'none';
  if (cloudSavesBtn) cloudSavesBtn.style.display = 'none';
  if (accountBtn) accountBtn.style.display = 'none';
  if (cloudHint) cloudHint.style.display = 'none';
}

/**
 * Show backend-related UI elements
 */
function showBackendElements() {
  const cloudSavesBtn = document.getElementById('btnCloudSaves');
  const accountBtn = document.getElementById('btnAccountManagement');

  // Show the buttons when backend is available
  if (cloudSavesBtn) cloudSavesBtn.style.display = '';
  if (accountBtn) accountBtn.style.display = '';
}

/**
 * Setup login screen UI
 */
function setupLoginUI() {
  const btnLogin = document.getElementById('btnLogin');
  const btnSignUp = document.getElementById('btnSignUp');
  const btnForgotPassword = document.getElementById('btnForgotPassword');
  const btnPlayOffline = document.getElementById('btnPlayOffline');
  const btnSignOut = document.getElementById('btnSignOut');
  const btnContinueToMenu = document.getElementById('btnContinueToMenu');

  if (btnLogin) {
    btnLogin.addEventListener('click', handleLogin);
  }

  if (btnSignUp) {
    btnSignUp.addEventListener('click', handleSignUp);
  }

  if (btnForgotPassword) {
    btnForgotPassword.addEventListener('click', handleForgotPassword);
  }

  if (btnPlayOffline) {
    btnPlayOffline.addEventListener('click', handlePlayOffline);
  }

  if (btnSignOut) {
    btnSignOut.addEventListener('click', handleSignOut);
  }

  if (btnContinueToMenu) {
    btnContinueToMenu.addEventListener('click', handleContinueToMenu);
  }

  // Add Enter key support for login
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  
  if (loginPassword) {
    loginPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }
}

/**
 * Setup cloud save UI
 */
function setupCloudSaveUI() {
  const btnCloudSaves = document.getElementById('btnCloudSaves');
  const btnAccountManagement = document.getElementById('btnAccountManagement');

  if (btnCloudSaves) {
    btnCloudSaves.addEventListener('click', showCloudSavesModal);
  }

  if (btnAccountManagement) {
    btnAccountManagement.addEventListener('click', showAccountModal);
  }
}

/**
 * Handle login button click
 */
async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const errorDiv = document.getElementById('loginError');

  if (!email || !password) {
    showError(errorDiv, 'Please enter email and password');
    return;
  }

  showError(errorDiv, 'Signing in...');
  const result = await signIn(email, password);

  if (result.success) {
    hideError(errorDiv);
    // Show account info section
    showAccountInfo(result.user);
  } else {
    showError(errorDiv, result.error);
  }
}

/**
 * Handle sign up button click
 */
async function handleSignUp() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const errorDiv = document.getElementById('loginError');

  if (!email || !password) {
    showError(errorDiv, 'Please enter email and password');
    return;
  }

  if (password.length < 6) {
    showError(errorDiv, 'Password must be at least 6 characters');
    return;
  }

  showError(errorDiv, 'Creating account...');
  const result = await signUp(email, password);

  if (result.success) {
    hideError(errorDiv);
    // Show account info section
    showAccountInfo(result.user);
  } else {
    showError(errorDiv, result.error);
  }
}

/**
 * Handle forgot password button click
 */
async function handleForgotPassword() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const errorDiv = document.getElementById('loginError');

  if (!email) {
    showError(errorDiv, 'Please enter your email address');
    return;
  }

  showError(errorDiv, 'Sending reset email...');
  const result = await resetPassword(email);

  if (result.success) {
    showError(errorDiv, 'Password reset email sent! Check your inbox.', false);
  } else {
    showError(errorDiv, result.error);
  }
}

/**
 * Handle play offline button click
 */
function handlePlayOffline() {
  const loginScreen = document.getElementById('loginScreen');
  const mainMenu = document.getElementById('mainMenu');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (mainMenu) mainMenu.classList.remove('hidden');
}

/**
 * Handle sign out button click
 */
async function handleSignOut() {
  const result = await signOutUser();
  if (result.success) {
    // Return to login screen
    showLoginScreen();
  }
}

/**
 * Handle continue to menu button click
 */
function handleContinueToMenu() {
  const loginScreen = document.getElementById('loginScreen');
  const mainMenu = document.getElementById('mainMenu');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (mainMenu) mainMenu.classList.remove('hidden');
}

/**
 * Show account info after successful login
 */
function showAccountInfo(user) {
  const loginForm = document.getElementById('loginForm');
  const accountInfo = document.getElementById('accountInfo');
  const userEmail = document.getElementById('userEmail');

  if (loginForm) loginForm.classList.add('hidden');
  if (accountInfo) accountInfo.classList.remove('hidden');
  if (userEmail) userEmail.textContent = user.email;
}

/**
 * Update auth UI based on user state
 */
function updateAuthUI(user) {
  const accountStatus = document.getElementById('accountStatus');
  const accountStatusText = document.getElementById('accountStatusText');
  const cloudSavesBtn = document.getElementById('btnCloudSaves');
  const accountBtn = document.getElementById('btnAccountManagement');
  const cloudHint = document.getElementById('cloudSaveHint');

  if (user) {
    // User is signed in
    if (accountStatus) {
      accountStatus.classList.remove('hidden');
      if (accountStatusText) {
        accountStatusText.textContent = `☁️ Signed in as ${user.email}`;
      }
    }
    if (cloudSavesBtn) cloudSavesBtn.classList.remove('hidden');
    if (accountBtn) accountBtn.classList.remove('hidden');
    if (cloudHint) cloudHint.classList.remove('hidden');
  } else {
    // User is signed out
    if (accountStatus) accountStatus.classList.add('hidden');
    if (cloudSavesBtn) cloudSavesBtn.classList.add('hidden');
    if (accountBtn) accountBtn.classList.add('hidden');
    if (cloudHint) cloudHint.classList.add('hidden');
  }
}

/**
 * Show login screen
 */
export function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const mainMenu = document.getElementById('mainMenu');
  const loginForm = document.getElementById('loginForm');
  const accountInfo = document.getElementById('accountInfo');

  if (loginScreen) loginScreen.classList.remove('hidden');
  if (mainMenu) mainMenu.classList.add('hidden');
  if (loginForm) loginForm.classList.remove('hidden');
  if (accountInfo) accountInfo.classList.add('hidden');

  // Clear form
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const errorDiv = document.getElementById('loginError');

  if (loginEmail) loginEmail.value = '';
  if (loginPassword) loginPassword.value = '';
  if (errorDiv) hideError(errorDiv);

  uiState.loginScreenShown = true;
}

/**
 * Show cloud saves modal
 * TODO: Integrate with the existing modal system for better UX
 */
async function showCloudSavesModal() {
  const result = await listCloudSaves();
  
  if (result.success) {
    console.log('Cloud saves:', result.saves);
    // TODO: Replace alert with proper modal using existing modal system
    // For now, using alert as a temporary solution
    alert(`You have ${result.saves.length} cloud save(s).\n\nCloud save management UI with proper modal integration coming in a future update!`);
  } else {
    alert('Failed to load cloud saves: ' + result.error);
  }
}

/**
 * Show account management modal
 * TODO: Integrate with the existing modal system for better UX
 */
function showAccountModal() {
  const user = getCurrentUser();
  if (user) {
    // TODO: Replace alert with proper modal using existing modal system
    // For now, using alert as a temporary solution
    alert(`Account: ${user.email}\n\nFull account management UI with proper modal integration coming in a future update!`);
  }
}

/**
 * Show error message
 */
function showError(errorDiv, message, isError = true) {
  if (!errorDiv) return;
  
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  
  if (isError) {
    errorDiv.classList.add('danger');
  } else {
    errorDiv.classList.remove('danger');
  }
}

/**
 * Hide error message
 */
function hideError(errorDiv) {
  if (!errorDiv) return;
  
  errorDiv.textContent = '';
  errorDiv.classList.add('hidden');
}

/**
 * Check if login screen should be shown on startup
 */
export function shouldShowLoginScreen() {
  // Show login screen if backend is enabled and user wants cloud features
  // For now, default to not showing it to maintain existing behavior
  return false;
}

/**
 * Export utility to check if user is authenticated
 */
export { isAuthenticated, getCurrentUser };
