import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Grab parameters directly out of the 1-File config structure loaded in window context
const currentKeysPayload = window.clientPortalSettings.firebaseConfig;

// Boot the direct database core instance for this folder workspace environment
const app = initializeApp(currentKeysPayload);
const db = getFirestore(app);
const auth = getAuth(app);

// Bind variables globally so that the login.html inline module can read them instantly
window.db = db;
window.auth = auth;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;

// Firestore Node Module Mappings Binding Layers
window.doc = doc; 
window.getDoc = getDoc; 
window.setDoc = setDoc; 
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.addDoc = addDoc; 
window.collection = collection; 
window.query = query; 
window.where = where;
window.getDocs = getDocs; 
window.onSnapshot = onSnapshot;

export { 
    db, auth,
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, onSnapshot 
};
