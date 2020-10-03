import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { firebase } from "./firebase.js";
import VueTabulator from "vue-tabulator";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCoffee,
  faBars,
  faTimes,
  faEdit,
  faPlus,
  faCheckCircle,
  faExclamationTriangle,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import VueClipboard from "vue-clipboard2";

library.add(
  faCoffee,
  faBars,
  faTimes,
  faEdit,
  faPlus,
  faCheckCircle,
  faExclamationTriangle,
  faPen
);

Vue.component("font-awesome-icon", FontAwesomeIcon);
Vue.component("top-bar", TopBar);
Vue.component("Footer", Footer);

Vue.use(BootstrapVue);
Vue.use(VueTabulator);
Vue.use(VueClipboard);

let app = "";

firebase.auth().onAuthStateChanged(() => {
  if (!app) {
    app = new Vue({
      router,
      render: (h) => h(App),
    }).$mount("#app");
  }
});

Vue.config.productionTip = false;
