import Vue from 'vue'
import App from './App.vue'
import router from './router'
import firebase from 'firebase/app'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue)


let app = '';
firebase.auth().onAuthStateChanged(() => {
    if (!app) {
        app = new Vue({
            router,
            render: h => h(App)
        }).$mount('#app');
    }
});

Vue.config.productionTip = false;


