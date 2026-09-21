/**
 * File konfigurasi Firebase: firebase.js
 * Sesuai panduan teknis:
 * Ganti nilai di bawah ini dengan kredensial dari Firebase Console project Anda.
 */

import appletConfig from './firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyAb4LoYQTwXuIO66oF1k-RSMPl05RMyp04",
  authDomain: appletConfig.authDomain || "gen-lang-client-0593095003.firebaseapp.com",
  projectId: appletConfig.projectId || "gen-lang-client-0593095003",
  storageBucket: appletConfig.storageBucket || "gen-lang-client-0593095003.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "311188412844",
  appId: appletConfig.appId || "1:311188412844:web:5c7fa3c5b11f449a5e0209",
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || "ai-studio-penilaianantarte-fe10d073-4b3c-429f-b51e-32b62a8c5907"
};

export default firebaseConfig;
