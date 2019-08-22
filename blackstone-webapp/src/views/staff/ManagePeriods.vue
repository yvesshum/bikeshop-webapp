<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>
    <br />

    <!-- TODO: Use {{variable}} syntax to set this without explicit code -->
    <h3>Current Quarter (<span ref="current_period_title"></span>)</h3>

    <BinaryTable
      :displayTableHeaders="this.display_table_headers"
      :editTableHeaders="this.edit_table_headers"
      :tableData="active_table_data"

      :placeholders="{left:'No youth inactive this quarter', right:'No youth active this quarter'}"
      onText="Update Table"
      offText="Edit Currently Active Youth"

      @AcceptEdits="this.accept_current_edits"
      @selectedRow="this.select_youth"
    ></BinaryTable>

    <br /><br />

    <h3>Next Quarter (<span ref="future_period_title"></span>)</h3>
    <BinaryTable
      :displayTableHeaders="this.display_table_headers"
      :editTableHeaders="this.edit_table_headers"
      :tableData="future_table_data"

      :placeholders="{left:'No youth inactive this quarter', right:'No youth active this quarter'}"
      onText="Update Table"
      offText="Edit Future Active Youth"

      @AcceptEdits="this.accept_future_edits"
      @selectedRow="this.select_youth"
    ></BinaryTable>

    <br />

    <h3>Past Quarters</h3>
    <!-- <Table :headingdata="['test', 'test2']" :table_data="[{'test': 'hi', 'test2': 'bye', 
      'cat':'a'}, {'test': 'hi', 'test2': 'bye', 'cat':'b'}]" :args="{groupBy:'cat'}" /> -->
    <div id="past-quarters-table"></div>

    <br />
    <br />

    <button v-on:click="edit_youth_periods" ref="edit_youth_quarters_button">Edit Active Quarters for <span ref="sel_youth_name"></span></button>
    
    <br />
    <button v-on:click="save_changes">Save Changes</button>

    <button v-on:click="collect_all_youth">Collect All Youth!</button>

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
      current_active_youths: [],
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
      active_table_data: [],
      future_table_data: [],

      past_table: null,
      past_table_data: [],

      // Modal variables
      confirm_modal_visible: false,
      modal_title: "",
      modal_body: "",
      accept_modal: null,

      selected_youth: null,
      selected_youth_data: null,
      selected_youth_profile: null,
      edited_youth: null,

      all_youth: null,

      // Misc
      month_list: ["winter", "spring", "summer", "autumn"],
      period_sort_map: null,

      pending_changes: [],
      cached_youth_data: null,
      cached_youth_profiles: null,

      checkbox_modal_visible: false,
      checkbox_modal_name: null,
      checkbox_modal_form: [
        {period:"autumn19", msg:"(Next Period)", checked:true},
        {period:"summer19", msg:"(Current Period)", checked:false},
        {period:"spring19", msg:"", checked:true},
        {period:"winter19", msg:"", checked:false},
      ],
    };
  },

  mounted: async function() {
    this.active_periods_doc = await this.active_periods_db.get();
    let data = this.active_periods_doc.data();

    this.past_periods_db = db.collection("GlobalVariables").doc(data["PastPeriodsDoc"]);
    this.past_periods_doc = await this.past_periods_db.get();

    this.cached_youth_data     = new Object();
    this.cached_youth_profiles = new Object();

    this.current_period = data["CurrentPeriod"];
    this.future_period  = data["FuturePeriod"];
    this.past_periods   = data["PastPeriods"];

    this.current_active_youths = data["CurrentActiveYouths"];
    this.future_active_youths  = data["FutureActiveYouths"];

    this.past_periods_doc_name = data["PastPeriodsDoc"];
    this.never_active_youths = data["NeverActiveYouths"];

    this.period_sort_map = new Object();
    this.month_list.forEach(function(element, n) {
      this.period_sort_map[element] = n;
    }.bind(this));

    this.collect_all_youth();
    console.log(this.all_youth);

    this.display_current_period();
    this.display_future_period();
    this.display_past_periods();

    this.$refs.edit_youth_quarters_button.style.display = "none";
  },

  watch: {
    selected_youth: async function(youth) {
      if (youth == null) {
        console.log("No youth selected");
        this.$refs.edit_youth_quarters_button.style.display = "none";
        // this.$refs.selected_youth.style.display = "none";
      }

      else {
        console.log("Youth selected: ", youth);

        let pd = await this.retrieve_youth_profile(youth.full_id);
        this.selected_youth_profile = pd.profile;
        this.selected_youth_data = pd.data;

        // this.$refs.selected_youth.style.display = "";
        // document.querySelectorAll(".sel_youth_name").forEach((element, n) => {
        //   element.innerHTML = youth.name;
        // });
        this.$refs.sel_youth_name.innerHTML = youth.name;
        // this.$refs.sel_youth_id.innerHTML = youth.id;
        this.$refs.edit_youth_quarters_button.style.display = "";
      };
    },
  },

  methods: {

    manually_collect_youths: async function() {
      this.all_youth = [];
      this.never_active_youths = [];

      let youth_collection = await db.collection("GlobalYouthProfile").get();

      youth_collection.forEach(doc => {
        console.log(doc.data());
        let full_id = doc.data()["First Name"] + " " + doc.data()["Last Name"] + " " + doc.id;
        let active_periods = doc.data()["ActivePeriods"];

        if (active_periods == null || active_periods == []) {
          this.never_active_youths.push(full_id);
        }
        // TODO: else clause to check existing data against their profiles?
        this.all_youth.push(full_id);
      });
    },

    collect_all_youth: function() {
      this.all_youth = [...this.current_active_youths, ...this.future_active_youths, ...this.never_active_youths];
      console.log(this.past_periods_doc.data());
      Object.keys(this.past_periods_doc.data()).forEach(function(period) {
        this.all_youth = [...this.all_youth, ...this.past_periods_doc.data()[period]];
      }.bind(this));

      this.all_youth = this.all_youth.filter(function(element, n, arr) {
        return arr.indexOf(element) == n;
      });
    },

    retrieve_youth_profile: async function(full_id) {

      // Youth profile has already been retrieved - load if from the cache
      if (this.cached_youth_profiles[full_id] != null) {
        return {
          profile: this.cached_youth_profiles[full_id],
          data: this.cached_youth_data[full_id],
        };
      }

      // Youth profile has not been retrieved yet - load it from the database and cache it
      else {
        let profile = await db.collection("GlobalYouthProfile").doc(this.selected_youth.id).get();
        let data = profile.data();

        this.cached_youth_profiles[full_id] = profile;
        this.cached_youth_data[full_id] = data;

        return {profile, data};
      }
    },

    is_cached: function(full_id) {
      return Object.keys(this.cached_youth_profiles).includes(full_id);
    },

    get_youth_profile: function(full_id) {
      return this.cached_youth_profiles[full_id];
    },

    get_youth_data: function(full_id) {
      return this.cached_youth_data[full_id];
    },

    get_youth_updated_periods: function(full_id) {
      let new_periods = this.pending_changes[full_id];
      if (new_periods == null) {
        if (this.is_cached(full_id)) {
          new_periods = this.get_youth_data(full_id)["ActivePeriods"];
        }
        else {
          new_periods = [];
        };
      };
      return new_periods;
    },

    get_youth_original_periods: function(full_id) {
      if (this.is_cached(full_id)) {
        return this.get_youth_profile(full_id).data()["ActivePeriods"];
      };
      throw "Error retrieving original periods for youth " + full_id + ".";
    },

    edit_youth_periods: function(event) {
      event.preventDefault();
      this.edited_youth = this.selected_youth;
      this.match_form_to_youth(this.selected_youth_data.ActivePeriods);
      this.show_form();
    },

    unpack_id: function(id) {
      let rollover = function() {
        return (this.current_active_youths.includes(id) && this.future_active_youths.includes(id));
      }.bind(this);
      return {
        full_id: id,
        name: id.slice(0, id.lastIndexOf(" ")),
        id: id.slice(id.lastIndexOf(" ")+1),
        is_rolling_over: rollover,
      };
    },

    match_form_to_youth: function(youth_periods) {
      this.checkbox_modal_name = this.edited_youth.name;

      this.checkbox_modal_form.forEach(function (element) {
        element.checked = youth_periods.includes(element.period);
      });

      this.show_form();
    },

    show_form: function() {
      this.checkbox_modal_visible = true;
    },

    update_active_arrays: function(youth, periods) {

      this.current_active_youths = toggle_youth_in_array(this.current_active_youths, this.current_period);
      this.future_active_youths  = toggle_youth_in_array(this.future_active_youths,  this.future_period);

      this.past_periods.forEach(function(period) {
        if (periods.includes(period)) {
          console.log("Youth ", youth, " should be in period " + period);
          if (split_table_youth_period(this.past_table_data, period, true).length == 0) {
            add_youth_to_table(this.past_table_data, period);
          };
        } else {
          console.log("Youth ", youth, " should NOT be in period " + period);
          this.past_table_data = split_table_youth_period(this.past_table_data, period, false);
        }
      }.bind(this));

      this.display_current_period();
      this.display_future_period();
      this.past_table.replaceData(this.past_table_data);

      function toggle_youth_in_array(arr, arr_name) {
        if (periods.includes(arr_name)) {
          if (!arr.includes(youth.full_id)) {
            arr.push(youth.full_id);
          };
          return arr;
        } else {
          return arr.filter(function(val) {
            return val != youth.full_id;
          });
        };
      };

      // If match is true, returns all table elements matching current youth and given period
      // If match is false, returns all table elements NOT matching above criteria
      function split_table_youth_period(table_data, period, match) {
        return table_data.filter(function(element) {
          let temp = ((element.quarter == period) && (element.full_id == youth.full_id));
          return (match ? temp : !temp);
        });
      };

      function add_youth_to_table(table_data, period) {
        table_data.push({
          name: youth.name,
          id: youth.id,
          full_id: youth.full_id,
          quarter: period,
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

      for (var key in this.cached_youth_data) {
        let original = this.get_youth_original_periods(key);
        let updated = this.get_youth_updated_periods(key);

        if (JSON.stringify(original) !== JSON.stringify(updated)) {
          youth.push(key);
          periods = periods.concat(unique_array_vals(updated, original));
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
          // Remove youth from this period if they are in the list to be changed
          let to_remove = data[period].filter(function(val) {
            return changes.youth.includes(val);
          });

          // Add youth to this period if they are not in it yet but are in the list to be changed
          let to_add = changes.youth.filter(function(val) {
            return !data[period].includes(val);
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
          ActivePeriods: this.pending_changes[full_id]
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
      this.pending_changes = [];
      this.cached_youth_data = new Object();
      this.cached_youth_profiles = new Object();
      this.edited_youth = null;
      this.selected_youth = null;
      this.selected_youth_data = null;
      this.selected_youth_profile = null;
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

      // Update cached profile with new checked periods
      this.cached_youth_data[this.edited_youth.full_id]["ActivePeriods"] = checked_periods;

      // Add changes to pending_changes array, and update displays
      this.pending_changes[this.edited_youth.full_id] = checked_periods;
      this.update_active_arrays(this.edited_youth, checked_periods);

      // Hide the edit modal
      this.checkbox_modal_visible = false;
    },

    // Display the current period on the page
    display_current_period: function() {
      this.$refs.current_period_title.innerHTML = this.current_period;

      // Initialize arrays to store youth active and inactive in the current period
      let active = [];
      let inactive = [];

      // Sort all youth into either active this period or inactive this period
      for (var n in this.all_youth) {

        // Create the new row from the preexisting youth object, plus a status
        let youth = this.unpack_id(this.all_youth[n]);
        youth.status = (youth.is_rolling_over()) ? "Rolling Over" : "Not Returning";

        // Put the row in the appropriate array
        if (this.current_active_youths.includes(this.all_youth[n])) {
          active.push(youth);
        } else {
          inactive.push(youth);
        }
      };

      // Set the table data prop
      this.active_table_data = {active, inactive};
    },

    accept_current_edits: function(edits) {
      edits.active.forEach(function(youth) {
        this.set_youth_status(youth.full_id, this.current_period, true);
      }.bind(this));

      edits.inactive.forEach(function(youth) {
        this.set_youth_status(youth.full_id, this.current_period, false);
      }.bind(this));

      // TODO: Update the arrays all at once
      // this.update_active_arrays(this.unpack_id(id), this.pending_changes[id]);
    },

    // Display the next period on the page
    display_future_period: function() {
      this.$refs.future_period_title.innerHTML = this.future_period;

      // Initialize arrays to store youth active and inactive in the future period
      let active = [];
      let inactive = [];

      // Sort all youth into either active this period or inactive next period
      for (var n in this.all_youth) {

        // Create the new row from the preexisting youth object, plus a status
        let youth = this.unpack_id(this.all_youth[n]);
        youth.status = (youth.is_rolling_over()) ? "Rolling Over" : "New";

        // Put the row in the appropriate array
        if (this.future_active_youths.includes(this.all_youth[n])) {
          active.push(youth);
        } else {
          inactive.push(youth);
        }
      };

      // Set the table data prop
      this.future_table_data = {active, inactive};
    },

    accept_future_edits: function(edits) {
      edits.active.forEach(function(youth) {
        this.set_youth_status(youth.full_id, this.future_period, true);
      }.bind(this));

      edits.inactive.forEach(function(youth) {
        this.set_youth_status(youth.full_id, this.future_period, false);
      }.bind(this));
    },

    // Display the previous periods on the page
    display_past_periods: function() {
      let data = this.past_periods_doc.data();

      this.past_periods.forEach(function(period) {
        data[period].forEach(function (full_id) {
          this.past_table_data.push({
            ...this.unpack_id(full_id),
            quarter: period
          });
        }.bind(this));
      }.bind(this));

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
        rowSelected:function(row){
          this.past_table.selectRow(row.getIndex());
          this.selected_youth = this.unpack_id(row.getData().full_id);
        }.bind(this),
        rowDeselected:function(row){
          this.past_table.deselectRow();
        }.bind(this),
      });
    },

    // Set the youth with the given ID to active or not in the given period or periods
    // Periods may be a single item or an array
    set_youth_status: function(id, periods, status) {

      // Init the youth's new periods to any pending changes
      let new_periods = this.get_youth_updated_periods(id);

      // If a single element is passed, make it an array
      if (!Array.isArray(periods)) periods = [periods];
      
      // Update the pending changes array with a ternary operation using the new_periods array
      this.pending_changes[id] = (status)

        // If the youth is being activated, add the given period to the list
        ? [...new_periods, ...periods].filter((e, n, arr) => arr.indexOf(e) == n).sort(this.sort_periods)
        // If the youth is being deactivated, remove the given period
        : new_periods.filter((element) => !periods.includes(element));

      if (this.cached_youth_data[id] != null) {
        this.cached_youth_data[id]["ActivePeriods"] = this.pending_changes[id];
      };

      // Update the different period arrays & displays with the new pending changes
      console.log("Updating active arrays with id " + id + " and periods ", this.pending_changes[id]);
      this.update_active_arrays(this.unpack_id(id), this.pending_changes[id]);
    },

    // Function to determine period ordering.
    // Usage: some_period_array.sort(sort_periods)
    sort_periods: function(a, b) {
      let a_month = a.slice(0,-2);
      let b_month = b.slice(0,-2);
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
        console.log("Something went wrong");
      };

      // If period name is valid, initialize some vars
      let new_name = "";

      let season = period.slice(0,-2);
      let year = period.slice(-2);
      let index = this.month_list.indexOf(season);

      // If this is the last season of the year, loop around and increment the year
      if (index == this.month_list.length) {
        new_name = this.month_list[0] + (parseInt(year)+1);
      } else {
        new_name = this.month_list[index+1] + year;
      };

      // Return the new period name
      return new_name;
    },

    // Construct a RegEx pattern from the list of months and use it to check the validity of a given period name.  Period names should be of the form "season##".
    // Only tracks last two digits of the year, so this will start having problems a thousand years from now
    valid_period(name) {
      let len = this.month_list.length;

      // Match beginning of string
      let regex_string = "^(";

      // Account for each season
      for (let i = 0; i < len; i++) {
        regex_string += this.month_list[i] + ((i < len-1) ? "|" : "");
      }

      // Match two year digits and end of string
      regex_string += ")[0-9][0-9]$";

      // Create RegExp object
      let regex = new RegExp(regex_string, );

      // Try and match
      return name.match(regex) != null;
    },

    select_youth: async function(row) {
      this.selected_youth = this.unpack_id(row.getData().full_id);
    },
  }
}
</script>