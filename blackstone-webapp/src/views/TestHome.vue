<template>
    <div class="home">
        <p>This is the test home page, put things in here for testing specific pages</p>
        <YouthSubmitOrders />
        <button @click="logout" style="margin: 30px">Logout</button>
    </div>

</template>

<script>
    import firebase_app from 'firebase/app';
    import YouthSubmitOrders from "./youth/SubmitOrders";
    export default {
        name: 'home',
        components: {
            YouthSubmitOrders,
        },
        methods: {
            logout: function() {
                firebase_app.auth().signOut().then(() => {
                    this.$router.replace('login');
                });
            }
        }
    }
</script>