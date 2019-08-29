import firebase_app from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'
const config = {
    apiKey: "AIzaSyA39Jp3rVTwBrn__rkjbAFp2EZalfZVHYs",
    authDomain: "bikeshoptesting-9e034.firebaseapp.com",
    databaseURL: "https://bikeshoptesting-9e034.firebaseio.com",
    projectId: "bikeshoptesting-9e034",
    storageBucket: "bikeshoptesting-9e034.appspot.com",
    messagingSenderId: "50618401035"
};

firebase_app.initializeApp(config);

export const db = firebase_app.firestore();
export const firebase = firebase_app;
export const rb = firebase_app.database();
export const Timestamp = firebase_app.firestore.Timestamp;