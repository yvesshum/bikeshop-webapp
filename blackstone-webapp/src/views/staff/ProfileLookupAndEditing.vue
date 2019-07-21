<template>
  <div class="profile_lookup_staff">
    <TopBar/>
    <p>This is the staff view of the youth profile lookup page</p>

    <!-- Replaced selector bar with static buttons to test without spamming firebase -->
    <!-- <YouthIDSelector @selected="selectedID"/> -->
    <button ref="adam_button" v-on:click="load_adam()">Load Adam's Profile</button>
    <button ref="yves_button" v-on:click="load_yves()">Load Yves's Profile</button>
    <button ref="none_button" v-on:click="load_none()">Clear Profile Info</button>

    <ProfileFields :current-profile="currentProfile" />
    <!-- <ApronBar /> -->

    <p>Order Log:</p>
    <CollectionTable ref="order_log" :heading_data="['Item Name', 'Item ID', 'Item Cost', 'Status', 'Date', 'Notes']" :current_profile="this.currentProfile" collection_name="Order Log"></CollectionTable>

    <p>Work Log:</p>
    <CollectionTable ref="work_log" :heading_data="['Category 1', 'Category 2', 'Category 3', 'Category 4']" :current_profile="this.currentProfile" collection_name="Work Log"></CollectionTable>

    <button @click="logout">Logout</button>
  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../../firebase';
import {firebase} from '../../firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import TopBar from '@/components/TopBar';
import YouthIDSelector from "@/components/YouthIDSelector.vue"
import ProfileFields from "@/components/ProfileFields.vue"
import ApronBar from "@/components/ApronBar.vue"
import CollectionTable from "@/components/CollectionTable.vue"

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileFields,
    ApronBar,
    CollectionTable
  },

  data: function() {
    return {
      currentProfile: null
    };
  },

    methods: {

      selectedID: async function(id) {
        id = id.slice(id.lastIndexOf(' ')+1);
        this.currentProfile = {
          loaded: await db.collection("GlobalYouthProfile").doc(id).get(),
          unloaded: db.collection("GlobalYouthProfile").doc(id)
        };
      },

      logout: function() {
          firebase_app.auth().signOut().then(() => {
              this.$router.replace('login');
          });
      },

      load_adam: async function() {
        this.currentProfile = {
          loaded: await db.collection("GlobalYouthProfile").doc("HPLtPG2rZCfdGhATE36x").get(),
          unloaded: db.collection("GlobalYouthProfile").doc("HPLtPG2rZCfdGhATE36x")
        };
      },

      load_yves: async function() {
        this.currentProfile = {
          loaded: await db.collection("GlobalYouthProfile").doc("10001").get(),
          unloaded: db.collection("GlobalYouthProfile").doc("10001")
        };
      },

      load_none: function() {
        this.currentProfile = null;
      }
    }
}
</script>