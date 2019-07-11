<template>
    <div class="home">
        <p>This is the test home page, put things in here for testing specific pages</p>
        <Example />
        <button @click="logout">Logout</button>
    </div>

</template>

<script>
    import firebase_app from 'firebase/app';
    import Example from './youth/Example.vue';
    export default {
        name: 'home',
        components: {
            Example
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