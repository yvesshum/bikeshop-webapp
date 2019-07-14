<template>
    <div class = "NavBar">
        <b-navbar type="dark" variant="info" fill>
            <div class ="NavBarContents">
            <b-navbar-brand href="/" style="align-self: center">Dashboard</b-navbar-brand>
            <img alt="experimental_station_logo" src = "../assets/experimental_station_logo.png" width = "20%" @click="imageUrl" style="align-self: center">
            <b-button pill @click="logout" style="align-self: center">{{buttonText}}</b-button>
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
                firebase.auth().signOut().then(() => this.$router.go("/"));

            },
            getButtonText() {
                this.buttonText = "Logout " + firebase.auth().currentUser.displayName;
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
    }
    .NavBarContents{
        display: flex;
        flex-direciton: row;
        flex: 1;
        justify-content: space-evenly;
        }



</style>