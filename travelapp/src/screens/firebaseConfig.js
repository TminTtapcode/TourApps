import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Thay thế bằng thông tin từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "travelapp.firebaseapp.com",
  projectId: "travelapp",
  storageBucket: "travelapp.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);