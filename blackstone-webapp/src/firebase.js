import firebase from 'firebase/app'
import 'firebase/firestore'

const config = {
    apiKey: "AIzaSyA39Jp3rVTwBrn__rkjbAFp2EZalfZVHYs",
    authDomain: "bikeshoptesting-9e034.firebaseapp.com",
    databaseURL: "https://bikeshoptesting-9e034.firebaseio.com",
    projectId: "bikeshoptesting-9e034",
    storageBucket: "bikeshoptesting-9e034.appspot.com",
    messagingSenderId: "50618401035"
};

firebase.initializeApp(config);

export const db = firebase.firestore();;