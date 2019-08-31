<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>
    <br />

    <div v-for="item in binary_tables">
      <h3>{{item.Name}} ({{item.Period}})</h3>
      <BinaryTable
        :displayTableHeaders="display_table_headers"
        :editTableHeaders="edit_table_headers"
        :tableData="item.Data"
        :displayOptions="{selectableRangeMode: null}"

        :placeholders="{
          left: 'No youth are inactive during ' + item.Period,
          right: 'No youth are active during '  + item.Period
        }"
        onText="Update Table"
        :offText="'Edit ' + item.Name"

        @AcceptEdits="item.AcceptEdits"
        @selectedRow="row => select_youth(item.Table, row)"
        @deselectedRow="row => deselect_youth(item.Table)"
        @Table="t => item.Table = t"
      ></BinaryTable>

      <br /><br />
    </div>

    <h3>Past Quarters</h3>
    <!-- <Table :headingdata="['test', 'test2']" :table_data="[{'test': 'hi', 'test2': 'bye', 
      'cat':'a'}, {'test': 'hi', 'test2': 'bye', 'cat':'b'}]" :args="{groupBy:'cat'}" /> -->
    <div id="past-quarters-table"></div>

    <br />
    <br />

    <h3>Youth with No Active Period</h3>
    <Table
      :headingdata="edit_table_headers"
      :table_data="inactive_youth_data"
      :args="{selectableRangeMode: null}"
      placeholder="No youth found without an active period."
      @selectedRow="row => select_youth('Inactive', row)"
      @deselectedRow="row => deselect_youth('Inactive')"
      @Table="t => inactive_table = t"
    ></Table>

    <button v-show="selected_youth != null" v-on:click="edit_youth_periods">{{edit_button_message}}</button>
    
    <br />
    <button v-on:click="save_changes">Save Changes</button>

    <button v-on:click="manually_collect_youths">Collect All Youth!</button>

    <br /><br />

    <b-modal v-model="checkbox_modal_visible" lazy>
      <template slot="modal-title">
          Edit Active Periods for {{checkbox_modal_name}}
      </template>
      <h3>Please select the periods that {{checkbox_modal_name}} should be active in:</h3>
      <div class="d-block" style="width:fit-content;margin:auto;">
        <div v-for="(data, n) in checkbox_modal_form">
          <input type="checkbox" v-on:change="modal_form_check(n, data)" v-bind:checked="data.checked"> {{data.period}} {{data.msg}}
        </div>
      </div>
      <template slot="modal-footer" slot-scope="{cancel}">
        <b-button class="mt-3" block @click="accept_edit_modal" variant="primary">Confirm</b-button>
        <b-button class="mt-3" block @click="cancel()" variant="primary">Cancel</b-button>
      </template>
    </b-modal>



    <b-modal v-model="confirm_modal_visible" hide-footer lazy>
      <template slot="modal-title">
          Attention! Please review the following.
      </template>
      <div class="d-block text-center">
          <h3>{{modal_title}}</h3>
          <p>{{modal_body}}</p>
      </div>
      <b-button class="mt-3" block @click="accept_modal" variant="primary">Confirm</b-button>
      <b-button class="mt-3" block @click="close_modal" variant="primary">Cancel</b-button>
    </b-modal>
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
import DoubleTable from '@/components/DoubleTable';
import ToggleButton from '@/components/ToggleButton';
import BinaryTable from '@/components/BinaryTable';
import {STATUS} from '@/components/Status.js';
import {Status} from '@/components/Status.js';

const Tabulator = require('tabulator-tables');

