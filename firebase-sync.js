// firebase-sync.js - Cloud Synchronization Logic
const firebaseConfig = {
  apiKey: "AIzaSyCDp-klMGmIKKvqLNHuBo6A8DUcGZs6FGI",
  authDomain: "lobo-solitario-88cfe.firebaseapp.com",
  projectId: "lobo-solitario-88cfe",
  storageBucket: "lobo-solitario-88cfe.firebasestorage.app",
  messagingSenderId: "114967788477",
  appId: "1:114967788477:web:255076c175a825409cf0d4",
  measurementId: "G-J2C598KX0N"
};

// Initialize Firebase (Compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/**
 * Generates a random 5-character code for synchronization
 */
function generateSyncCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 to avoid confusion
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `LOBO-${result}`;
}

/**
 * Uploads a profile to the cloud
 */
async function uploadToCloud(profile) {
    try {
        const code = generateSyncCode();
        const syncData = {
            profile: profile,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        await db.ref('sync/' + code).set(syncData);
        return code;
    } catch (error) {
        console.error("Error uploading to cloud:", error);
        throw error;
    }
}

/**
 * Downloads a profile from the cloud
 */
async function downloadFromCloud(code) {
    try {
        const cleanCode = code.trim().toUpperCase();
        const snapshot = await db.ref('sync/' + cleanCode).once('value');
        
        if (snapshot.exists()) {
            return snapshot.val().profile;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error downloading from cloud:", error);
        throw error;
    }
}
