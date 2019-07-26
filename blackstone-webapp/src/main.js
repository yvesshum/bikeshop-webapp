import Vue from 'vue'
import App from './App.vue'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import {firebase} from './firebase.js'
import VueTabulator from 'vue-tabulator'
import TopBar from './components/TopBar'

Vue.component('top-bar', TopBar);


Vue.use(BootstrapVue);
Vue.use(VueTabulator);

let app = '';

firebase.auth().onAuthStateChanged(() => {
    console.log('q')
    if (!app) {
        app = new Vue({
            router,
            render: h => h(App)
        }).$mount('#app');
    }
});

Vue.config.productionTip = false;


