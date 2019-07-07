import Vue from 'vue'
import App from './App.vue'
import router from './router'
import firebase_app from 'firebase/app'
import firebase_auth from 'firebase/auth'

Vue.config.productionTip = false;

let app = '';

const config = {
    apiKey: "AIzaSyA39Jp3rVTwBrn__rkjbAFp2EZalfZVHYs",
    authDomain: "bikeshoptesting-9e034.firebaseapp.com",
    databaseURL: "https://bikeshoptesting-9e034.firebaseio.com",
    projectId: "bikeshoptesting-9e034",
    storageBucket: "bikeshoptesting-9e034.appspot.com",
    messagingSenderId: "50618401035"
};
firebase_app.initializeApp(config);

firebase_app.auth().onAuthStateChanged(() => {
    if (!app) {
        app = new Vue({
            router,
            render: h => h(App)
        }).$mount('#app');
    }
});


