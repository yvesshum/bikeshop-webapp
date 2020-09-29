<template>
  <div class="profile_tabs">

    <b-tabs ref="body_fields"
      content-class="mt-3" justified
      active-nav-item-class="font-weight-bold"
      v-model="current_tab"
    >

      <b-tab title="Personal Info">
        <ProfileFields
          :profile="profile"
          :headerDoc="headerDoc"
          :edit="allow_edits" :disableWarnings="!allow_edits"
          showOptionalFields
        />
      </b-tab>

      <b-tab title="Hours">
        <HoursStatsBar :profile="profile" style="margin:auto;" />
      </b-tab>

      <b-tab title="Classes">
        <PeriodsClassesDisplay
          :active_periods="activePeriods"
          :seasons="seasons"
          v-bind="period_metadata"
          disable_selection
          style="max-width: 95%; margin:auto"
        />
      </b-tab>

      <b-tab title="Apron Skills">
        <ApronBar ref="apron_bar"
          :profile="profile"
          :allowEdits="allow_edits"
          style="max-width: 95%; margin:auto"
          @load_complete="s => apron_bar_content = s"
        />
      </b-tab>

      <b-tab title="Hour Logs">
        <ProfileItemLogs
          :snapshot="profileSnapshot"
          :periods="periods"
          :visible="profile != null"
          @load_complete="s => item_logs_content = s"
        ></ProfileItemLogs>
      </b-tab>

      <!-- <b-tab title="Order Log">
        Order log goes here
      </b-tab>

      <b-tab title="Hour Transfer Log">
        Transfer log goes here
      </b-tab> -->
    </b-tabs>
  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

import ProfileFields from "@/components/ProfileFields.vue"
import HoursStatsBar from "@/components/HoursStatsBar.vue"
import ApronBar from "@/components/ApronBar.vue"
import ProfileItemLogs from "@/components/ProfileItemLogs.vue";
import PeriodsClassesDisplay from "@/components/PeriodsClassesDisplay";

export default {
  name: 'profile_tabs',
  props: {

    // The profile currently being displayed
    profile: Object,
    profileSnapshot: Object,

    // Headers
    headerDoc: {
      type: Object
    },

    // Whether to allow edits to the profile fields
    edit: {
      type: Boolean,
      default: false,
    },

    // Period and class data
    periods: Array,
    seasons: Array,
    period_metadata: Object,
    activePeriods: Object,
  },

  components: {
    ProfileFields,
    HoursStatsBar,
    ApronBar,
    ProfileItemLogs,
    PeriodsClassesDisplay,
  },

  data: function() {
    return {
      current_tab: 0,
      apron_bar_content: null,
      item_logs_content: null,
    };
  },

  computed: {
    // Allow "edits" to be passed in as just a tag, or with a bound value
    allow_edits: function() {
      if (typeof this.edit == "string") {
        return true;
      } else {
        return !!this.edit;
      }
    },
  },

  mounted: function() {

    // Load the headers from the prop if it's set
    if (this.headerDoc != undefined) {
      this.load_header_doc(this.headerDoc);
    };

    // Load the profile from the prop if it's set
    if (this.profile != undefined) {
      this.load_profile(this.profile);
    };
  },

  watch: {

    headerDoc: function(new_header) {
      this.load_header_doc(new_header);
    },

    profile: function(doc) {
      this.load_profile(doc);
    },

    current_tab: function(open_tab) {
      switch (open_tab) {

        // Apron Bar
        case 3:
          this.$nextTick(() => {
            this.apron_bar_content.redraw();
          });

        // Item Logs
        case 4:
          this.$nextTick(() => {
            if (this.item_logs_content != null) this.item_logs_content.redraw();
          });
      };
    },

  },

  methods: {

    toggle_bar: function() {
      this.test_toggle_bar = !this.test_toggle_bar;
    },

    redraw_bar: function() {
      this.apron_skills_content.reload();
      // this.apron_skills_content.reload();
    },

    load_header_doc: function(new_header) {},
    load_profile: function(doc) {},
  }
}
</script>

<style></style>