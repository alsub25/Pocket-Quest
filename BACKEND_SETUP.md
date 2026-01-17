# Backend Login System & Cloud Saves Setup Guide

This guide explains how to enable backend authentication and cloud saves for Emberwood: The Blackbark Oath using Firebase.

## Overview

The game now supports optional backend features:
- **User Authentication**: Create accounts, sign in/out, password reset
- **Cloud Saves**: Backup saves to the cloud, sync across devices
- **Offline Mode**: Continue playing without an account using localStorage

**Important**: These features are **optional**. The game works perfectly fine without backend setup - all saves will be stored locally as before.

## Why Firebase?

Firebase is chosen because it:
- ✅ Works with static hosting (GitHub Pages, Netlify, etc.)
- ✅ Has a generous free tier
- ✅ Requires no backend server code
- ✅ Provides authentication and database out of the box
- ✅ Supports offline capabilities

## Setup Instructions

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "emberwood-game")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click "Get Started"
3. Click on "Email/Password" in the Sign-in providers list
4. Enable the toggle for "Email/Password"
5. Click "Save"

### Step 3: Enable Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click "Create Database"
3. Choose "Start in **production mode**" (we'll set custom rules next)
4. Select a Cloud Firestore location (choose one closest to your players)
5. Click "Enable"

### Step 4: Set Firestore Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own saves
    match /users/{userId}/saves/{saveId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

### Step 5: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register app nickname (e.g., "Emberwood Web")
5. **Don't** check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the `firebaseConfig` object

### Step 6: Update Firebase Configuration File

1. Open `js/backend/firebaseConfig.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

3. Save the file

### Step 7: Test the Integration

1. Deploy your game to GitHub Pages or run locally with a web server
2. You should now see backend features enabled:
   - Login screen option on startup
   - "Cloud Saves" button in main menu (when signed in)
   - Account management options

## Usage

### For Players

**Creating an Account:**
1. Enter email and password
2. Click "Create Account"
3. Verify your email (if enabled in Firebase)

**Signing In:**
1. Enter email and password
2. Click "Sign In"

**Playing Offline:**
- Click "Play Offline" to skip authentication
- All saves will be stored locally only

**Cloud Saves:**
- When signed in, your saves automatically sync to the cloud
- Access "Cloud Saves" from the main menu to manage backups

**Forgot Password:**
1. Enter your email
2. Click "Forgot Password?"
3. Check your email for reset link

### For Developers

**Disabling Backend Features:**

If you don't want to set up Firebase, the game will automatically fall back to localStorage-only mode. No configuration needed!

To explicitly disable backend features, edit `js/backend/firebaseConfig.js`:

```javascript
export const BACKEND_ENABLED = false;
```

**Integrating Cloud Saves with Save Manager:**

The cloud save system integrates with the existing save manager. Saves are automatically synced when:
- Manual save is triggered
- Auto-save occurs (if enabled)
- Game is closed (if signed in)

## Troubleshooting

### "Backend not enabled" Error

**Cause**: Firebase configuration not set up
**Solution**: Follow Steps 5-6 above to configure Firebase

### "Authentication failed" Error

**Cause**: Incorrect email/password or Firebase Auth not enabled
**Solution**: 
- Check credentials
- Verify Email/Password is enabled in Firebase Console → Authentication

### "Permission denied" Error

**Cause**: Firestore security rules not configured
**Solution**: Follow Step 4 above to set proper security rules

### Cloud Saves Not Syncing

**Cause**: User not authenticated or Firestore not enabled
**Solution**:
- Verify user is signed in (check account status in menu)
- Verify Firestore is enabled in Firebase Console

### "Network error" Message

**Cause**: No internet connection or Firebase services down
**Solution**:
- Check internet connection
- Try again later
- Game will continue working with local saves

## Cost Considerations

Firebase free tier (Spark plan) includes:
- **Authentication**: 50,000 MAU (Monthly Active Users) - FREE
- **Firestore**: 1 GB storage, 50,000 reads/day, 20,000 writes/day - FREE
- **Bandwidth**: 10 GB/month - FREE

For a small to medium-sized game, this should be more than sufficient. Monitor usage in Firebase Console.

## Privacy & Security

- **Passwords**: Never stored in plain text, handled by Firebase Auth
- **Save Data**: Only accessible by the account owner (enforced by Firestore rules)
- **No Analytics**: Game doesn't collect analytics unless you add it
- **Local Saves**: Always available as fallback, even if backend is down

## Next Steps

After setting up the backend:

1. **Test thoroughly**: Create an account, make saves, test cloud sync
2. **Monitor usage**: Check Firebase Console for usage statistics
3. **Update documentation**: Add your Firebase project details to your deployment docs
4. **Consider upgrades**: If your game grows popular, review Firebase pricing

## Advanced Configuration

### Custom Domain for Auth

1. In Firebase Console → Authentication → Settings
2. Add your custom domain to authorized domains
3. Update `authDomain` in your config

### Email Verification

1. In Firebase Console → Authentication → Templates
2. Customize email verification templates
3. Enable email verification in sign-up flow

### Additional Sign-In Methods

Firebase supports:
- Google Sign-In
- GitHub Sign-In
- Anonymous Sign-In
- And more...

See [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start) for details.

## Support

For issues with:
- **Firebase setup**: Check [Firebase Documentation](https://firebase.google.com/docs)
- **Game integration**: Open an issue on GitHub
- **Security concerns**: Review Firebase Security Rules documentation

---

**Remember**: Backend features are completely optional. The game works perfectly without them!
