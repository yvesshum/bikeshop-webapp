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
    <CollectionTable ref="order_log" :heading_data="['Item Name', 'Item ID', 'Item Cost', 'Status', 'Date', 'Notes']" :current_collection="order_log_collection"></CollectionTable>

    <p>Work Log:</p>
    <CollectionTable ref="work_log" :heading_data="['Category 1', 'Category 2', 'Category 3', 'Category 4']" :current_collection="work_log_collection"></CollectionTable>

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
      currentProfile: null,
      order_log_collection: null,
      work_log_collection: null
    };
  },

    methods: {

      selectedID: async function(id) {
        id = id.slice(id.lastIndexOf(' ')+1);

        let snapshot = db.collection("GlobalYouthProfile").doc(id);

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection =  snapshot.collection("Work Log");
      },

      logout: function() {
          firebase_app.auth().signOut().then(() => {
              this.$router.replace('login');
          });
      },

      load_adam: async function() {

        let snapshot = db.collection("GlobalYouthProfile").doc("HPLtPG2rZCfdGhATE36x");

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection =  snapshot.collection("Work Log");
      },

      load_yves: async function() {

        let snapshot = db.collection("GlobalYouthProfile").doc("10001");

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection =  snapshot.collection("Work Log");
      },

      load_none: function() {
        this.currentProfile = null;
        this.order_log_collection = null;
        this.work_log_collection =  null;
      }
    }
}
</script>