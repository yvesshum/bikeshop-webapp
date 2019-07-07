<template>
    <div class="home">
        <p>This is the staff home page</p>
        <button @click="logout">Logout</button>
    </div>

</template>

<script>
import firebase_app from 'firebase/app';

export default {
    name: 'home',
    components: {

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