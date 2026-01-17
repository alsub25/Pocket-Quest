/**
 * Cloud Save Service
 * 
 * Handles saving and loading game data to/from Firestore Cloud Database.
 * Integrates with the existing saveManager to provide cloud backup.
 */

import { firebaseConfig, BACKEND_ENABLED } from './firebaseConfig.js';
import { getCurrentUser } from './authService.js';

let db = null;
let firestoreMethods = null;

/**
 * Initialize Firestore Database
 */
export async function initCloudSaves() {
  if (!BACKEND_ENABLED) {
    console.log('[CloudSave] Backend disabled, skipping Firestore initialization');
    return { success: true, offline: true };
  }

  try {
    // Dynamically import Firestore SDK from CDN
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp, query, orderBy, limit } = firestoreModule;

    // Initialize Firebase if not already done
    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    db = getFirestore(app);

    // Store Firestore methods at module level
    firestoreMethods = {
      collection,
      doc,
      getDoc,
      getDocs,
      setDoc,
      deleteDoc,
      serverTimestamp,
      query,
      orderBy,
      limit
    };

    console.log('[CloudSave] Firestore initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('[CloudSave] Failed to initialize Firestore:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save game data to cloud
 */
export async function saveToCloud(saveData, slotId = 'autosave') {
  if (!BACKEND_ENABLED || !db || !firestoreMethods) {
    return { success: false, error: 'Cloud saves not available' };
  }

  const user = getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { collection, doc, setDoc, serverTimestamp } = firestoreMethods;
    
    const saveRef = doc(collection(db, 'users', user.uid, 'saves'), slotId);
    
    const cloudSaveData = {
      ...saveData,
      updatedAt: serverTimestamp(),
      userId: user.uid,
      slotId: slotId
    };

    await setDoc(saveRef, cloudSaveData);
    
    console.log('[CloudSave] Save uploaded to cloud:', slotId);
    return { success: true, slotId };
  } catch (error) {
    console.error('[CloudSave] Failed to save to cloud:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load game data from cloud
 */
export async function loadFromCloud(slotId = 'autosave') {
  if (!BACKEND_ENABLED || !db || !firestoreMethods) {
    return { success: false, error: 'Cloud saves not available' };
  }

  const user = getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { collection, doc, getDoc } = firestoreMethods;
    
    const saveRef = doc(collection(db, 'users', user.uid, 'saves'), slotId);
    const saveSnap = await getDoc(saveRef);

    if (!saveSnap.exists()) {
      return { success: false, error: 'Save not found' };
    }

    const saveData = saveSnap.data();
    console.log('[CloudSave] Save loaded from cloud:', slotId);
    return { success: true, data: saveData };
  } catch (error) {
    console.error('[CloudSave] Failed to load from cloud:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List all cloud saves for current user
 */
export async function listCloudSaves() {
  if (!BACKEND_ENABLED || !db || !firestoreMethods) {
    return { success: false, error: 'Cloud saves not available' };
  }

  const user = getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { collection, getDocs, query, orderBy } = firestoreMethods;
    
    const savesRef = collection(db, 'users', user.uid, 'saves');
    const q = query(savesRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const saves = [];
    querySnapshot.forEach((doc) => {
      saves.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('[CloudSave] Listed cloud saves:', saves.length);
    return { success: true, saves };
  } catch (error) {
    console.error('[CloudSave] Failed to list cloud saves:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a cloud save
 */
export async function deleteCloudSave(slotId) {
  if (!BACKEND_ENABLED || !db || !firestoreMethods) {
    return { success: false, error: 'Cloud saves not available' };
  }

  const user = getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { collection, doc, deleteDoc } = firestoreMethods;
    
    const saveRef = doc(collection(db, 'users', user.uid, 'saves'), slotId);
    await deleteDoc(saveRef);

    console.log('[CloudSave] Deleted cloud save:', slotId);
    return { success: true };
  } catch (error) {
    console.error('[CloudSave] Failed to delete cloud save:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync local save to cloud
 * This is a helper that accepts save data directly
 * 
 * @param {Object} saveData - The save data to upload
 * @param {string} slotId - The save slot identifier
 */
export async function syncToCloud(saveData, slotId = 'autosave') {
  if (!BACKEND_ENABLED) {
    return { success: false, offline: true };
  }

  const user = getCurrentUser();
  if (!user) {
    // Not authenticated, skip cloud sync
    return { success: false, error: 'Not authenticated' };
  }

  if (!saveData) {
    return { success: false, error: 'No save data provided' };
  }

  try {
    return await saveToCloud(saveData, slotId);
  } catch (error) {
    console.error('[CloudSave] Sync failed:', error);
    return { success: false, error: error.message };
  }
}
