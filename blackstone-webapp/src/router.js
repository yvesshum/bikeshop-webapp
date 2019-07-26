import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import {firebase} from './firebase.js'
import Login from './views/Login.vue'
import TestHome from './views/TestHome.vue'
import CheckIn from './views/youth/CheckIn.vue'
import ProfileLookup from './views/youth/ProfileLookup.vue'
import YouthSubmitOrders from './views/youth/SubmitOrders.vue'
import ApproveOrders from './views/staff/ApproveOrders.vue'


Vue.use(Router);

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '*',
            redirect: '/login'
        },
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/Home',
            name: 'Home',
            component: Home,
            meta: {
                requiresAuth: true,
                requiresStaff: false
            }
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/TestHome',
            name: 'TestHome',
            component: TestHome,
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/check-in',
            name: 'check-in',
            component: CheckIn,
            meta: {
                requiresAuth: true,
                requiresStaff: false
            }
        },
        {
            path: '/profile-lookup',
            name: 'profile-lookup',
            component: ProfileLookup,
            meta: {
                requiresAuth: true,
                requiresStaff: false
            }
        },
        {
            path: '/submit-orders',
            name: 'submit-orders',
            component: YouthSubmitOrders,
            meta:{
                requiresAuth: true,
                requiresStaff: false
            }
        },

        {
            path: '/approve-orders',
            name: 'approve-orders',
            component: ApproveOrders,
            meta:{
                requiresAuth: true,
                requiresStaff: true
            }
        }

        ]
});

router.beforeEach(async (to, from, next) => {
    const currentUser = await firebase.auth().currentUser;
    let isStaff = false;
    if (currentUser) {
        if (currentUser.email === "yvesshum@uchicago.edu") {
            isStaff = true;
        }
    }
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresStaff = to.matched.some(record => record.meta.requiresStaff);
    
    if (requiresAuth && !currentUser) next('login');
    else if (!requiresAuth && currentUser) next('Home');
    else if (requiresAuth && requiresStaff && !isStaff) {
        window.alert("You do not have permissions to see this page!");
        next('Home');
    }
    else next();
});


export default router;