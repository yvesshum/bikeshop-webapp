<!--
Profile Lookup is a restricted version of Profile Lookup & Editing, located in staff pages.
-->

<template>
  <div class="profile_lookup_youth">
    <div class="content">
    <top-bar/>
    <h1 class="title">Profile Lookup</h1>
    <PageHeader pageCategory="Youth Headers" pageName="Profile Lookup"></PageHeader>
    <br />
    <YouthIDSelector @selected="load_youth" :args="{openDirection: 'bottom'}" />
    <br />

    <ProfileTabs v-show="currentProfile != null"
      :profile="currentProfile"
      :headerDoc="header_doc"
      :activePeriods="current_active_periods"
      :seasons="seasons"
      :periods="periods"
      :period_metadata="period_metadata"
      edit
    />

    <div v-show="currentProfile == null">
      <br>
      <p style="margin: 0 2rem;">To see your profile, start typing your name or ID into the bar above and select your name when it comes up.</p>
    </div>

    <RefTracker :reference="profile_ref" @snapshot="handle_profile_snapshot" />

    </div>
  <Footer/>
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
import ProfileTabs from "@/components/ProfileTabs.vue";
import RefTracker from "@/components/RefTracker.vue";

import PageHeader from "@/components/PageHeader.vue"
import {Period} from "@/scripts/Period.js";
import {mapKeyVal} from "@/scripts/ParseDB.js";
import {mapObj} from "@/scripts/ParseDB.js";
import {Youth} from "@/scripts/Youth.js";

let HeaderRef = db.collection("GlobalFieldsCollection").doc("Youth Profile");

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileTabs,
    RefTracker,
    PageHeader
  },

  data: function() {
    return {
      currentProfile: null,
      profile_ref: null,
      header_doc: null,

      periods_db: db.collection("GlobalPeriods"),
      periods_doc: null,
      period_metadata: null,
      periods: [],

      period_data: new Object(),

      current_active_periods: new Object(),
    };
  },

  // Grab profile header information and period information from database
  mounted: async function() {
    this.header_doc = await HeaderRef.get();
    await this.load_period_data();
  },

  computed: {
    seasons: function() {
      return this.period_metadata ? this.period_metadata.seasons : [];
    }
  },

  methods: {

    // Load the period data for the children
    load_period_data: async function() {

      // Load the Periods collection and go through each document in it
      var snapshot = await this.periods_db.get();
      snapshot.docs.forEach(doc => {

        // Handle based on document ID
        switch (doc.id) {

          // For the metadata document, load season data
          case "metadata":
            this.handle_period_metadata(doc);
            break;

          // For all year documents, load the data
          default:
            this.period_data[doc.id] = doc.data();
            break;
        }
      });
    },

    handle_period_metadata: async function(doc) {
      this.periods_doc = doc; // await this.periods_db.doc("metadata").get();
      var data = this.periods_doc.data();

      // Set the seasons for the Period object
      await Period.setSeasons(data["Seasons"]);

      // Get a list of all the periods
      this.periods = Period.enumerateStr(data["CurrentPeriod"], data["FirstPeriod"]);

      // Summarize period data to pass to children
      this.period_metadata = {
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
        this.profile_ref = null;
        this.currentProfile = null;
      }

      // Id returned - load profile for that youth
      else {
        this.profile_ref = db.collection("GlobalYouthProfile").doc(youth.ID);
        this.current_active_periods = this.create_active_periods(youth, this.period_data);
      }
    },

    handle_profile_snapshot: function({snapshot, update}) {
      this.currentProfile = snapshot;
    },

    create_active_periods: function(youth, period_data) {

      // Collect all the seasons from the nested year -> season data structure
      var obj = Object.entries(period_data).reduce( (acc, [_, seasons]) => {
        return {...acc, ...seasons}
      }, {} );

      // Convert each period list into the youth's class during that period
      // If youth not active, remove the period from the object
      mapObj(obj, (period, val) => {

        // Find all instances matching the youth in this period
        let matches = Youth.findMatches(val, youth);

        // If youth not active in this period, delete it from the object
        if (matches.length == 0) {
          return undefined;
        }

        // If youth found once, set the value to their class
        else if (matches.length == 1) {
          return {key: period, value: matches[0]["Class"]};
        }

        // If found more than once, flag it and use the first instance in the list
        else {
          console.warn("Multiple instances of youth " + youth + " in period " + period);
          return {key: period, value: matches[0]["Class"]};
        }
      });

      // Return the final object
      return obj;
    }
  }
}
</script>