<template>
    <div class = "login">
      <div class="jumbotron loginJumbo">
        <h3>Sign in to your youth/staff account</h3>
        <input type = "text" v-model = "email" placeholder = "Staff or Youth Email"><br>
        <input type = "password" v-model = "password" placeholder = "Password"><br>
        <button @click="login">Login!</button>
        </br></br>
        <div>
          <a href="/register-new-youth">
              Or register a new youth
          </a>
        </div>

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
                password: ''
            };
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
                        alert("oops, something went wrong: " + err);
                    }
                )
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