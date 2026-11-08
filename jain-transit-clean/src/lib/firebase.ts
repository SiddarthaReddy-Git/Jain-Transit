import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId || 'eng-keyword-j5wls',
  appId: firebaseConfigData.appId || '1:459359680296:web:9ca4ea54ec1c972e73021d',
  apiKey: firebaseConfigData.apiKey || 'AIzaSyDb8ift9qs3UqHb2QBunf9cpiAazr_JkUk',
  authDomain: firebaseConfigData.authDomain || 'eng-keyword-j5wls.firebaseapp.com',
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || 'ai-studio-jaintransit-e377586f-fd40-40c1-bc1f-b4726d309eef',
  storageBucket: firebaseConfigData.storageBucket || 'eng-keyword-j5wls.firebasestorage.app',
  messagingSenderId: firebaseConfigData.messagingSenderId || '459359680296',
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot
(async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or warming up:', error.message);
    }
  }
})();
