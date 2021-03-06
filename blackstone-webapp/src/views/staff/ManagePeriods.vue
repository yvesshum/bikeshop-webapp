<template>
 <div class="content">
   <b-row style="padding:0; margin:0">
    <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>
    <PageHeader pageCategory="Staff Headers" pageName="Manage Youth Activity Period"></PageHeader>
    <br />

    <div class="col-container flex-direction">
      <div class="col-left">
        <ButtonArrayHeader
          :left="button_header_l" :right="button_header_r" :current="display_period"
          :min="fst_period" :max="reg_period" :compareFunc="compare_periods"
          :fullList="full_period_list"
          @clicked="switch_to"
          v-show="display_period != null"
        >
          <h5 style="display:inline;">{{display_period}}{{display_period == cur_period ? " (Current)" : display_period == reg_period ? " (Registration)" : ""}}</h5>
        </ButtonArrayHeader>
        <Table
          ref="current_table"
          :headingdata="headers"
          :table_data="display_youths"
          :args="args"
          @deselectedRow="deselected_row"
          @replaceData="reselect_rows"
          @rowClick="row_click"
        />

        <YouthIDSelector periods="all"
          :args="{hideSelected: true, closeOnSelect: false, openDirection: 'top'}"
          :remove="selected_youths"
          @selected="handle_selector"
        />
      </div>

      <div class="col-right">
        <div v-if="selected_youths.length == 0">
          <h3>Youth Information</h3>
          <br />
          <p style="font-style: italic;">
            Select a single youth from the table to view/edit their classes individually, or hold <span class="keyboard_button_text">Ctrl</span> or <span class="keyboard_button_text">Shift</span> when clicking to select multiple youth and perform batch operations.
          </p>
          <p style="font-style: italic;">
            In addition, youth from all periods can be found in the selector below the table.
          </p>
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
                <b-dropdown-item-button v-for="s in season_list" @click="batch_season = s" :key="s">
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
                <b-dropdown-item-button v-for="y in year_list" @click="batch_year = y" :key="y">
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
                <b-dropdown-item-button v-for="c in class_list" @click="change_periods_selected(c)" :key="c">
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
              <tr v-for="youth in selected_youths" style="padding-top: 0px;" :key="youth.id">
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

        <div style="padding: 1rem 0px; margin: auto;">
        <ProfilePopup :ID="selected_youth.ID"
          v-if="selected_youths.length == 1"
          style="display:inline-block; margin: 0px 5px; padding: 0px 25px;"
        />
        <ModalDRS
          showIfChanges :hideReset="true"
          :hasChanges="has_changes"
          @save="save_changes"
          @discard="discard_changes"
          style="display:inline-block;"
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
                <tr v-for="change in change_array" style="padding-top: 0px;" :key="change">
                  <td v-if="change.youth != undefined" :rowspan="youth_num_changes(change.youth)">
                    {{change.youth["Full Name"]}} ({{change.youth["ID"]}})
                  </td>
                  <td style="position:relative;">
                    {{change.period}}
                    <b-badge v-if="!change.old_class"
                      pill variant="warning"
                      style="position:absolute; right:.5em; bottom:1.25em;"
                      v-b-tooltip.hover.html="warning_msg"
                    >!</b-badge>
                  </td>
                  <td>{{change.old_class ? change.old_class : "- n/a -"}}</td>
                  <td>{{change.new_class ? change.new_class : "- n/a -"}}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template slot="failureModalBody">
            <p>
              Something went wrong updating the database. The following changes could not be saved:
            </p>

            <h4 style="color: black;">Unsaved Changes</h4>
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th scope="col">Name & ID</th>
                  <th scope="col">Period</th>
                  <th scope="col">Intended Class</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="change in error_array" style="padding-top: 0px;" :key="change">
                  <td>{{change.name}} ({{change.id}})</td>
                  <td>{{change.period}}</td>
                  <td>{{change.class}}</td>
                </tr>
              </tbody>
            </table>

            <p>Please take note of these and try again.</p>

            <div v-show="show_advanced_errors">
              <br />
              <p>Error message(s):</p>
              <div style="background: #2e2e38">
                  <p v-for="i in transaction_errors" :key="i">
                    <code>{{i.err}}</code>
                  </p>
              </div>
            </div>
          </template>

          <template slot="failureModalFooter">
            <ToggleButton v-model="show_advanced_errors"
                onText="Hide Error Messages"
                offText="Show Error Messages"
                onVariant="outline-secondary"
                offVariant="outline-secondary"
              />
          </template>
        </ModalDRS>
        </div>

      </div>
    </div>
    </div>
   </b-row>
   <Footer/>
  </div>
</template>


<script>
// @ is an alias to /src

// Firebase
import {db} from '../../firebase';

