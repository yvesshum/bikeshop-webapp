import Vue from 'vue'
import Router from 'vue-router'
import YouthHome from './views/youth/YouthHome.vue'
import StaffHome from './views/staff/StaffHome'
import firebase_app from 'firebase/app'
import Login from './views/Login.vue'
import TestHome from './views/TestHome.vue'

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
            path: '/YouthHome',
            name: 'YouthHome',
            component: YouthHome,
            meta: {
                requiresAuth: true,
                requiresStaff: false
            }
        },
        {
            path: '/StaffHome',
            name: 'StaffHome',
            component: StaffHome,
            meta: {
                requiresAuth: true,
                requiresStaff: true
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
        }
        ]
});

router.beforeEach((to, from, next) => {
    const currentUser = firebase_app.auth().currentUser;
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresStaff = to.matched.some(record => record.meta.requiresStaff);

    if (requiresAuth && !currentUser) next('login');
    else if (!requiresAuth && currentUser) next('TestHome');
    // else if (requiresAuth && requiresStaff && currentUser.email === "yvesshum1210@gmail.com") next('StaffHome');
    else next();
});


export default router;