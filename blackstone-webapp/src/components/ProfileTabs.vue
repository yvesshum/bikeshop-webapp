<template>
  <div class="profile_tabs">

    <div v-show="profile!=null" style="margin: auto;">
      <div style="font-size:3em;">{{youth_name}}</div>
      <div class="id_parens" style="margin-top:0.5em; font-size:0.9em;">
          ID: {{youth_id}}
          <span style="margin: 0 0.75em;">|</span>
          {{get_profile_field("Apron Color")}} Apron
          <span style="margin: 0 0.75em;">|</span>
          {{get_profile_field("Hours Earned")}} Hours Earned
          <span style="margin: 0 0.75em;">|</span>
          {{current_class}}
        </div>
    </div>

    <br />

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
          showOptionalFields :hideTitle="true"
          @save_changes="save_changes"
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
          style="max-width: 95%; margin: auto; padding-top: 20px;"
        />
      </b-tab>

      <b-tab title="Apron Skills">
        <ApronBar ref="apron_bar"
          :profile="profile"
          :allowEdits="allow_edits"
          style="max-width: 95%; margin:auto"
          @load_complete="s => apron_bar_content = s"
          @save_changes="save_changes"
        />
      </b-tab>

      <b-tab title="Work Log">
        <ProfileWorkLog
          :snapshot="profileSnapshot"
          :periods="periods"
          @load_complete="s => work_log_content = s"
        />
      </b-tab>

      <b-tab title="Order Log">
        <ProfileOrderLog
          :snapshot="profileSnapshot"
          :periods="periods"
          @load_complete="s => order_log_content = s"
        />
      </b-tab>

      <b-tab title="Hour Transfer Log">
        <ProfileTransferLog
          :snapshot="profileSnapshot"
          :periods="periods"
          @load_complete="s => trans_log_content = s"
        />
      </b-tab>
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
import ProfileWorkLog from "@/components/ProfileWorkLog.vue";
import ProfileOrderLog from "@/components/ProfileOrderLog.vue";
import ProfileTransferLog from "@/components/ProfileTransferLog.vue";
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
    ProfileWorkLog,
    ProfileOrderLog,
    ProfileTransferLog,
    PeriodsClassesDisplay,
  },

  data: function() {
    return {
      current_tab: 0,
      apron_bar_content: null,
      work_log_content:  null,
      order_log_content: null,
      trans_log_content: null,
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

    youth_name: function() {
      if (this.profile == null) return "";
      let first_name = this.profile.data()["First Name"];
      let last_name =  this.profile.data()["Last Name"];
      return `${first_name} ${last_name}`;
    },

    youth_id: function() {
      if (this.profile == null) return "";
      return this.profile.id;
    },

    current_class: function() {
      if (this.activePeriods == null || this.period_metadata == null) return "";
      return this.activePeriods[this.period_metadata.cur_period]
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
          break;

        // Work Log
        case 4:
          this.$nextTick(() => {
            if (this.work_log_content != null) this.work_log_content.redraw();
          });
          break;

        // Order Log
        case 5:
          this.$nextTick(() => {
            if (this.order_log_content != null) this.order_log_content.redraw();
          });
          break;

        // Transfer Log
        case 6:
          this.$nextTick(() => {
            if (this.trans_log_content != null) this.trans_log_content.redraw();
          });
          break;
      };
    },

  },

  methods: {

    redraw_bar: function() {
      this.apron_skills_content.reload();
    },

    load_header_doc: function(new_header) {},
    load_profile: function(doc) {},

    get_profile_field: function(field, default_value) {
      return (this.profile == null) ? default_value : this.profile.data()[field];
    },

    save_changes: function(changes) {
      this.$emit("save_changes", changes);
    },
  }
}
</script>

<style scoped>
  ::v-deep .nav-link {
    height: 100%;
  }
</style>