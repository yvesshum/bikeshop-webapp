<template>

</template>


<script>
    import firebase from 'firebase/app';

    export default {
        name: 'top-bar',
        data() {
            return {
                email: '',
                password: ''
            };
        },
        methods: {
            login: function() {
                firebase_app.auth().signInWithEmailAndPassword(this.email, this.password).then(
                    user => {
                        this.$router.replace('TestHome');
                    },
                    err => {
                        alert("oops, something went wrong: " + err);
                    }
                )
            }
        }
    }
</script>