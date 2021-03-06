import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import CheckIn from "./views/youth/CheckIn.vue";
import ProfileLookup from "./views/youth/ProfileLookup.vue";
import ProfileLookupStaff from "./views/staff/ProfileLookupAndEditing.vue";
import YouthSubmitOrders from "./views/youth/SubmitOrders.vue";
import ApproveOrders from "./views/staff/ApproveOrders.vue";
import YouthCheckOrders from "./views/youth/CheckOrders.vue";
import ManageApronSkills from "./views/staff/ManageApronSkills.vue";
import CheckedIn from "./views/staff/CheckedIn.vue";
import RegisterYouth from "./views/staff/RegisterNewYouth.vue";
import ApproveNewYouth from "./views/staff/ApproveNewYouth.vue";
import HourTransfer from "./views/youth/TransferCurrentHours";
import ApproveTransfers from "./views/staff/ApproveTransferHours";
import AdminPanel from "./views/staff/AdminPanel.vue";
import YouthOrderSettings from "./views/admin/YouthOrderSettings.vue";
import ApproveHourLogs from "./views/staff/ApproveHourLogs.vue";
import YouthProfileStaffSettings from "./views/admin/YouthProfileStaffSettings.vue";
import ApronColorsSettings from "./views/admin/ApronColorsSettings.vue";
import HourLoggingCategoriesSettings from "./views/admin/HourLoggingCategoriesSettings.vue";
import EssayQuestionsSettings from "./views/admin/EssayQuestionsSettings.vue";
import ManagePeriods from "./views/staff/ManagePeriods.vue";
import AddSubtractHours from "./views/staff/AddSubtractHours.vue";
import LogHoursForYouth from "./views/staff/LogHoursForYouth.vue";
import Stats from "./views/staff/Stats.vue";
import EmergencyContacts from "./views/staff/EmergencyContacts.vue";
import SpecialInputDemo from "./views/staff/SpecialInputDemo.vue";
import PeriodSettings from "./views/admin/PeriodSettings.vue";
import ClassSettings from "./views/admin/ClassSettings";
import PageHeaders from "./views/admin/PageHeaders";
import { isAdmin, isStaff, isLoggedIn } from "./scripts/getPrivilege";
import EmailLookup from "./views/staff/EmailLookup.vue";
import BlogPageManager from "./views/staff/BlogPageManager.vue";
import BlogPage from "./views/general/BlogPage.vue";
Vue.use(Router);

const router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "*",
      redirect: "/login",
    },
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/Home",
      name: "Home",
      component: Home,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/check-in",
      name: "check-in",
      component: CheckIn,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },
    {
      path: "/profile-lookup",
      name: "profile-lookup",
      component: ProfileLookup,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },
    {
      path: "/profile-lookup-staff",
      name: "profile-lookup-staff",
      component: ProfileLookupStaff,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/submit-orders",
      name: "submit-orders",
      component: YouthSubmitOrders,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },

    {
      path: "/approve-orders",
      name: "approve-orders",
      component: ApproveOrders,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },

    {
      path: "/check-orders",
      name: "check-orders",
      component: YouthCheckOrders,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },
    {
      path: "/manage-skills-staff",
      name: "manage-skills-staff",
      component: ManageApronSkills,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/checked-in",
      name: "checked-in",
      component: CheckedIn,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },
    {
      path: "/email-lookup",
      name: "email-lookup",
      component: EmailLookup,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/transfer-hours",
      name: "transfer-hours",
      component: HourTransfer,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },
    {
      path: "/approve-transfers",
      name: "approve-transfers",
      component: ApproveTransfers,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/register-new-youth",
      name: "register-new-youth",
      component: RegisterYouth,
      // meta: {
      //     requiresAuth: true,
      //     requiresStaff: true
      // }
    },
    {
      path: "/approve-hours",
      name: "approve-hours",
      component: ApproveHourLogs,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/approve-youth-registration",
      name: "approve-youth-registration",
      component: ApproveNewYouth,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/manage-periods",
      name: "/manage-periods",
      component: ManagePeriods,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/admin-panel",
      name: "admin-panel",
      component: AdminPanel,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/add-subtract-hours",
      name: "add-subtract-hours",
      component: AddSubtractHours,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/log-hours-for-youth",
      name: "log-hours-for-youth",
      component: LogHoursForYouth,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/stats",
      name: "stats",
      component: Stats,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/blog-page-manager",
      name: "blog-page-manager",
      component: BlogPageManager,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/emergency-contacts",
      name: "emergency-contacts",
      component: EmergencyContacts,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },
    {
      path: "/special-input-demo",
      name: "special-input-demo",
      component: SpecialInputDemo,
      meta: {
        requiresAuth: true,
        requiresStaff: true,
      },
    },

    // Admin Panels
    {
      path: "/page-headers",
      name: "page-headers",
      component: PageHeaders,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/essay-questions-settings",
      name: "essay-questions-settings",
      component: EssayQuestionsSettings,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/class-settings",
      name: "class-settings",
      component: ClassSettings,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/youth-order-settings",
      name: "youth-order-settings",
      component: YouthOrderSettings,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/youth-profile-staff-settings",
      name: "youth-profile-staff-settings",
      component: YouthProfileStaffSettings,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/apron-colors-settings",
      name: "apron-colors-settings",
      component: ApronColorsSettings,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/hour-logging-categories-settings",
      name: "hour-logging-categories-settings",
      component: HourLoggingCategoriesSettings,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: "/period-settings",
      name: "period-settings",
      component: PeriodSettings,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },

    // General
    {
      path: "/blog-page",
      name: "blog-page",
      component: BlogPage,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },

    {
      path: "/blog-page-list",
      name: "blog-page-list",
      component: BlogPageManager,
      meta: {
        requiresAuth: true,
        requiresStaff: false,
      },
    },
  ],
});

const getIsStaff = isStaff;
const getIsAdmin = isAdmin;
const getIsLoggedIn = isLoggedIn;

router.beforeEach(async (to, from, next) => {
  let isStaff = await getIsStaff();
  let isAdmin = await getIsAdmin();
  const loggedIn = await getIsLoggedIn();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresStaff = to.matched.some((record) => record.meta.requiresStaff);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

  if (requiresAuth && !loggedIn) next("login");
  else if (!requiresAuth && loggedIn) next("Home");
  else if (requiresAuth && requiresStaff && !isStaff) {
    window.alert("You do not have permissions to see this page!");
    next("Home");
  } else if (requiresAuth && requiresAdmin && !isAdmin) {
    window.alert("Sorry but you don't have admin privillege to see this page");
    next("Home");
  } else {
    next();
  }
});

export default router;
