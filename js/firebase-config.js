import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Grab parameters directly out of the 1-File config structure loaded in window context
const currentKeysPayload = window.clientPortalSettings.firebaseConfig;

// Boot the direct database core instance for this folder workspace environment
const app = initializeApp(currentKeysPayload);
const db = getFirestore(app);
const auth = getAuth(app);

window.db = db;
window.auth = auth;

export { 
    db, auth,
    onAuthStateChanged, signInWithEmailAndPassword, signOut,
    doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, onSnapshot 
};
window.doc = doc; window.getDoc = getDoc; window.setDoc = setDoc; window.updateDoc = updateDoc;
window.addDoc = addDoc; window.collection = collection; window.query = query; window.where = where;
window.getDocs = getDocs; window.onSnapshot = onSnapshot; window.onAuthStateChanged = onAuthStateChanged;
