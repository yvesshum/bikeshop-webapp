import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import {firebase} from './firebase.js'
import Login from './views/Login.vue'
import TestHome from './views/TestHome.vue'
import CheckIn from './views/youth/CheckIn.vue'
import ProfileLookup from './views/youth/ProfileLookup.vue'
import ProfileLookupStaff from './views/staff/ProfileLookupAndEditing.vue'
import YouthSubmitOrders from './views/youth/SubmitOrders.vue'
import ApproveOrders from './views/staff/ApproveOrders.vue'
import YouthCheckOrders from './views/youth/CheckOrders.vue'
import ManageApronSkills from './views/staff/ManageApronSkills.vue'
import CheckedIn from './views/staff/CheckedIn.vue'
import StaffRegisterYouth from './views/staff/RegisterNewYouth.vue'
import HourTransfer from './views/youth/TransferCurrentHours'
import ApproveTransfers from './views/staff/ApproveTransferHours'
import AdminPanel from './views/staff/AdminPanel.vue'
import YouthOrderSettings from './views/admin/YouthOrderSettings.vue'
import ApproveHourLogs from './views/staff/ApproveHourLogs.vue'
import YouthProfileStaffSettings from './views/admin/YouthProfileStaffSettings.vue'

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
            path: '/profile-lookup-staff',
            name: 'profile-lookup-staff',
            component: ProfileLookupStaff,
            meta: {
                requiresAuth: true,
                requiresStaff: true
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
        },
        
        {
            path: '/check-orders',
            name: 'check-orders',
            component: YouthCheckOrders,
            meta:{
                requiresAuth: true,
                requiresStaff: false
            }
        },
        {
            path: '/manage-skills-staff',
            name: 'manage-skills-staff',
            component: ManageApronSkills,
            meta: {
                requiresAuth: true,
                requiresStaff: true
            }
        },
        {
            path: '/checked-in',
            name: 'checked-in',
            component: CheckedIn,
            meta: {
                requiresAuth: true,
                requiresStaff: false
            }
        },
        {
            path: '/transfer-hours',
            name: 'transfer-hours',
            component: HourTransfer,
            meta: {
                requiresAuth: true,
                requiresStaff: false
            }
        },
        {
            path: '/approve-transfers',
            name: 'approve-transfers',
            component: ApproveTransfers,
            meta: {
                requiresAuth: true,
                requiresStaff: true
            }
        },
        {
            path: '/register-new-youth',
            name: 'register-new-youth',
            component: StaffRegisterYouth,
            meta: {
                requiresAuth: true,
                requiresStaff: true
            }
        },
        {
            path: '/approve-hours',
            name: 'approve-hours',
            component: ApproveHourLogs,
            meta: {
                requiresAuth: true,
                requiresStaff: true
            }
        },
        {
            path: '/admin-panel',
            name: 'admin-panel',
            component: AdminPanel,
            meta: {
                requiresAuth: true,
                requiresStaff: true
            }
        },
        

        




        // Admin Panels

        {
            path: '/youth-order-settings',
            name: 'youth-order-settings',
            component: YouthOrderSettings,
            meta: {
                requiresAuth: true,
                requiresStaff: true
            }
        },
        {
            path: '/youth-profile-staff-settings',
            name: 'youth-profile-staff-settings',
            component: YouthProfileStaffSettings,
            meta: {
                requiresAuth: true,
                requiresStaff: true
            }
        },


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