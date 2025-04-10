import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBRxQd9wgdEDtRWq536iyA0ad7EIOCBpMg",
  authDomain: "ahsdbhsad.firebaseapp.com",
  databaseURL: "https://ahsdbhsad-default-rtdb.firebaseio.com",
  projectId: "ahsdbhsad",
  storageBucket: "ahsdbhsad.firebasestorage.app",
  messagingSenderId: "289163631258",
  appId: "1:289163631258:web:66b16b91c9dab7e6f6dd23",
  measurementId: "G-8MES0SM0FK"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // ✅ Get Realtime Database instance

export { database, ref, set, push, serverTimestamp };
