<template>
  <div class="profile_tabs">

    <div v-show="profile!=null" style="margin: auto;">
      <div style="font-size:3em;">{{youth_name}}</div>
      <div class="id_parens" style="margin-top:0.5em; font-size:0.9em;">
          ID: {{youth_id}}
          <span style="margin: 0 0.75em;">|</span>
          {{get_profile_field("Hours Earned")}} Hours Earned
          <span style="margin: 0 0.75em;">|</span>
          {{current_class}}
          {{(class_is_apron(current_class)) ? "(Class)" : ""}}
          <span style="margin: 0 0.75em;">|</span>
          {{get_profile_field("Apron Color")}} Apron
        </div>
    </div>

    <br />

    <b-alert v-model="apron_bar_has_changes" variant="warning">
      This youth has unsaved changes.
    </b-alert>

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

        <b-card no-body style="width: 95%; margin: auto;">
          <b-card-header>
            <h3>Current Balance</h3>
          </b-card-header>

          <b-card-body>
            <HoursStatsBar :profile="profile" style="margin:auto;" />
          </b-card-body>
        </b-card>

        <br />

        <b-card no-body style="width: 95%; margin: auto;">
          <b-card-header>
            <h3>Hour Logs</h3>
          </b-card-header>
          <b-tabs card justified v-model="current_log_tab">
            <b-tab title="Work Log">
              <ProfileWorkLog
                :snapshot="profileSnapshot"
                :periods="periods"
                :categories="hourLoggingCategories"
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
        </b-card>
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
          @has_changes="c => apron_bar_has_changes = c"
        />
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>

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

    // Hour logging categories
    hourLoggingCategories: Array,
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
      current_log_tab: 0,

      apron_bar_content: null,
      work_log_content:  null,
      order_log_content: null,
      trans_log_content: null,

      apron_bar_has_changes: false,
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

  watch: {

    current_tab: function(open_tab) {
      switch (open_tab) {

        // Hour Display
        case 1:
          this.$nextTick(this.redraw_log_table);
          break;

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
      }
    },

    current_log_tab: function(open_tab) { //eslint-disable-line no-unused-vars
      this.$nextTick(this.redraw_log_table);
    }

  },

  methods: {

    redraw_bar: function() {
      this.apron_skills_content.reload();
    },

    redraw_log_table: function() {
      switch (this.current_log_tab) {
        case 0:
          if (this.work_log_content != null) this.work_log_content.redraw();
          break;

        case 1:
          if (this.order_log_content != null) this.order_log_content.redraw();
          break;

        case 2:
          if (this.trans_log_content != null) this.trans_log_content.redraw();
          break;
      }
    },

    // Return true if the class name is formatted like "___ Apron", and false otherwise
    // Used to display a disambiguating "(Class)" string if so
    class_is_apron(class_name) {
      return /.*(Apron)$/.test(class_name);
    },

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