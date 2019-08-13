<template>
  <div class="profile_lookup_staff">
    <TopBar/>
    <p>This is the staff view of the youth profile lookup page</p>

    <!-- Replaced selector bar with static buttons to test without spamming firebase -->
    <YouthIDSelector @selected="selectedID"/>
    <!-- <button ref="adam_button" v-on:click="load_adam()">Load Adam's Profile</button> -->
    <!-- <button ref="yves_button" v-on:click="load_yves()">Load Yves's Profile</button> -->
    <!-- <button ref="none_button" v-on:click="load_none()">Clear Profile Info</button> -->

    <div ref="body_fields" style="display: none;">
      <ProfileFields :current-profile="currentProfile" :header_doc="this.header_doc" :allow_edits="true" />
      <!-- <ApronBar /> -->

      <p>Order Log:</p>
      <CollectionTable ref="order_log" :heading_data="this.header_doc['order_log']" :current_collection="order_log_collection"></CollectionTable>

      <p>Work Log:</p>
      <CollectionTable ref="work_log" :heading_data="this.header_doc['work_log']" :current_collection="work_log_collection"></CollectionTable>
    </div>
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
      work_log_collection: null,
      header_doc: null
    };
  },

  mounted: async function() {
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();
  },

    methods: {

      selectedID: async function(id) {

        // No id returned - clear the page
        if (id == null) {
          this.load_none();
        }

        // Id returned - load profile for that youth
        else {
          this.$refs.body_fields.style.display = "";

          id = id.slice(id.lastIndexOf(' ')+1);
          let snapshot = db.collection("GlobalYouthProfile").doc(id);

          this.currentProfile = await snapshot.get();
          this.order_log_collection = snapshot.collection("Order Log");
          this.work_log_collection  = snapshot.collection("Work Log");
        }
      },

      load_adam: async function() {

        this.$refs.body_fields.style.display = "";

        let snapshot = db.collection("GlobalYouthProfile").doc("HPLtPG2rZCfdGhATE36x");

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection  = snapshot.collection("Work Log");
      },

      load_yves: async function() {

        this.$refs.body_fields.style.display = "";

        let snapshot = db.collection("GlobalYouthProfile").doc("10001");

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection  = snapshot.collection("Work Log");
      },

      load_none: function() {
        this.$refs.body_fields.style.display = "none";
        this.currentProfile = null;
        this.order_log_collection = null;
        this.work_log_collection  = null;
      }
    }
}
</script>