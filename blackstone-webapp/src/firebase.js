import firebase_app from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'
const config = {
    apiKey: "AIzaSyASx3iKdwsX64SrMpjxCp9rAM8aQsHJLbI",
    authDomain: "blackstone-production.firebaseapp.com",
    databaseURL: "https://blackstone-production.firebaseio.com",
    projectId: "blackstone-production",
    storageBucket: "blackstone-production.appspot.com",
    messagingSenderId: "190399094900",
};

firebase_app.initializeApp(config);

export const db = firebase_app.firestore();
export const firebase = firebase_app;
export const rb = firebase_app.database();
export const Timestamp = firebase_app.firestore.Timestamp;
