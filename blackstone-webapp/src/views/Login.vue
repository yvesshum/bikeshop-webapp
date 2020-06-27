<template>
    <div class = "login">
      <TopBar/>
      <div class="jumbotron loginJumbo">
        <h2>
          Welcome to Blackstone Bicycle Works!
        </h2>
        <h4 class="action_option">
              Parents, if you are looking to register a new child,
              <a href="/register-new-youth">
              Register a new youth
              </a>
        </h4>
        <h4 class="action_option">Sign in to your youth/staff account</h4>
        <input type = "text" v-model = "email" placeholder = "Staff or Youth Email"><br>
        <input type = "password" v-model = "password" placeholder = "Password"><br>
        <button class="btn btn-light action-button" @click="login">Login!</button>
        <p>If you don't remember the account password, please talk to one of Blackstone Bicycle Work's staff members!</p>
        </div>
    </div>
</template>

<script>
    import {firebase} from '../firebase.js';
    import TopBar from '@/components/TopBar';

    export default {
        name: 'login',
        data() {
            return {
                email: '',
                password: ''
            };
        },
        components: {
            TopBar,
        },
        methods: {
            login: function() {
                firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(
                    user => {
                        console.log(user);
                        this.$router.replace('Home');
                        this.$emit("logged-in");
                    },
                    err => {
                        alert("Oops, something went wrong. You probably entered the wrong password.");
                        console.log(err);
                    }
                )
            }
        }
    }
</script>

<style scoped>
    .action_option {
        margin-top: 2rem;
    }
    .btn-light {
        margin-top: 0.5rem;
    }
    .login {
        height:100%;
        background-image: url('../assets/bike.jpg');
        background-size: auto 100%;
        background-attachment: fixed;
    }
    input {
        margin: 10px 0;
        width: 50%;
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
    .loginJumbo {
      max-width: 60%;
      top:20px;
      margin:auto;
      border-radius: 10px;
    }
</style>