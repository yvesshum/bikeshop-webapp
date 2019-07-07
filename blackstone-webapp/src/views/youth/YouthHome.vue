<template>
  <div class="home">
    <p>This is the youth home</p>
    <button @click="logout">Logout</button>
  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

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
