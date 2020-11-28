<template>
    <div class = "login">
      <div class="jumbotron loginJumbo">
        <h2>
          Welcome to Blackstone Bicycle Works
        </h2>
        <h2>
              Parents, if you are looking to register a new child,
              <a href="/register-new-youth">
              Register a new youth
              </a>
        </h2>
        <br /> <br />
        <h3>Sign in to your youth/staff account</h3>
        <input type = "text" v-model = "email" placeholder = "Staff or Youth Email" v-on:keyup.enter="focusPW"><br>
        <input ref="password" type = "password" v-model = "password" placeholder = "Password" v-on:keyup.enter="login"><br>
        
        <button @click="login" v-if="!isLoggingIn">Login!</button>
        <button disabled v-else>Loading..</button>
        
        <p>If you don't remember the account password, please talk to one of Blackstone Bicycle Work's staff members!</p>
        </div>
    </div>
</template>

<script>
    import {firebase} from '../firebase.js';

    export default {
        name: 'login',
        data() {
            return {
                email: '',
                password: '',
                isLoggingIn: false,
            };
        },
        methods: {
            login: function() {
                this.isLoggingIn = true;
                firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(
                    () => {
                        // console.log(user);
                        this.$router.replace('Home');
                        this.$emit("logged-in");
                    })
                    .catch(err => {
                        alert("Oops, something went wrong. You probably entered the wrong password.");
                        console.log(err); // eslint-disable-line no-console
                    }).finally(() => this.isLoggingIn = false)
            },
            focusPW: function() {
                this.$refs.password.focus();
            }
        }
    }
</script>

<style scoped>
    .login {
        height:100%;
        background-image: url('../assets/bike.jpg');
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
      position: relative;
      margin:auto;
      border-radius: 10px;
    }
</style>