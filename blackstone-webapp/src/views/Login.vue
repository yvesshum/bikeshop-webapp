<template>
    <div class = "login">
        <h3>Sign In to your youth/staff account</h3>
        <input type = "text" v-model = "email" placeholder = "Staff or Youth Email"><br>
        <input type = "password" v-model = "password" placeholder = "Password"><br>
        <button @click="login">Login!</button>
        <p>If you don't remember the account password, please talk to one of Blackstone Bicycle Work's staff members!</p>
    </div>
</template>

<script>
    import firebase_app from 'firebase/app';

    export default {
        name: 'login',
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

<style scoped>
    .login {
        margin-top: 40px;
    }
    input {
        margin: 10px 0;
        width: 20%;
        padding: 15px;
        text-align: center;
    }
    p {
        margin-top:40px;
        font-size: 13px;
    }
    p a {
        text-decoration: underline;
        cursor: pointer;
    }
</style>