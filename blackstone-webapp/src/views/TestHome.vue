<template>
    <div class="home">
        <TopBar/>
        <p>This is the test home page, put things in here for testing specific pages</p>
        <CheckIn />
        <button @click="logout" style="margin: 30px">Logout</button>
    </div>

</template>

<script>
    import {firebase} from '../../firebase';
    import StaffManageSkills from "./staff/ManageApronSkills";
    import TopBar from '../components/TopBar';
    import CheckIn from '../views/youth/CheckIn.vue'
    export default {
        name: 'home',
        components: {
            StaffManageSkills,
            TopBar,
            CheckIn
        },
        methods: {
            logout: function() {
                firebase.auth().signOut().then(() => {
                    this.$router.replace('login');
                });
            }
        }
    }
</script>