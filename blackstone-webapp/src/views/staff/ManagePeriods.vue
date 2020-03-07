<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>
    <br />

    <div class="col-container flex-direction">
      <div class="col-left">
        <h3>{{display_period}}{{display_period == cur_period ? " (Current)" : display_period == reg_period ? " (Registration)" : ""}}</h3>

        <ButtonArrayHeader
          :left ="button_header_l" :right="button_header_r" :current="display_period"
          :min="fst_period" :max="reg_period" :compareFunc="compare_periods"
          @clicked="switch_to"
        >
        </ButtonArrayHeader>
        <Table
          ref="current_table"
          :headingdata="headers"
          :table_data="display_youths"
          :args="args"
          @deselectedRow="deselected_row"
          @replaceData="replaceData"
          @rowClick="row_click"
        />

        <!-- <YouthIDSelector periods="all"
          :args="{multiple: true, hideSelected: true, closeOnSelect: false, openDirection: 'top'}"
          @selected="s => selected_bar = s"
        /> -->
      </div>

      <div class="col-right">
        <b-modal v-model="viewProfileModalVisible" hide-footer lazy>
      <div ref="body_fields" v-show="currentProfile != null">
        <ProfileFields
          :profile="currentProfile"
          :headerDoc="header_doc"
          :periodData="profile_period_data"
          hideWarnings
        />
        <br />
        <br />
      </div>
    </b-modal>
        <div v-if="selected_youths.length == 0">
          <h3>Youth Information</h3>
          Select a single youth to view/edit their classes individually, or select multiple youth with <span style="font-family: Courier, Monaco, monospace;">CTRL</span>-click to perform batch operations.
        </div>

        <!-- TODO: Load the youth's profile to get their active_periods -->
        <div v-else-if="selected_youths.length == 1">
          <PeriodsClassesDisplay
            :youth="selected_youth"
            :active_periods="get_youth_classes(selected_youth)"
            :seasons="season_list"
            :cur_period="cur_period"
            :reg_period="reg_period"
            :class_list="class_list"
            @change_period="change_period"
            detail_view
          >
            <span class="full_name">{{youth_name}}</span>&nbsp;
            <span class="id_parens">(ID: {{youth_id}})</span>
            <b-button variant="outline-danger" size="sm" style="padding: 0px 6px; float: right;" @click="deselect_youth(selected_youth)">
              &times;
            </b-button>
          </PeriodsClassesDisplay>
          <b-button
            @click="viewProfile"
            style="margin-bottom: 1rem"
            variant="info"
          >View Profile</b-button>
        </div>

        <div v-else>
          <h3>Edit Multiple Youth</h3>

          <div>
            <div style="display: inline-block;">
              <b-dropdown
                variant="primary" :split-variant="batch_season_variant" split
                id="dropdown-text" class="m-2"
                :text="batch_season_display"
                style="margin: auto;" right
              >
                <b-dropdown-item-button v-for="s in season_list" @click="batch_season = s">
                  {{s}}
                </b-dropdown-item-button>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button @click="batch_season = null">
                  Clear
                </b-dropdown-item-button>
              </b-dropdown>
            </div>
            <div style="display: inline-block;">
              <b-dropdown
                variant="primary" :split-variant="batch_year_variant" split
                id="dropdown-text" class="m-2"
                :text="batch_year_display"
                style="margin: auto;" right
              >
                <b-dropdown-item-button v-for="y in year_list" @click="batch_year = y">
                  {{y}}
                </b-dropdown-item-button>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button @click="batch_year = null">
                  Clear
                </b-dropdown-item-button>
              </b-dropdown>
            </div>
            <div style="display: inline-block; width: 2em;"></div>
            <div style="display: inline-block;">
              <b-dropdown
                variant="success"
                id="dropdown-text" class="m-2"
                text="Set Class"
                style="margin: auto;"
                :disabled="batch_period == null"
              >
                <b-dropdown-text style="width: 260px;">
                    <i>Set the class during (season) for all selected youth.</i>
                </b-dropdown-text>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button v-for="c in class_list" @click="change_periods_selected(c)">
                  {{c}}
                </b-dropdown-item-button>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button @click="change_periods_selected(null)">
                  Clear
                </b-dropdown-item-button>
              </b-dropdown>
            </div>
          </div>

          <table class="table table-bordered">
            <thead>
            <tr>
                <th scope="col">Name</th>
                <th scope="col">ID</th>
                <th scope="col">{{batch_period_display}}</th>
                <th scope="col"></th>
            </tr>
            </thead>
            <tbody>
              <tr v-for="youth in selected_youths" style="padding-top: 0px;">
                <td style="padding-top: 3px; padding-bottom: 3px;">
                  {{youth["First Name"]}} {{youth["Last Name"]}}
                </td>
                <td style="padding-top: 3px; padding-bottom: 3px;">
                  {{youth["ID"]}}
                </td>
                <td style="padding-top: 3px; padding-bottom: 3px;" :class="{changed: class_changed(youth, batch_season, batch_year)}">
                  {{get_youth_class_display(youth, batch_season, batch_year)}}
                </td>
                <td style="padding: 3px 3px;">
                  <b-button variant="outline-danger" size="sm" style="padding: 0px 6px;" @click="deselect_youth(youth)">
                    &times;
                  </b-button>
                </td>
              </tr>
            </tbody>
        </table>

        </div>
      </div>
    </div>

    <SaveBar
      showIfChanges
      :hasChanges="has_changes"
      @save="save_changes"
      @reset="reset_changes"
      @discard="discard_changes"
    >
      <template slot="bodyFooter">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th scope="col">Name & ID</th>
              <th scope="col">Period</th>
              <th scope="col">Old Class</th>
              <th scope="col">New Class</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="change in change_array" style="padding-top: 0px;">
              <td v-if="change.youth != undefined" :rowspan="youth_num_changes(change.youth)">
                {{change.youth["Full Name"]}} ({{change.youth["ID"]}})
              </td>
              <td>{{change.period}}</td>
              <td>{{change.old_class ? change.old_class : "- n/a -"}}</td>
              <td>{{change.new_class ? change.new_class : "- n/a -"}}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <template slot="failureModalBody">
        Something went wrong updating the database. The following changes could not be saved:
        <br />

        <h4 style="color: black;">Unsaved Youth Profiles</h4>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th scope="col">Name & ID</th>
              <th scope="col">Period</th>
              <th scope="col">Old Class</th>
              <th scope="col">New Class</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="change in error_array_youth" style="padding-top: 0px;">
              <td v-if="change.youth != undefined" :rowspan="youth_num_changes(change.youth)">
                {{change.youth["Full Name"]}} ({{change.youth["ID"]}})
              </td>
              <td>{{change.period}}</td>
              <td>{{change.old_class ? change.old_class : "- n/a -"}}</td>
              <td>{{change.new_class ? change.new_class : "- n/a -"}}</td>
            </tr>
          </tbody>
        </table>

        Please take note of these and try again.
      </template>
    </SaveBar>
  </div>
