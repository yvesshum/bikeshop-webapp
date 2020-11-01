<template>
  <div class="profile_lookup_staff">
    <div class="content">
      <TopBar/>

      <h1 class="title">Profile Lookup and Editing</h1>
      <PageHeader
        pageCategory="Staff Headers"
        pageName="Profile Lookup and Editing"
      ></PageHeader>

      <YouthIDSelector
        @selected="load_youth"
        :args="{openDirection: 'bottom'}"
        usePeriodSwitch
      />

      <br />
      <hr />

      <ProfileTabs v-show="currentProfile != null"
        :profile="currentProfile"
        :profileSnapshot="profile_ref"
        :headerDoc="header_doc"
        :activePeriods="current_active_periods"
        :seasons="seasons"
        :periods="periods"
        :period_metadata="period_metadata"
        :hourLoggingCategories="hour_logging_categories"
        @save_changes="save_changes"
        edit
      />

      <div v-show="currentProfile == null">
        <br />
        <p>Search the bar above to view a youth's profile information.</p>
      </div>

      <RefTracker :reference="profile_ref" @snapshot="handle_profile_snapshot" @load_complete="handle_ref_tracker" />

    </div>
    <Footer />
  </div>
</template>

<script>
// @ is an alias to /src
import { db } from '../../firebase';

import TopBar from "@/components/TopBar";
import YouthIDSelector from "@/components/YouthIDSelector.vue";
import ProfileTabs from "@/components/ProfileTabs.vue";
import RefTracker from "@/components/RefTracker.vue";

import PageHeader from "@/components/PageHeader.vue";
import { Period } from "@/scripts/Period.js";
import { mapKeyVal } from "@/scripts/ParseDB.js";
import { mapObj } from "@/scripts/ParseDB.js";
import { Youth } from "@/scripts/Youth.js";

let HeaderRef = db.collection("GlobalFieldsCollection").doc("Youth Profile");
let HourLoggingCategoriesRef = db.collection("GlobalVariables").doc("Hour Logging Categories");

export default {
  name: "profile_lookup_youth",
  components: {
    TopBar,
    YouthIDSelector,
    ProfileTabs,
    RefTracker,
    PageHeader,
  },

  data: function() {
    return {
      currentProfile: null,
      profile_ref: null,
      header_doc: null,

      ref_tracker: null,

      periods_db: db.collection("GlobalPeriods"),
      periods_doc: null,
      period_metadata: null,
      periods: [],

      period_data: new Object(),

      current_active_periods: new Object(),

      hour_logging_categories: null,
    };
  },

  mounted: async function() {
    this.header_doc = await HeaderRef.get();

    // // Add a listener to the header document to update expected fields whenever they change
    // HeaderRef.onSnapshot(doc => {
    //   this.header_doc = doc;
    // });

    await this.load_profile_data();
  },

  computed: {
    seasons: function() {
      return this.period_metadata ? this.period_metadata.seasons : [];
    },
  },

  methods: {

      load_profile_data: async function() {

        // Load the Periods collection and go through each document in it
        var snapshot = await this.periods_db.get();
        snapshot.docs.forEach((doc) => {
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

        var hour_categories_snapshot = await HourLoggingCategoriesRef.get();
        this.hour_logging_categories = hour_categories_snapshot.data().Categories;
      },

      handle_period_metadata: async function(doc) {
        this.periods_doc = doc; // await this.periods_db.doc("metadata").get();
        var data = this.periods_doc.data();

        await Period.setSeasons(data["Seasons"]);
        this.periods = Period.enumerateStr(
          data["CurrentPeriod"],
          data["FirstPeriod"]
        );

        this.period_metadata = {
          cur_period: data["CurrentPeriod"],
          reg_period: data["CurrentRegistrationPeriod"],
          seasons:    data["Seasons"],
          class_list: mapKeyVal(data["Classes"], (name, desc) => name), // eslint-disable-line no-unused-vars
        };
      },

      load_youth: async function(youth) {

        // Clear the reference tracker, so that switching between youth doesn't trigger it
        if (this.ref_tracker != undefined) this.ref_tracker.reset();

        // No id returned - clear the page
        if (youth == null) {
          this.profile_ref = null;
          this.currentProfile = null;
        }

        // Id returned - load profile for that youth
        else {
          this.profile_ref = db
            .collection("GlobalYouthProfile")
            .doc(youth.ID);
          this.current_active_periods = this.create_active_periods(
            youth,
            this.period_data
          );
        }
      },

      handle_profile_snapshot: function({snapshot, update}) {
        this.currentProfile = snapshot;
      },

      handle_ref_tracker: function(ref_tracker) {
        this.ref_tracker = ref_tracker;
      },

      create_active_periods: function(youth, period_data) {

        // Collect all the seasons from the nested year -> season data structure
        var obj = Object.entries(period_data).reduce((acc, [_, seasons]) => { // eslint-disable-line no-unused-vars
          return { ...acc, ...seasons };
        }, {});

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
            return { key: period, value: matches[0]["Class"] };
          }

          // If found more than once, flag it and use the first instance in the list
          else {
            // console.warn(
            //   "Multiple instances of youth " + youth + " in period " + period
            // );
            return { key: period, value: matches[0]["Class"] };
          }
        });

        // Return the final object
        return obj;
      },

      save_changes: function(changes) {
        this.ref_tracker.save_changes(changes);
      },
    }
}
</script>

<style>
.title {
  margin-bottom: 1rem;
}
</style>
