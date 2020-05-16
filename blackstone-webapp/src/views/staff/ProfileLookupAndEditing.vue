<template>
  <div class="profile_lookup_staff">
    <TopBar/>

    <h1 class="title">Profile Lookup and Editing</h1>
    <PageHeader pageCategory="Staff Headers" pageName="Profile Lookup and Editing"></PageHeader>
    <YouthIDSelector @selected="load_youth"/>
    <br />

    <div ref="body_fields" v-show="currentProfile != null">
      <ProfileFields
        :profile="currentProfile"
        :headerDoc="header_doc"
        :periodData="period_metadata"
        edit showOptionalFields
      />

      <br /><br />

      <h3>Active Periods & Classes</h3>
      <PeriodsClassesDisplay
        :active_periods="current_active_periods"
        :seasons="period_metadata['seasons']"
        v-bind="period_metadata"
        disable_selection
        style="max-width: 95%; margin:auto"
      />

      <br />

      <ApronBar :profile="currentProfile" allowEdits />

      <br /><br />

      <ProfileItemLogs
        :snapshot="profile_snapshot"
        :periods="periods"
        :visible="currentProfile != null"
      ></ProfileItemLogs>

      <br /><br />
    </div>

    <div v-show="currentProfile == null">
      <br>
      <p>Search the bar above to view a youth's profile information.</p>
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
import PeriodsClassesDisplay from "@/components/PeriodsClassesDisplay";
import PageHeader from "@/components/PageHeader.vue"

import {Period} from "@/scripts/Period.js";
import {mapKeyVal} from "@/scripts/ParseDB.js";
import {mapObj} from "@/scripts/ParseDB.js";
import {Youth} from "@/scripts/Youth.js";

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileFields,
    ApronBar,
    ProfileItemLogs,
    PeriodsClassesDisplay,
    PageHeader,
  },

  data: function() {
    return {
      currentProfile: null,
      profile_snapshot: null,
      header_doc: null,

      periods_db: db.collection("GlobalPeriods"),
      periods_doc: null,
      period_metadata: null,
      periods: [],

      period_data: new Object(),

      current_active_periods: new Object(),
    };
  },

  mounted: async function() {
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();

    await this.load_profile_data();
  },

    methods: {

      load_profile_data: async function() {

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

        // this.periods_db.ref("19").on("value",
        //   snapshot => {
        //     console.log("Snapshot received!", snapshot.val());
        //   },
        //   errorObject => {
        //     console.log("Read failed: ", errorObject.code);
        //   }
        // );

      },

      handle_period_metadata: async function(doc) {
        this.periods_doc = doc; // await this.periods_db.doc("metadata").get();
        var data = this.periods_doc.data();

        await Period.setSeasons(data["Seasons"]);
        this.periods = Period.enumerateStr(data["CurrentPeriod"], data["FirstPeriod"]);

        this.period_metadata = {
          cur_period: data["CurrentPeriod"],
          reg_period: data["CurrentRegistrationPeriod"],
          seasons:    data["Seasons"],
          class_list: mapKeyVal(data["Classes"], (name, desc) => name),
        };
      },

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
          this.current_active_periods = this.create_active_periods(youth, this.period_data);
        }
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
<style>

.title {
margin-bottom: 1rem;
}

</style>