</template>


<script>
// @ is an alias to /src
import {db} from '../../firebase';
import {firebase} from '../../firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import TopBar from '@/components/TopBar';
import Table from '@/components/Table';
import PeriodsClassesDisplay from '@/components/PeriodsClassesDisplay';
import YouthIDSelector from '@/components/YouthIDSelector';
import ButtonArrayHeader from '@/components/ButtonArrayHeader';
import SaveBar from '@/components/SaveBar';
import ProfileFields from "@/components/ProfileFields.vue"
import ApronBar from "@/components/ApronBar.vue"
import {Status} from '@/scripts/Status.js';
import {filter} from "@/scripts/Search.js";
import {forKeyVal} from '@/scripts/ParseDB.js';
import {Period} from '@/scripts/Period.js';
import {Youth} from  '@/scripts/Youth.js';

export default {
  name: 'manage_periods',
  components: {
    TopBar,
    Table,
    PeriodsClassesDisplay,
    YouthIDSelector,
    ButtonArrayHeader,
    SaveBar,
    ProfileFields,
    ApronBar
  },

  data: function() {
    return {
      // The firebase addresses of the GlobalPeriods collection and the period metadata document
      periods_db:  db.collection("GlobalPeriods"),
      metadata_db: db.collection("GlobalPeriods").doc("metadata"),

      // The actual loaded documents
      metadata_doc: null,

      // Data loaded from the ActivePeriod document
      cur_period: null,
      reg_period: null,
      fst_period: null,
      classes: [],

      changes: {},

      // The column headers for the table
      headers: [
        { // The name of the youth
          title: "Name", field: "Full Name",
          headerFilter: true, headerFilterFunc: filter
        },
        { // The ID of the youth
          title: "ID", field: "ID", width: 90, headerFilter: true
        },
        { // The class the youth is registered in
          title: "Class", field: "Class", headerFilter: "select",
          formatter: this.class_formatter,
        },
      ],
      args: {
        selectable: true,
      },

      selected_cur: [],
      selected_bar: [],
      selected_youths: [],
      all_youth: null,
      viewProfileModalVisible: false,
      currentProfile:null,
      header_doc: null,
      profile_periods_doc: null,
      profile_period_data: null,
      profile_periods:[],
      // Misc
      season_list: null,
      year_list: [],

      period_status: null,

      batch_season: null,
      batch_year: null,

      display_period: null,

      button_header_l: [
        {name: 'First', arr: 'b', val: 'min'},
        {name: 'Previous', val: 'prev'},
      ],

      button_header_r: [
        {name: 'Next', val: 'next'},
        {name: 'Current', arr: 'd'},
        {name: 'Registration', arr: 'b', val: 'max'},
      ],

      // Array to store the results of updating the database
      // TODO: Does this need to exist at the data level? Could be local to the function
      update_results: [],

    };
  },

  mounted: async function() {

    await this.load_metadata();
    await this.load_periods();
    this.switch_to("Current");
    await this.getHeaders();
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();

    this.period_status = new Object();

    // TODO:
    //  - Collect all youth
    //  - Display past periods interface
    //  - Figure out which youth are never active
  },

  computed: {

    selected_youth: function() {
      if (this.selected_youths.length == 1) {
        return this.selected_youths[0];
      }
      else {
        return null;
      }
    },

    youth_name: function() {
      return (this.selected_youth != null) ? this.selected_youth["Full Name"] : "";
    },

    youth_id: function() {
      return (this.selected_youth != null) ? this.selected_youth["ID"] : "";
    },

    class_list: function() {
      var ret = [];
      forKeyVal(this.classes, (name, val) => {
        ret.push(name);
      });
      return ret;
    },

    batch_season_display: function() {
      return (this.batch_season != null) ? this.batch_season : "Choose a season";
    },

    batch_year_display: function() {
      return (this.batch_year != null) ? this.batch_year : "Choose a year";
    },

    batch_season_variant: function() {
      return (this.batch_season != null) ? "primary" : "outline-primary";
    },

    batch_year_variant: function() {
      return (this.batch_year != null) ? "primary" : "outline-primary";
    },

    batch_period: function() {
      return (this.batch_year != null && this.batch_season != null)
        ? `${this.batch_season} ${this.batch_year}`
        : null
    },

    batch_period_display: function() {
      return (this.batch_period != null) ? `Class in ${this.batch_period}` : "Choose a period";
    },

    has_changes: function() {
      return Object.keys(this.changes).length > 0;
    },

    change_array: function() {
      let result = [];
      Object.keys(this.changes).forEach(youth_id => {

        // Get a sorted list of changed periods for this youth
        let periods = Period.sort(Object.keys(this.changes[youth_id].periods));
        periods.forEach((period, n) => {
          result.push({
            youth: n == 0 ? this.changes[youth_id].youth : undefined,
            period,
            old_class: this.changes[youth_id].periods[period].old_class,
            new_class: this.changes[youth_id].periods[period].new_class
          });
        });
      });
      return result;
    },

    error_array_youth: function() {
      if (this.update_results == null || this.update_results.youth == null) return null;
      let result_array = [];

      this.update_results.youth.filter(x => x != true && x != null).forEach(result => {
        let periods = Period.sort(Object.keys(result.periods));
        periods.forEach((period, n) => {
          result_array.push({
            youth: n == 0 ? result.youth : undefined,
            period,
            old_class: result.periods[period].old_class,
            new_class: result.periods[period].new_class
          })
        })
      });

      return result_array;
    },

    display_youths: function() {
      if (this.display_period == undefined) return [];

      var display_p = Period.makePeriod(this.display_period);
      var period = this.get_period(display_p);

      if (period == null) {
        return [];
      } else {
        return period.map(y => {
          if (this.class_changed(y, display_p)) {
            let new_class = this.get_youth_class_edited(y, display_p);
            if (new_class == null) return null;
            return {...y, Class: new_class, "Full Name": Youth.getFullName(y)};
          }
          else {
            return {...y, "Full Name": Youth.getFullName(y)};
          }
        }).filter(p => p != null);
      }
    },
  },


  methods: {
    load_metadata: async function() {
      this.metadata_doc = await this.metadata_db.get();
      var data = this.metadata_doc.data();

      // Store current periods
      this.cur_period = data["CurrentPeriod"];
      this.reg_period = data["CurrentRegistrationPeriod"];
      this.fst_period = data["FirstPeriod"];

      // Store the list of classes
      this.classes = data["Classes"];

      // Use the list of classes to set the filter options for the class column
      var class_col = this.headers.pop();
      class_col = {...class_col, headerFilterParams: {values: ["", ...this.class_list]}};
      this.headers.push(class_col);

      // Store seasons
      this.season_list = data["Seasons"];
      Period.setSeasons(this.season_list);

      // Store years
      this.year_list = [];
      var min_year = Period.year(this.fst_period);
      var max_year = Period.year(this.reg_period);
      for (let i = parseInt(min_year); i <= parseInt(max_year); i++) {
          this.year_list.push(i.toString());
      }
    },

    load_periods: async function() {
      this.periods = {};

      // This has to be a for loop to ensure any parent function calling await load_periods() will be run after all async calls within this function are made
      for (let i = 0; i < this.year_list.length; i++) {
        let year = this.year_list[i];
        let snapshot = await this.periods_db.doc(year).get();
        this.periods[year] = snapshot.data();
      }
    },

    // Format: {'Fall 18': 'Gear Up 2', 'Winter 20': 'Gear Up 2', 'Spring 17': 'Earn a Bike', 'Summer 18': 'Gear Up 1'}
    get_youth_classes(youth) {
      var result = {};

      // Cycle through each year/season pair
      this.year_list.forEach(year => {
        this.season_list.forEach(season => {

          // Add class to object if it exists
          let youth_class = this.get_youth_class(youth, season, year);
          if (youth_class != null)
            result[season + " " + year] = youth_class;
        })
      });

      return result;
    },

    get_period(a, b) {

      // Handle season/year or period inputs
      let [season, year] = (b == undefined) ? [a.getSeason(), a.getYear()] : [a, b];

      if (this.periods == null || this.periods[year] == null) {
        return null;
      }
      return this.periods[year][season + " " + year];
    },

    get_youth_class(youth, a, b) {
      let edited = this.get_youth_class_edited(youth, a, b);
      return (edited !== undefined)
        ? edited
        : this.get_youth_class_original(youth, a, b);
    },

    get_youth_class_edited(youth, a, b) {
      // Handle season/year or period inputs
      let [season, year] = (b === undefined) ? [a.getSeason(), a.getYear()] : [a, b];

      return this.get_descendant(this.changes, [youth.ID, "periods", Period.concat(season, year), "new_class"]);
    },

    get_youth_class_original(youth, a, b) {
      var full_period = this.get_period(a, b);
      if (full_period == null) return null;

      let matches = Youth.findMatches(full_period, youth);

      if (matches.length == 0) {
        return null;
      }
      else if (matches.length == 1) {
        return matches[0].Class
      }
      else {
        // Error - multiple records found
        return matches[0].Class
      }
    },

    get_youth_class_display(youth, season, year) {
      if (season == null || year == null) return "";
      var val = this.get_youth_class(youth, season, year);
      return (val != null) ? val : "n/a";
    },

    class_changed: function(youth, a, b) {
      // Handle season/year or period inputs
      let period = (b == undefined) ? a : Period.concat(a, b);

      return this.get_descendant(this.changes, [youth.ID, "periods", period]) != undefined;
    },

    switch_to: function(change_code) {
      switch (change_code) {
        case "Current":
          this.display_period = this.cur_period;
          break;
        case "Registration":
          this.display_period = this.reg_period;
          break;
        case "First":
          this.display_period = this.fst_period;
          break;
        case "Previous":
          this.display_period = Period.genPrevStr(this.display_period);
          break;
        case "Next":
          this.display_period = Period.genNextStr(this.display_period);
          break;
      }
    },

    compare_periods: function(a, b) {
      return Period.compare(a, b);
    },

    row_selected: function(rows) {
      return (rows.length == 0) ? [] : rows.map(row => row.getData());
    },

    // Add a youth to the selection list if it is not already in it
    add_to_selected: function(youth) {
      if (!this.youth_is_selected(youth)) {
        this.selected_youths.push(youth)
      }
    },

    // Remove a youth from the selection list
    remove_from_selected: function(youth) {
      this.selected_youths = this.selected_youths.filter(y => !Youth.equiv(youth, y));
    },

    deselect_youth: function(youth) {
      this.remove_from_selected(youth);
      this.deselect_youth_row(youth);
    },

    // Deselect a youth in the table
    deselect_youth_row: function(youth) {
      let table = this.$refs.current_table.tabulator;
      let rows = table.getRows().filter(r => Youth.equiv(r.getData(), youth));
      rows.forEach(row => table.deselectRow(row));
    },

    // Event handler for tabulator deselectRow event
    // Removes the youth from the main list
    deselected_row: function(r) {
      this.remove_from_selected(r.getData());
    },

    // Event handler for tabulator replaceData event
    // Reselects all youth which are currently being edited
    replaceData: function(data) {

      // Get the table
      let table = this.$refs.current_table.tabulator;

      // Filter the table's rows down to the rows whose youth is in the selected list
      // and select each of those rows
      let sel_rows = table.getRows().filter(r => this.youth_is_selected(r.getData()));
      sel_rows.forEach(r => table.selectRow(r));
    },

    // Event handler for tabulator rowClick event
    // Have to use this instead of selected because it only fires on manual selection,
    // not on programmatic selection
    row_click: function({event, row, selected}) {

      // If regular click (not CTRL-click or shift-click), deselect everyone
      if (!(event.ctrlKey || event.shiftKey)) {
        this.selected_youths = [];
      }

      // Add everyone currently selected in the table to the list
      selected.forEach(r => this.add_to_selected(r.getData()));
    },


    youth_is_selected: function(youth) {
      return Youth.contains(this.selected_youths, youth);
    },

    change_period: function(change) {

      // If changing to the same class, do nothing
      if (change.old_class == change.new_class) return;

      // The new change will use the period as the key and store the old and new classes
      // Goal is to get an object like:
      // 12345: {
      //    youth: {First Name: ...}
      //    periods: {
      //      "Spring 19": {old_class: ..., new_class: ...}
      //      "Summer 19": {old_class: ..., new_class: ...}
      //    }
      // },
      // ...
      //
      let new_change = { old_class: change.old_class, new_class: change.new_class };

      // If changes doesn't exist yet, create it
      if (this.changes == null) this.changes = {};

      // If this youth doesn't have any changes yet, initialize an object for it
      if (this.changes[change.youth.ID] == null) {
        this.$set(this.changes, change.youth.ID, {youth: change.youth, periods: {}});
      }

      // Store the changes
      this.$set(this.changes[change.youth.ID].periods, change.period, new_change);
    },

    change_periods_selected: function(change) {
      var new_change_list = this.selected_youths.map(youth => {
        return {
          youth,
          period: this.batch_period,
          new_class: change,
          old_class: this.get_youth_class(youth, Period.makePeriod(this.batch_period)),
        };
      });

      new_change_list.forEach(this.change_period);
    },

    youth_num_changes: function(youth) {
      return Object.keys(this.changes[youth['ID']].periods).length;
    },

    save_changes: async function(accept_func) {

      // Construct the changes for the period object
      // Want an object where each key is a year, and each entry is object with fields for each season that needs to change
      // Each season field in turn is a list of youth
      let period_obj = {};
      Object.keys(this.changes).forEach(youth_id => {
        Object.keys(this.changes[youth_id].periods).forEach(period => {

          // Get the year - this will identify the doc in the database
          let year = Period.year(period);

          // Initialize any null parent values for the year and the period
          if (period_obj[year] == null) period_obj[year] = [];
          if (period_obj[year][period] == null) period_obj[year][period] = [];

          // Construct a new entry for the youth by taking all the required Youth values
          // and the new class from the list of changes
          let new_val = {};
          Youth.requiredVals().forEach(val => new_val[val] = this.changes[youth_id].youth[val]);
          new_val["Class"] = this.changes[youth_id].periods[period].new_class;

          // Add the new youth onto the appropriate period array in the appropriate year object
          period_obj[year][period].push(new_val);
        });
      });

      // Get lists of youth_ids and periods which need to be updated
      let youth_id_list = Object.keys(this.changes);
      let year_list = Object.keys(period_obj);

      // Initialize the update results
      this.update_results = {youth: [], years: []};
      for (var i = 0; i < youth_id_list.length; i++) {
        this.update_results.youth.push(null);
      }
      for (var i = 0; i < year_list.length; i++) {
        this.update_results.years.push(null);
      }

      // Update the database for each youth_id
      // TODO: Is there a way to specify a change to be made to an array without .get() ing it?
      for (let i = 0; i < youth_id_list.length; i++) {

        // Grab the data from the database
        let youth_id = youth_id_list[i];
        let youth_db = db.collection("GlobalYouthProfile").doc(youth_id);
        let youth_doc = await youth_db.get();
        let youth_data = youth_doc.data();

        // Initialize a new active_periods array which will be changed
        let new_active_periods = youth_data["ActivePeriods"];

        // Make the changes to the grabbed array
        Object.keys(this.changes[youth_id].periods).forEach(period => {
          new_active_periods[period] = this.changes[youth_id].periods[period].new_class;
        });

        // Send the changes back to the database
        youth_db.update({ActivePeriods: new_active_periods}).then((error) => {
          if (error) {
            this.$set(this.update_results.youth, i, this.changes[youth_id]);
          }
          else {
            this.$set(this.update_results.youth, i, true);
          }
          check_for_completion(this.update_results);
        });
      }

      for (let i = 0; i < year_list.length; i++) {

        // Grab the data from the database
        let year = year_list[i];
        let period_db = db.collection("GlobalPeriods").doc(year);
        let period_doc = await period_db.get();
        let period_data = period_doc.data();

        // Initialize object to store all db changes for the current year
        let periods_to_update = {};

        // Take the current database data for each period and add the new youth profiles, overwriting them when they exist already
        Object.keys(period_obj[year]).forEach(period => {
          periods_to_update[period] = Youth.concat_overwrite(period_data[period], period_obj[year][period]);
        });

        period_db.update(periods_to_update).then(error => {
          if (error) {
            this.$set(this.update_results.years, i, period_obj[year]);
          }
          else {
            this.$set(this.update_results.years, i, true);
          }
          check_for_completion(this.update_results);
        });
      }


      // This runs at the end of each callback to the database
      // Waits until all the changes have returned, then does something with the results
      // If everything succeeded, results will be an array of "true"
      // Any update that failed will be the object that we were trying to update
      function check_for_completion(results_object) {

        let results = results_object.youth.concat(results_object.years);

        // If there are no results yet, quit
        if (results.length == 0) return;

        // If there are any null values, quit
        for (let i in results) {
          if (results[i] == null) return;
        }

        // Filter out failed updates - object value rather than "true"
        let failures = results.filter(x => x != true);

        // If any of the updates failed, show that to the user
        if (failures.length > 0) {
          accept_func(false);
        }

        // If not, give the success modal
        else {
          accept_func(true);
        }
      }
    },

    reset_changes: function(accept_func) {
      this.changes = new Object();
      accept_func();
    },

    discard_changes: function(accept_func) {
      this.changes = new Object();
      accept_func();
    },






    get_child: function(parent, child) {
      return (parent == undefined || child == undefined) ? undefined : parent[child];
    },

    get_descendant: function(parent, child_arr) {
      let p = parent;
      child_arr.forEach(c => p = this.get_child(p, c));
      return p;
    },

    class_formatter: function(cell, formatterParams, onRendered) {
      let data = cell.getRow().getData();
      if (this.class_changed(data, Period.makePeriod(this.display_period))) {
        return `<b>${cell.getValue()}</b>`;
      }
      return cell.getValue();
    },

 async viewProfile() {
      let ID = this.selected_youth.ID;
      let snapshot = db.collection("GlobalYouthProfile").doc(ID);
      this.currentProfile = await snapshot.get();
      this.viewProfileModalVisible = true;

      // window.alert("This is an upcoming feature :) look forward to it!")
    },
      async getHeaders() {
      let headers = await db
        .collection("GlobalFieldsCollection")
        .doc("Checked In")
        .get();
      headers = headers.data().fields;
      let fields = [];
      for (let i = 0; i < headers.length; i++) {
        fields.push({ key: Object.keys(headers[i])[0], sortable: true });
      }
      this.fields = fields;
    },
   load_profile_data: async function() {
        this.profile_periods_doc = await this.periods_db.doc("metadata").get();
        var data = this.periods_doc.data();

        await Period.setSeasons(data["Seasons"]);
        this.profile_periods = Period.enumerateStr(data["CurrentPeriod"], data["FirstPeriod"]);

        this.profile_period_data = {
          cur_period: data["CurrentPeriod"],
          reg_period: data["CurrentRegistrationPeriod"],
          seasons:    data["Seasons"],
          class_list: mapKeyVal(data["Classes"], (name, desc) => name),
        };
      },
  }

}

</script>

<style scoped>
  .full_name {
    font-size: 2em;
    margin-bottom: 0;
  }

  .id_parens {
    color: gray;
    font-size: 0.75em;
  }

  .col-container:after {
    display:inline-flex;
  flex-wrap:wrap;
  }

  .flex-direction{
  flex-direction:row;
}

  .col-left {
    float: left;
    width: 45%;
    padding-left: 3%;
    padding-right: 1.5%;
  }

  .col-right {
    float: left;
    width: 55%;
    padding-left: 1.5%;
    padding-right: 3%;
  }

  @media screen and (max-width: 800px) {
  .flex-direction{
  flex-direction:column;
  }
.col-left{
  width:100%;
  padding: 0 3%;
  }
  .col-right{
    width:100%;
    padding: 1rem 3%;
  }

}
</style>