export default {
  name: 'manage_periods',
  components: {
    TopBar,
    Table,
    DoubleTable,
    ToggleButton,
    BinaryTable,
  },

  data: function() {
    return {
      // The firebase addresses of the ActivePeriods and PreviousPeriods documents
      active_periods_db: db.collection("GlobalVariables").doc("ActivePeriods"),
      past_periods_db: null,

      // The actual loaded documents
      active_periods_doc: null,
      past_periods_doc: null,

      // Data loaded from the ActivePeriod document
      past_periods: [],
      current_period: null,
      future_period: null,
      current_active_youths: [], // With period_status, are these two even necessary?
      future_active_youths: [],
      past_periods_doc_name: null,
      never_active_youths: [],

      // Data for the current and future display/edit tables
      display_table_headers: [
        {title:"Name",   field:"name"},
        {title:"ID",     field:"id"},
        {title:"Status", field:"status"},
      ],
      edit_table_headers: [
        {title:"Name", field:"name"},
        {title:"ID",   field:"id"},
      ],
      binary_tables: [],

      past_table: null,
      past_table_data: [],
      present_table: null,
      future_table: null,
      inactive_table: null,

      inactive_youth_data: [],

      // Modal variables
      confirm_modal_visible: false,
      modal_title: "",
      modal_body: "",
      accept_modal: null,

      selected_youth: null,
      edited_youth: null,

      all_youth: null,

      // Misc
      season_list: null,
      period_sort_map: null,

      period_status: null,

      checkbox_modal_visible: false,
      checkbox_modal_name: null,
      // TODO: Initialize this in the code
      checkbox_modal_form: [],
    };
  },

  mounted: async function() {
    this.active_periods_doc = await this.active_periods_db.get();
    let data = this.active_periods_doc.data();

    this.past_periods_db = db.collection("GlobalVariables").doc(data["PastPeriodsDoc"]);
    this.past_periods_doc = await this.past_periods_db.get();


    this.current_period = data["CurrentPeriod"];
    this.future_period  = data["FuturePeriod"];
    this.past_periods   = data["PastPeriods"];

    this.current_active_youths = data["CurrentActiveYouths"];
    this.future_active_youths  = data["FutureActiveYouths"];

    this.past_periods_doc_name = data["PastPeriodsDoc"];
    this.never_active_youths = data["NeverActiveYouths"];

    this.season_list = data["Seasons"];
    this.period_sort_map = new Object();
    this.season_list.forEach(function(element, n) {
      this.period_sort_map[element] = n;
    }.bind(this));

    this.period_status = new Object();

    this.collect_all_youth();
    console.log(this.all_youth);

    this.construct_bin_table("Current Period", this.current_period);
    this.construct_bin_table("Next Period",    this.future_period);

    this.init_checkbox_form();

    this.display_binary_tables();
    this.display_past_periods();
  },

  computed: {
    edit_button_message: function() {
      if (this.selected_youth != null) {
        return "Edit Active Quarters for " + this.selected_youth.name;
      } else {
        return "No youth selected";
      };
    },
  },

  watch: {},

  methods: {

    construct_bin_table: function(name, period) {
      this.binary_tables.push({
        Name: name,
        Period: period,
        Data: [],
        AcceptEdits: edits => this.accept_period_edits(edits, period),
      });
    },

    manually_collect_youths: async function() {

      // Initialize vars to track results
      let all = [];
      let conflicts = new Object(); // Case 1
      let inactive  = [];           // Case 2
      let untracked = new Object(); // Case 3

      // Load all the youth profiles from the database
      let youth_collection = await db.collection("GlobalYouthProfile").get();

      // Separate youth profiles into lists based on which case they are
      youth_collection.forEach(doc => {

        // Initialize vars
        let data = doc.data();
        let full_id = data["First Name"] + " " + data["Last Name"] + " " + doc.id;
        let active_periods = data["ActivePeriods"];

        // If profile is tracked in ActivePeriods, check for conflicts
        if (this.period_status[full_id] != null) {
          let c = this.period_status[full_id].conflicts(active_periods)

          // CASE 0: Profile and ActivePeriods agree, we don't care about these
          if (c == null) {
            console.log("No conflicts in profile " + full_id + ".");
          }
          // CASE 1: Profile is tracked in ActivePeriods, but has conflicting information
          else {
            console.log("Conflicts in profile " + full_id + ": ", c);
            conflicts[full_id] = c;
          }
        }

        // If profile is not tracked in ActivePeriods, check if it has any records
        else {
          // CASE 2: Profile is not tracked, and has no active periods
          if (active_periods == null || active_periods.length == 0) {
            console.log("No period records exist for profile " + full_id);
            inactive.push(full_id);
          }

          // CASE 3: Profile is not tracked, but does have active periods listed
          else {
            console.log("Youth " + full_id + " is not present in ActivePeriods, but has periods: ", active_periods);
            untracked[full_id] = active_periods;
          }
        };

        // Put all profiles in the "all" list, regardless of case
        all.push({full_id, active_periods});
      });

      // Handle case 1: Merge conflicts
      // Display all options side by side, and let the user choose which to keep

      // Handle case 2: Inactive youth who didn't make it into the ActivePeriods doc
      // Add these youth to the never_active_youth list

      console.log("The following youths with no period records were recovered: ", inactive);

      this.never_active_youths = this.never_active_youths.concat(untracked).filter((elem, n, arr) => {
        return arr.indexOf(elem) == n;
      });

      // Handle case 3: Youth with active periods not present in the ActivePeriods doc
      // Display which periods the profile lists, and let the user choose which to keep

      console.log("The following youths have active periods listed in their profiles, but are not present in the ActivePeriods document:", untracked);

      // TODO: Display results of this search with modal
      // TODO: Save any changes made here to the database
    },

    // Collects all youth IDs from all listed periods and initializes period_status with them
    collect_all_youth: function() {

      // Add all current, future, and inactive youths to all_youth
      this.all_youth = [...this.current_active_youths, ...this.future_active_youths, ...this.never_active_youths];

      // Add all past youths to all_youth
      let past_data = this.past_periods_doc.data();
      this.past_periods.forEach(function(period) {
        this.all_youth = this.all_youth.concat(past_data[period]);
      }.bind(this));

      // Filter duplicates out of all_youth
      this.all_youth = this.all_youth.filter(function(element, n, arr) {
        return arr.indexOf(element) == n;
      });

      // Initialize a Status object for each unique youth, tracked in period_status
      this.all_youth.forEach(function(youth) {

        // Init new Status object (see class declaration above)
        let stat = new Status();

        // Initialize the status of each period based on whether the youth is in that period
        set_status(this, stat, youth, this.current_period, this.current_active_youths);
        set_status(this, stat, youth, this.future_period, this.future_active_youths);
        this.past_periods.forEach(period => {
          set_status(this, stat, youth, period, past_data[period]);
        });

        // Save the new object to period_status
        this.period_status[youth] = stat;
      }.bind(this));

      // Create the period_status.filter(period, status) function
      // Returns a list of all youth where the given period matches the given status
      Object.defineProperty(this.period_status, "filter", {
        value: function(period, filter_status) {
          return Object.keys(this).filter(function(youth) {
            if      (filter_status == STATUS.O) filter_status = [STATUS.USED,   STATUS.ADD];
            else if (filter_status == STATUS.X) filter_status = [STATUS.UNUSED, STATUS.REMOVE];
            else if (!Array.isArray(filter_status)) filter_status = [filter_status];
            return filter_status.includes(this[youth][period]);
          }.bind(this));
        },
      });

      // Create the period_status.set_periods(youth, periods) function
      // Set the representation of the youth's periods to match the given array of periods
      Object.defineProperty(this.period_status, "set_periods", {
        value: function(youth, periods) {
          Object.keys(this[youth]).forEach(function(period) {
            this[youth].set(period, periods.includes(period) ? STATUS.O : STATUS.X);
          }.bind(this));
        },
      });

      let temp = [];
      this.never_active_youths.forEach(full_id => {
        temp.push(this.unpack_id(full_id));
      });
      this.inactive_youth_data = temp;

      // Helper function - Initialize period fields in the new Status object
      function set_status(self, stat, youth, period, array) {
        stat.add_vue(self, period, (array.includes(youth) ? STATUS.USED : STATUS.UNUSED));
      };
    },

    //TODO: remove "get_youth" from these function names
    // Get the youth's active periods with all the local edits accounted for
    updated_periods: function(full_id) {
      return this.period_status[full_id].filter(STATUS.O);
    },

    // Get the youth's original active periods without any local edits
    original_periods: function(full_id) {
      return this.period_status[full_id].filter([STATUS.USED, STATUS.REMOVE]);
    },

    // Get the periods in which the youth's status is being changed locally
    changing_periods: function(full_id) {
      return this.period_status[full_id].filter([STATUS.ADD, STATUS.REMOVE]);
    },

    youth_is_active: function(full_id, period) {
      return this.period_status[full_id].is_status(period, STATUS.O);
    },

    // Display a modal allowing the user to change which periods a given youth is active for
    edit_youth_periods: function(event) {

      // Store the current selected youth as the one being edited
      // TODO: I'm not sure this is really necessary, but better safe then sorry?
      this.edited_youth = this.selected_youth;

      // Get the periods for which the edited youth is active
      let youth_periods = this.updated_periods(this.edited_youth.full_id);

      // Set the variables for the checkbox modal, initializing the form to the active periods
      this.checkbox_modal_name = this.edited_youth.name;
      this.checkbox_modal_form.forEach(function (element) {
        element.checked = youth_periods.includes(element.period);
      });

      // Display the checkbox modal
      this.checkbox_modal_visible = true;
    },

    unpack_id: function(id) {
      let rollover = function() {
        return (
          this.period_status[id].is_status(this.current_period, STATUS.O) &&
          this.period_status[id].is_status(this.future_period,  STATUS.O)
        );
      }.bind(this);
      return {
        full_id: id,
        name: id.slice(0, id.lastIndexOf(" ")),
        id: id.slice(id.lastIndexOf(" ")+1),
        is_rolling_over: rollover,
      };
    },

    // Initialize the modal checkbox form to edit a youth's active periods
    init_checkbox_form: function() {
      var temp = [];

      temp.push({period: this.future_period,  msg: "(Next Period)",    checked:false});
      temp.push({period: this.current_period, msg: "(Current Period)", checked:false});

      this.past_periods.forEach(function(period) {
        temp.push({period, msg:"", checked:false});
      });

      this.checkbox_modal_form = temp;
    },

    // TODO: Maybe specify which arrays should be updated?
    update_active_arrays: function(youth) {

      // console.log("Updating active arrays for youth " + youth + " in periods ", periods);

      this.current_active_youths = this.period_status.filter(this.current_period, STATUS.O);
      this.future_active_youths  = this.period_status.filter(this.future_period,  STATUS.O);

      this.past_periods.forEach(function(period) {
        if (this.youth_is_active(youth.full_id, period)) {
          if (split_table_youth_period(this.past_table_data, period, true).length == 0) {
            this.past_table_data.push({...youth, quarter: period});
          };
        } else {
          this.past_table_data = split_table_youth_period(this.past_table_data, period, false);
        }
      }.bind(this));

      let new_inactive = [];
      Object.keys(this.period_status).filter(full_id => {
        return this.period_status[full_id].filter(STATUS.O).length == 0;
      }).forEach(full_id => {
        new_inactive.push(this.unpack_id(full_id));
      });

      this.display_binary_tables();
      this.past_table.replaceData(this.past_table_data);
      this.inactive_youth_data = new_inactive;

      // If match is true, returns all table elements matching current youth and given period
      // If match is false, returns all table elements NOT matching above criteria
      function split_table_youth_period(table_data, period, match) {
        return table_data.filter(function(element) {
          let temp = ((element.quarter == period) && (element.full_id == youth.full_id));
          return (match ? temp : !temp);
        });
      };
    },

    get_default_changes: function() {
      return {
        CurrentPeriod: this.current_period,
        FuturePeriod:  this.future_period,
        PastPeriods:   this.past_periods,
        CurrentActiveYouths: this.current_active_youths,
        FutureActiveYouths:  this.future_active_youths,
        PastPeriodsDoc: this.past_periods_doc_name,
        NeverActiveYouths: this.never_active_youths,
        Seasons: this.season_list,
      };
    },

    get_active_changes: function() {
      let def = this.get_default_changes();
      let ret = null;

      // Copy all fields from def to ret if they are different from the corresponding field
      // in the active_periods doc - i.e. if they have been changed client-side
      Object.keys(def).filter(function(val) {
        // Have to use stringify for arrays
        return (JSON.stringify(def[val]) != JSON.stringify(this.active_periods_doc.data()[val]));
      }.bind(this)).forEach(function(val) {
        if (ret == null) ret = new Object();
        ret[val] = def[val];
      });

      return ret;
    },

    check_changes: function() {
      let active = false;
      let previous = false;
      let youth = [];
      let periods = [];
      let def = this.get_active_changes();

      for (var key in this.period_status) {
        let changing_periods = this.changing_periods(key);
        if (changing_periods.length) {
          youth.push(key);
          periods = periods.concat(changing_periods);
        };
      };

      active = periods.filter(function(element) {
        return ((element == this.current_period) || (element == this.future_period))
      }.bind(this)).length != 0;
      active = active || (def != null);

      previous = periods.filter(function(element) {
        return ((element != this.current_period) && (element != this.future_period))
      }.bind(this)).length != 0;

      return {active, previous, youth, periods, def};

      function unique_array_vals(arr1, arr2) {
        return arr1.concat(arr2).filter(function(val) {
          return (arr1.includes(val) != arr2.includes(val));
        });
      };
    },

    save_changes: async function() {
      let changes = this.check_changes();

      if (!changes.active && !changes.previous) {
        this.show_modal("No changes have been made.", "", this.close_modal);
      } else {
        this.show_modal(
          "The following changes will be saved to the database:",
          changes,
          function() {this.update_database(changes);}
        );
      }
    },

    // Save changes to Firebase
    // Returns null on success, and error on failure
    // If arg "changes" is null, grabs all changes itself
    update_database: async function(changes) {

      // Load changes if no argument given
      if (changes == null) {
        changes = this.check_changes();
      };

      console.log("Changes to be saved: ", changes);

      // Save changes to the ActivePeriods doc
      if (changes.active) {
        console.log("Setting active periods doc to ", changes.def);
        this.active_periods_db.update(changes.def).then(
          // Success
          function() {},
          // Failure
          function(err) {
            window.alert("Error updating ActivePeriods document: " + err);
            return err;
          }
        );
      };

      // Save changes to the period arrays in the PastPeriods doc
      if (changes.previous) {
        console.log("Setting previous docs...");

        if (this.past_periods_doc == null) {
          this.past_periods_doc = await this.past_periods_db.get();
        };

        let data = this.past_periods_doc.data();
        let updated_data = new Object();

        changes.periods.filter(function(period) {
          return ((period != this.current_period) && (period != this.future_period))
        }.bind(this)).forEach(function(period) {

          let to_remove = changes.youth.filter(function(youth) {
            this.period_status[youth][period] == STATUS.REMOVE;
          });

          let to_add = changes.youth.filter(function(youth) {
            this.period_status[youth][period] == STATUS.ADD;
          });

          // Add the updated version of this period to the new object
          updated_data[period] = data[period].concat(to_add).filter(function(val) {
            return !to_remove.includes(val);
          });
        });

        // Update the database
        this.past_periods_db.update(updated_data).then(
          // Success
          function() {},
          // Failure
          function(err) {
            window.alert("Error updating PreviousPeriods document: " + err);
            return err;
          }
        );
      };

      // Save changes to individual youth profiles
      console.log("Updating youth profiles...");
      changes.youth.forEach(function(full_id) {
        let temp_youth = this.unpack_id(full_id);
        db.collection("GlobalYouthProfile").doc(temp_youth.id).update({
          ActivePeriods: this.period_status[temp_youth.full_id].filter(STATUS.O)
        }).then(
          // Success
          function() {},
          // Failure
          function() {
            window.alert("Error updating youth profile doc #" + temp_youth.id + ": " + err);
            return err;
          }
        );
      }.bind(this));

      window.alert("Changes saved successully!");

      // Reset tracking variables
      this.edited_youth = null;
      this.selected_youth = null;
      this.past_periods_doc = null;

      return null;
    },

    // Display the modal with the following:
    // title - the title text for the modal
    // body - the body text for the modal
    // confirm_function - a function to be executed if the confirm button is pressed
    show_modal: function(title, body, confirm_function) {
      this.modal_title = title;
      this.modal_body = body;
      this.accept_modal = function() {
        confirm_function.bind(this).call();
        this.close_modal();
      }.bind(this);
      this.confirm_modal_visible = true;
    },

    // Closes the modal
    // Will be called at the end of every accept_modal function
    close_modal: function() {
      this.confirm_modal_visible = false;
    },

    modal_form_check: function(index, item) {
      item.checked = !item.checked;
    },

    accept_edit_modal: function() {

      // Collect names of all checked periods
      let checked_periods = [];
      this.checkbox_modal_form.forEach(function(element) {
        if (element.checked) {
          checked_periods.push(element.period);
        };
      });

      // Track changes in period_status, and update displays
      this.period_status.set_periods(this.edited_youth.full_id, checked_periods);
      this.update_active_arrays(this.edited_youth);

      // Deselect youth
      this.edited_youth = null;
      this.selected_youth = null;

      // Hide the edit modal
      this.checkbox_modal_visible = false;
    },

    display_binary_tables: function() {
      this.binary_tables.forEach(table => {

        // Initialize arrays to store youth active and inactive in the current period
        let active = [];
        let inactive = [];

        // Create a message for youth not rolling over, based on which table this is
        let no_return_msg = (table.Period == this.current_period) ? "Not Returning" : "New";

        // Sort all youth into either active this period or inactive this period
        this.all_youth.forEach(full_id => {

          // Create the new row from the preexisting youth object, plus a status
          let youth = this.unpack_id(full_id);
          youth.status = (youth.is_rolling_over()) ? "Rolling Over" : no_return_msg;

          // Put the row in the appropriate array
          if (this.youth_is_active(youth.full_id, table.Period)) {
            active.push(youth);
          } else {
            inactive.push(youth);
          }
        });

        // Update the current table's data
        table.Data = {active, inactive};
      });
    },

    accept_period_edits: function(edits, period) {
      // Set active youth in given period
      edits.active.forEach(youth => {
        this.period_status[youth.full_id].set(period, STATUS.O);
      });

      // Set inactive youth in given period
      edits.inactive.forEach(youth => {
        this.period_status[youth.full_id].set(period, STATUS.X);
      });

      // Update the displays
      // TODO: Single function to update the arrays all at once?
      Object.keys(this.period_status).forEach(youth => {
        this.update_active_arrays(this.unpack_id(youth));
      });
    },

    // Display the previous periods on the page
    display_past_periods: function() {
      let data = this.past_periods_doc.data();

      this.past_periods.forEach(quarter => {
        data[quarter].forEach(full_id => {
          this.past_table_data.push({ ...this.unpack_id(full_id), quarter });
        });
      });

      this.past_table = new Tabulator("#past-quarters-table", {
        data:this.past_table_data,
        layout:"fitColumns",
        groupBy:"quarter",
        groupValues:[this.past_periods],
        groupStartOpen:false,
        groupToggleElement:"header",
        columns:[
          {title:"Name", field:"name", width:200},
          {title:"ID", field:"id"},
        ],
        selectable:1,
        rowSelected:   row => this.select_youth("Past", row),
        rowDeselected: row => this.deselect_youth("Past"),
      });
    },

    // Function to determine period ordering.
    // Usage: some_period_array.sort(sort_periods)
    sort_periods: function(a, b) {
      let a_month = a.slice(0,-2).trim();
      let b_month = b.slice(0,-2).trim();
      let a_year = a.slice(-2);
      let b_year = b.slice(-2);
      if (a_year == b_year) {
        return this.period_sort_map[a_month] - this.period_sort_map[b_month];
      } else {
        return a_year.localeCompare(b_year);
      }
    },

    // Update to the next period
    move_to_next_period: function() {
      this.show_modal(
        "The current active period will be changed from \"" + this.current_period + "\" to \"" + this.future_period + "\".",
        "This action should only be taken at the end of the current quarter, \"" + this.current_period + "\". Please be absolutely sure that this is desired.",
        function() {

          let updated_past_periods = this.past_periods.slice(0);
          updated_past_periods.unshift(this.current_period);

          var active_period_changes = {
            CurrentPeriod: this.future_period,
            FuturePeriod:  gen_next_period_name(),
            PastPeriods:   updated_past_periods,
            CurrentActiveYouths: this.future_active_youths,
            FutureActiveYouths:  [],
            PastPeriodsDoc: this.active_periods_doc.data()["PastPeriodsDoc"],
          };

          var previous_period_changes = new Object();
          previous_period_changes[this.current_period] = this.current_active_youths;

          // this.active_periods_db.update(active_period_changes).catch(err => {
          //   window.alert("Error updating ActivePeriods document: " + err);
          //   return err;
          // });

          // this.past_periods_db.update(previous_period_changes).catch(err => {
          //   window.alert("Error updating PastPeriods document: " + err);
          //   return err;
          // });

          return null;
        });
    },

    gen_next_period_name: function(period) {

      // Use the future period as the default
      if (period == null) period = this.future_period;

      // TODO: Do something if the passed period name is not valid
      if (!this.valid_period(period)) {
        console.log("Error: Trying to generate next period from invalid period name \"" + period + "\".");
      };

      // If period name is valid, initialize some vars
      let new_name = "";

      let season = period.slice(0,-2).trim();
      let year = period.slice(-2);
      let index = this.season_list.indexOf(season);

      // If this is the last season of the year, loop around and increment the year
      if (index == this.season_list.length - 1) {
        new_name = this.season_list[0] + " " + (parseInt(year)+1);
      } else {
        new_name = this.season_list[index+1] + " " + year;
      };

      if (!this.valid_period(new_name)) {
        console.log("Error: Generated invalid period name \"" + new_name + "\" from period name \"" + period + "\".");
      }

      // Return the new period name
      return new_name;
    },

    // Construct a RegEx pattern from the list of months and use it to check the validity of a given period name.  Period names should be of the form "Season ##".
    // Only tracks last two digits of the year, so this will start having problems a thousand years from now
    valid_period(name) {
      let len = this.season_list.length;

      // Match beginning of string
      let regex_string = "^(";

      // Account for each season
      for (let i = 0; i < len; i++) {
        regex_string += this.season_list[i] + ((i < len-1) ? "|" : "");
      }

      // Match space, two year digits, and end of string
      regex_string += ") [0-9][0-9]$";

      // Create RegExp object
      let regex = new RegExp(regex_string, );

      // Try and match
      return name.match(regex) != null;
    },

    select_youth: function(source_table, row) {
      let data = row.getData();

      // Since the Inactive table and the Past/Present/Future tables are mutually exclusive (that is, a youth may only be in one of them), we have to clear whichever group we're not picking from
      if (source_table == "Inactive") this.deselect_youth(source_table);
      else this.inactive_table.deselectRow();

      // Filter out the matching rows from the past table, then select each of them individually
      this.past_table.getRows()
        .filter(r => r.getData().full_id == data.full_id)
        .forEach(r => this.past_table.selectRow(r));

      // Select the appropriate row in the current and future tables
      this.binary_tables.forEach( table => table.Table.selectRow(data.id) );

      // Set the selected youth var
      this.selected_youth = this.unpack_id(data.full_id);
    },

    deselect_youth: function(source_table) {
      // Clear the past_table selection regardless, since it may have more than one row selected
      this.past_table.deselectRow();

      // Clear all tables except the one specified source_table, to guard against infinite loops
      if (source_table != "Inactive") this.inactive_table.deselectRow();
      this.binary_tables.forEach(table => {
        if (source_table != table.period) table.Table.deselectRow();
      });

      // Clear the selected youth var
      this.selected_youth = null;
    },
  }
}
</script>