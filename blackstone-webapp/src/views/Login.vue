<template>
    <div class = "login">
      <div class="jumbotron loginJumbo">
        <img
          id="logo"
          src="../assets/experimental_station_logo.png"
        />

        <h3 style="margin-top: 1rem">Welcome to Blackstone Bicycle Works!</h3>

        <!-- Parents actions -->
        <div style="margin-top: 2rem">
          <h4>
              Parents, if you are looking to register a new child,
              <a href="/register-new-youth">
              Register a new youth
              </a>
          </h4>
        </div>
        
        <!-- Login input fields -->
        <div style="margin-top:2rem">
          <h4>Sign in to your youth/staff account</h4>
          <input class="input_field" type = "text" v-model = "email" placeholder = "Staff or Youth Email" v-on:keyup.enter="focusPW"><br>
          <input class="input_field" ref="password" type = "password" v-model = "password" placeholder = "Password" v-on:keyup.enter="login"><br>
          
          <button @click="login" v-if="!isLoggingIn" class="btn btn-light action-button">
            Login!</button>
          <button disabled v-else>Loading..</button>
          
          <div style="margin-top: 1rem">If you don't remember the account password, please talk to one of Blackstone Bicycle Work's staff members!</div>
        </div>

        
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

    .action-button {
      margin: 0.75rem;
      background: #56c6c6;
      border-radius: 20px;
      font-size: inherit;
      color: #fff;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }

    .action-button:hover {
      background: #66d7d7;
      color: #fff;
    }

    .input_field {
      padding: 0.75rem;
    }

    .loginJumbo {
      padding: 2rem 2.5rem;
      max-width: 60%;
      top:20px;
      position: relative;
      margin:auto;
      border-radius: 10px;
    }

    #logo {
      width: 70%;
      padding: 1rem;
      max-width: 300px;
      min-width: 225px;
    }

</style>