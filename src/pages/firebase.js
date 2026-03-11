import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCCXPugT-Ti1kEt3uR5uGnfuGJk4TepUu4",
  authDomain: "esg-mp.firebaseapp.com",
  projectId: "esg-mp",
  storageBucket: "esg-mp.firebasestorage.app",
  messagingSenderId: "1038940584552",
  appId: "1:1038940584552:web:9bc53bcbc98b9c1b1859dd",
  measurementId: "G-CEZ3E0E68J"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);