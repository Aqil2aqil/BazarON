import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBJ6F8fhkjOJtWG1rSS2XoHp0KDNUWTm6M",
  authDomain: "bazaron-a7bac.firebaseapp.com",
  databaseURL: "https://bazaron-a7bac-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bazaron-a7bac",
  storageBucket: "bazaron-a7bac.firebasestorage.app",
  messagingSenderId: "971700943577",
  appId: "1:971700943577:web:bf103a9d46243d00079cc8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
