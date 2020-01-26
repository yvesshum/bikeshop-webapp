<!--
Profile Lookup is a restricted version of Profile Lookup & Editing, located in staff pages.
-->

<template>
  <div class="profile_lookup_youth">
    <top-bar/>
    <h1 class="title">Profile Lookup</h1>
    <YouthIDSelector @selected="load_youth"/>

    <div ref="body_fields" v-show="currentProfile != null">

      <ProfileFields
        :profile="currentProfile"
        :headerDoc="header_doc"
        :periodData="period_data"
        showOptionalFields
      />

      <br />

      <ApronBar
        :profile="currentProfile"
      />

      <br /><br />

      <ProfileItemLogs
        :snapshot="profile_snapshot"
        :periods="periods"
        :visible="currentProfile != null"
      />

      <br /><br />
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
import ProfileItemLogs from "@/components/ProfileItemLogs.vue";
import {Period} from "@/scripts/Period.js";
import {mapKeyVal} from "@/scripts/ParseDB.js";

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileFields,
    ApronBar,
    ProfileItemLogs,
  },

  data: function() {
    return {
      currentProfile: null,
      profile_snapshot: null,
      header_doc: null,

      periods_db: db.collection("GlobalPeriods"),
      periods_doc: null,
      period_data: null,
      periods: [],

    };
  },

  // Grab profile header information and period information from database
  mounted: async function() {
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();
    await this.load_period_data();
  },

  methods: {

    // Load the period data for the children
    load_period_data: async function() {

      // Get period doc & data from database
      this.periods_doc = await this.periods_db.doc("metadata").get();
      var data = this.periods_doc.data();

      // Set the seasons for the Period object
      await Period.setSeasons(data["Seasons"]);

      // Get a list of all the periods
      this.periods = Period.enumerateStr(data["CurrentPeriod"], data["FirstPeriod"]);

      // Summarize period data to pass to children
      this.period_data = {
        cur_period: data["CurrentPeriod"],
        reg_period: data["CurrentRegistrationPeriod"],
        seasons:    data["Seasons"],
        class_list: mapKeyVal(data["Classes"], (name, desc) => name),
      };
    },

    // Load a youth's profile
    load_youth: async function(youth) {

      // No id returned - clear the page
      if (youth == null) {
        this.profile_snapshot = null;
        this.currentProfile = null;
      }

      // Id returned - load profile for that youth
      else {
        this.profile_snapshot = db.collection("GlobalYouthProfile").doc(youth.ID);
        this.currentProfile = await this.profile_snapshot.get();
      }
    },
  }
}
</script>

<style>
.title {
margin-bottom: 1rem;
}
</style>
