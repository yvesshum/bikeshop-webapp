<template>
    <div class = "NavBar">
        <b-navbar toggleable="lg" type="dark" variant="info">
            <b-navbar-brand href="/">Dashboard</b-navbar-brand>
            <img alt="experimental_station_logo" src = "../assets/experimental_station_logo.png" width = "30%" @click="imageUrl">
            <b-button pill @click="logout">{{buttonText}}</b-button>
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


</style>