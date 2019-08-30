<template>
    <div class = "NavBar">
        <!-- <b-navbar type="dark" variant="info" fill>
            <div class ="NavBarContents">
            <b-navbar-brand href="/" style="align-self: center">Dashboard</b-navbar-brand>
            <img alt="experimental_station_logo" src = "../assets/experimental_station_logo.png" width = "20%" @click="imageUrl">
            <b-button pill @click="logout" style="align-self: center">{{buttonText}}</b-button>
            </div>
        </b-navbar> -->
        <b-navbar class="navbar navbar-light navbar-expand-md shadow-sm navigation-clean-button" style="background-color: #16a2b8;">
            <div class="container">
              <a class="navbar-brand" href="/" style="font-family: Cabin, sans-serif;">Dashboard</a>
              <a class="btn btn-light text-left bg-info border rounded border-info action-button" role="button" @click="logout">Log out</a>
            </div>
        </b-navbar>
    </div>
</template>


<script>
    import {firebase} from '../firebase'
    export default {
        name: 'TopBar',
        data() {
            return {
                buttonText: ""
            };
        },
        methods: {
            logout: function() {
                firebase.auth().signOut().then(() => this.$router.go("/Home"));

            },
            getButtonText() {
                this.buttonText = "Logout " + firebase.auth().currentUser.email;
            },
            imageUrl() {
                window.location = "https://experimentalstation.org";
            }

        },
        mounted() {
            this.getButtonText();
        }
    }
</script>

<style scoped>
    img{
        cursor: pointer;
        align-self: center;
        min-width: 10rem;
        margin: 0.7rem 1rem;
    }
    .NavBar {
      margin-bottom: 2rem;
    }
    .NavBarContents{
        display: flex;
        flex-direciton: row;
        flex: 1;
        justify-content: space-evenly;
        }



</style>