// Components
import TopBar from '@/components/TopBar';
import Table from '@/components/Table';
import PeriodsClassesDisplay from '@/components/PeriodsClassesDisplay';
import YouthIDSelector from '@/components/YouthIDSelector';
import ButtonArrayHeader from '@/components/ButtonArrayHeader';
import ModalDRS from '@/components/ModalDRS';
import ProfilePopup from "@/components/ProfilePopup";
import ToggleButton from "@/components/ToggleButton";

// Scripts
import PageHeader from "../../components/PageHeader.vue"
import {filter} from "@/scripts/Search.js";
import {forKeyVal} from '@/scripts/ParseDB.js';
import {AwaitTransactions} from '@/scripts/ParseDB.js';
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
    ModalDRS,
    ProfilePopup,
    ToggleButton,
    PageHeader
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

      // List of local changes to be saved to the database
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

      // The youths currently being viewed/edited
      selected_youths: [],

      // Season and year information
      season_list: null,
      year_list: [],

      // Season and year to view/edit when operating on multiple youth
      batch_season: null,
      batch_year: null,

      // Period to display in the table
      display_period: null,

      // Lay out the buttons in the table header
      button_header_l: [
        {name: 'First', arr: 'b', val: 'min'},
        {name: 'Previous', val: 'prev'},
      ],
      button_header_r: [
        {name: 'Next', val: 'next'},
        {name: 'Most Recent', arr: 'b', val: 'max'},
      ],

      // Store and display errors from an update
      transaction_errors: [],
      show_advanced_errors: false,

      // Tooltip text for warning message if adding a class to registration period
      warning_msg: "This change would manually set this youth's class in the current registration period, bypassing the parent registration process. Please be sure this is intended.",
    };
  },

  mounted: async function() {

    await this.load_metadata();
    await this.load_periods();
    this.switch_to("Current");

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
      forKeyVal(this.classes, (name, val) => { // eslint-disable-line no-unused-vars
        ret.push(name);
      });
      return ret;
    },

    // Get the full list of periods, for the dropdown selector
    full_period_list: function() {

      // Catch undefined values
      if (this.cur_period == undefined || this.fst_period == undefined) return [];

      // Add the registration period and the current period, unless they're the same, in which case just add them once
      let temp = (this.reg_period == this.cur_period)
        ? [                  this.cur_period, undefined ]
        : [ this.reg_period, this.cur_period, undefined ];

      // Add all the periods going back to the first period
      return temp.concat(
        Period.enumerateStr(Period.genPrevStr(this.cur_period), this.fst_period)
      );
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

    error_array: function() {

      if (this.transaction_errors == null) return [];

      let result_array = [];

      this.transaction_errors.forEach(err => {
        Object.keys(err.changes).forEach(change => {
          err.changes[change].forEach(item => {
            result_array.push({
              name: `${item["First Name"]} ${item["Last Name"]}`,
              id: item["ID"],
              class: item["Class"],
              period: change,
            });
          });
        });
      });

      // Sort by youth, then by period
      result_array.sort((a,b) => {
        if (a.id == b.id) {
          return Period.compare(a.period, b.period);
        }
        else {
          return a.id.localeCompare(b.id);
        }
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
        this.$set(this.periods, year, snapshot.data());
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
        case "Most Recent":
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
        default:
          this.display_period = change_code;
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
    reselect_rows: function(data) { // eslint-disable-line no-unused-vars

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
    row_click: function({event, row, selected}) { // eslint-disable-line no-unused-vars

      // If regular click (not CTRL-click or shift-click), deselect everyone
      if (!(event.ctrlKey || event.shiftKey)) {
        this.selected_youths = [];
      }

      // Add everyone currently selected in the table to the list
      selected.forEach(r => this.add_to_selected(r.getData()));
    },

    // Event handler for YouthIDSelector selection
    // Adds the selected youth to the list
    handle_selector: function(selection) {

      // Ignore null selection
      if (selection == null) return;

      // Add Full Name as a field
      selection["Full Name"] = Youth.getFullName(selection);

      // Add youth from YouthIDSelector to selection and update table to match
      this.add_to_selected(selection);
      this.reselect_rows();
    },


    youth_is_selected: function(youth) {
      return Youth.contains(this.selected_youths, youth);
    },


    // The new change will use the period as the key and store the old and new classes
    // Goal is to get an object like:
    //   12345: {
    //      youth: {First Name: ...}
    //      periods: {
    //        "Spring 19": {old_class: ..., new_class: ...}
    //        "Summer 19": {old_class: ..., new_class: ...}
    //      }
    //   },
    //   ...
    //
    // Takes a change object with the following fields:
    //   old_class - The current class listed for the youth
    //   new_class - The class the youth is being changed to
    //   youth     - A Youth object representing the youth being changed
    //   period    - A string for the period being changed
    //
    change_period: function(change) {

      // If changing to the same class, do nothing
      if (change.old_class == change.new_class) return;

      // If changes doesn't exist yet, create it
      if (this.changes == null) this.changes = {};

      // If this youth doesn't have any changes yet, initialize an object for it
      if (this.changes[change.youth.ID] == null) {
        this.$set(this.changes, change.youth.ID, {youth: change.youth, periods: {}});
      }

      // Get the change that's currently pending, if it exists
      let previous_change = this.changes[change.youth.ID]["periods"][change.period];

      // If this period does not have any pending changes yet, directly set the change to
      // the old and new classes passed in
      if (previous_change == undefined) {
        let new_change = {
          old_class: change.old_class,
          new_class: change.new_class
        };
        this.$set(this.changes[change.youth.ID].periods, change.period, new_change);
      }
      else {

        // If trying to change the user back to their original class, delete this period from
        // the changes list
        if (previous_change.old_class == change.new_class) {
          this.$delete(this.changes[change.youth.ID].periods, change.period);

          // If that was the youth's only change, remove their ID from the list of pending
          // changes altogether
          if (Object.keys(this.changes[change.youth.ID].periods).length == 0) {
            this.$delete(this.changes, change.youth.ID);
          }
        }

        // If trying to change the user to a different new class, overwrite the new_class
        // field but not the old_class field
        else {
          let new_change = {
            old_class: previous_change.old_class,
            new_class: change.new_class
          };
          this.$set(this.changes[change.youth.ID].periods, change.period, new_change);
        }
      }
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

      // --- Construct the changes for the period object -----

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
      // let youth_id_list = Object.keys(this.changes);
      // let year_list = Object.keys(period_obj);


      // --- Update the GlobalPeriods list -----

      // Add all transactions to this object, which will then run them all at once
      // and wait for the results to come back before moving on
      var year_transactions = new AwaitTransactions(db);

      // Loop through each year that needs to be updated
      Object.keys(period_obj).forEach(year => {
        let current_doc = this.periods_db.doc(year);

        // Create a transaction object to update the document for that year
        year_transactions.createTransaction(year, t => {

          // Grab the relevant document from the database
          return t.get(current_doc).then(doc => {

            // Init object to store new state of the database
            let update_obj = {};
            let year_data = period_obj[year]

            // Loop through each season that needs an update
            Object.keys(year_data).forEach(season => {

              // Split up the youth into which ones need to be changed and which ones need
              // to be removed
              let youth_to_change = [], youth_to_remove = [];

              year_data[season].forEach(youth =>
                (youth["Class"] == null ? youth_to_remove : youth_to_change).push(youth)
              );

              // Grab the data from the database
              // Using let binding so this is a new object for each loop
              let data = doc.data()[season];

              // If an array for this period doesn't already exist, create it now
              if (data == null) data = [];

              // Update the database's data with the new entries for each youth,
              // and save the updated entries to the update object
              update_obj[season] = Youth.update_list(data, youth_to_change, youth_to_remove);
            });

            // Apply the updates
            t.update(current_doc, update_obj);
          });
        });
      });


      // Create a function to handle the transactions when all are completed
      // This runs at the end of each callback to the database
      // Waits until all the changes have returned, then does something with the results
      // If everything succeeded, results will be an array of "true"
      // Any update that failed will be the object that we were trying to update
      year_transactions.setReturnFunc(async errs => {
        if (errs.length > 0) {

          // Add the intended changes to each error object
          errs.forEach((err, n) => { // eslint-disable-line no-unused-vars
            err.changes = period_obj[err.name];
          });

          // Save the error object for parsing, and display the failure modal
          this.transaction_errors = errs;
          accept_func(false);
          this.show_advanced_errors = false;
        }
        else {
          accept_func(true);
          this.show_advanced_errors = false;

          // Reload the period data from Firebase
          // This is easier than trying to update this.periods to match all the changes
          await this.load_periods();

          // This has to come after load_periods, to force the page to recompute its
          // displayed values
          this.changes = new Object();
        }
      });


      // Run the accumulated transactions and wait for all to return
      year_transactions.runTransactions();
    },

    discard_changes: function(accept_func) {
      this.changes = new Object();
      accept_func();
      this.show_advanced_errors = false;
    },






    get_child: function(parent, child) {
      return (parent == undefined || child == undefined) ? undefined : parent[child];
    },

    get_descendant: function(parent, child_arr) {
      let p = parent;
      child_arr.forEach(c => p = this.get_child(p, c));
      return p;
    },

    class_formatter: function(cell, formatterParams, onRendered) { // eslint-disable-line no-unused-vars
      let data = cell.getRow().getData();
      if (this.class_changed(data, Period.makePeriod(this.display_period))) {
        return `<b>${cell.getValue()}</b>`;
      }
      return cell.getValue();
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

  .keyboard_button_text {
    font-family: Courier, Monaco, monospace;
    padding: 0px .25rem;
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

  .changed {
    font-weight: bold;
  }
</style>
