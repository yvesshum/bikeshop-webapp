<template>
  <div>
          <nav class="navbar navbar-light navbar-expand-md navigation-clean-button">
              <div class="container">
                <img id="logo" @click=imageUrl src="../assets/experimental_station_logo.png">
                <button class="navbar-toggler" v-b-toggle.navcol-1>
                  <span class="sr-only">Toggle navigation</span>
                  <span class="navbar-toggler-icon"></span>
                </button>
                  <b-collapse class="navbar-collapse" id="navcol-1">
                      <ul class="nav navbar-nav mr-auto"></ul>
                      <span class="navbar-text actions">
                        <a class="nav_button" href="/Home" v-if="show_logout_option">Dashboard</a>
                        <a class="nav_button" href="/emergency-contacts" v-if="show_logout_option && isStaff" >Emergency</a>
                        <a class="btn btn-light action-button" role="button" @click="logout" v-if="show_logout_option">Log Out</a>

                        <!-- Before Login -->
                        <a class="btn btn-light action-button" role="button" href="/login" v-if="!show_logout_option">Log In</a>
                      </span>
                  </b-collapse>
              </div>
          </nav>
          <div v-if="addPadding" class="under_navbar_padding">
          </div>
  </div>

</template>


<script>
    import {firebase} from '../firebase'
    import {isStaff} from '../scripts/getPrivilege'
    export default {
        name: 'TopBar',
        props: {
            omitEmail: {
                type: String,
                default: null,
            },
            addPadding: {
              type: Boolean,
              default: true
            }
        },
        data() {
            return {
                buttonText: "",
                isStaff: false
            };
        },
        computed: {
            show_logout_option: function() {
                return this.omitEmail == null;
            },
        },
        methods: {
            logout: function() {
                firebase.auth().signOut().then(() => this.$router.go("/Home"));

            },
            getButtonText() {
                if(this.show_logout_option){
                    this.buttonText = "Logout " + firebase.auth().currentUser.email;
                }
            },
            imageUrl() {
                window.location = "https://experimentalstation.org";
            },

        },
        async mounted() {
            this.getButtonText();
            this.isStaff = await isStaff()
        }
    }
</script>

<style scoped>
  .navbar {
  background-color: #efffff;
  position: fixed;
  width: 100%;
  z-index: 99;
  -webkit-box-shadow: 0px 3px 20px 0px rgba(0,0,0,0.5);
  -moz-box-shadow: 0px 3px 20px 0px rgba(0,0,0,0.5);
  box-shadow: 0px 3px 20px 0px rgba(0,0,0,0.5);
  }

  .nav_button {
  padding: 0rem 1rem;
  }

  .navigation-clean-button {
  padding: 1rem 0.5rem;
  }

  .navigation-clean-button .navbar-toggler {
  border-color: #ddd;
  margin-right: 1rem;
  }

  .navigation-clean-button .navbar-toggler:focus {
  background-color: #fff;
  }

  .navigation-clean-button .actions .nav_button {
  margin-right: 1rem;
  text-decoration: none;
  color: #465765;
  }

  .navigation-clean-button .navbar-text .action-button,
  .navigation-clean-button .navbar-text .action-button:active,
  .navigation-clean-button .navbar-text .action-button:hover,
  .navigation-clean-button .navbar-text .action-button:focus {
  background: #56c6c6;
  border-radius: 20px;
  font-size: inherit;
  color: #fff;
  border: none;
  padding: .5rem 1rem;
  cursor: pointer;
  }

  .navigation-clean-button .navbar-text .action-button:hover {
  background: #66d7d7;
  }

  .under_navbar_padding {
    padding: 5rem;
  }

  #logo {
    cursor: pointer;
    width: 70%;
    padding: 1rem;
    max-width: 300px;
    min-width: 225px;
  }

</style>
