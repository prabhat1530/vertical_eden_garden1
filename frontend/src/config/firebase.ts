import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBseXazoRfEs9ktXngTIjWFNott_9bO4go",
    authDomain: "verticaledengarden-32475.firebaseapp.com",
    projectId: "verticaledengarden-32475",
    storageBucket: "verticaledengarden-32475.firebasestorage.app",
    messagingSenderId: "104229210978",
    appId: "1:104229210978:web:3dca6b08925d6d40fffa3b",
    measurementId: "G-7FEM1SLWTT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
