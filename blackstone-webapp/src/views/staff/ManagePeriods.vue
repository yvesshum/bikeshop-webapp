<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>
    <br />

    <h3>Current Quarter (<span ref="current_period_title"></span>)</h3>
    <Table ref="current_youths" :headingdata="this.active_table_headers" :table_data="this.active_table_data" @selectedRow="this.select_youth"></Table>

    <br />

    <h3>Next Quarter (<span ref="future_period_title"></span>)</h3>
    <Table ref="future_youths" :headingdata="this.future_table_headers" :table_data="this.future_table_data" @selectedRow="this.select_youth"></Table>

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
const Tabulator = require('tabulator-tables');

export default {
  name: 'manage_periods',
  components: {
    TopBar,
    Table,
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

      active_table_headers: [
        {title:"Name",   field:"name"},
        {title:"ID",     field:"id"},
        {title:"Status", field:"status"},
      ],
      active_table_data: [],

      future_table_headers: [
        {title:"Name",   field:"name"},
        {title:"ID",     field:"id"},
        {title:"Status", field:"status"},
      ],
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

        // Youth profile has already been retrieved - load if from the cache
        if (this.cached_youth_profiles[youth.full_id] != null) {
          console.log("Already retrieved " + youth.full_id);
          this.selected_youth_profile = this.cached_youth_profiles[youth.full_id];
          this.selected_youth_data    = this.cached_youth_data[youth.full_id];
        }

        // Youth profile has not been retrieved yet - load it from the database and cache it
        else {
          console.log("Retrieving " + youth.full_id + " from the database...");
          this.selected_youth_profile = await db.collection("GlobalYouthProfile").doc(this.selected_youth.id).get();
          this.selected_youth_data = this.selected_youth_profile.data();

          this.cached_youth_profiles[youth.full_id] = this.selected_youth_profile;
          this.cached_youth_data[youth.full_id]     = this.selected_youth_data;
        }
        

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
        if (JSON.stringify(this.cached_youth_data[key]) !== JSON.stringify(this.cached_youth_profiles[key].data())) {
          youth.push(key);
          periods = periods.concat(unique_array_vals(
            this.cached_youth_data[key]["ActivePeriods"],
            this.cached_youth_profiles[key].data()["ActivePeriods"]
          ));
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

      this.active_table_data = [];

      for (var n in this.all_youth) {
        if (this.current_active_youths.includes(this.all_youth[n])) {
          let youth = this.unpack_id(this.all_youth[n]);
          youth.status = (youth.is_rolling_over()) ? "Rolling Over" : "n/a";
          this.active_table_data.push(youth);
        }
      };
    },

    // Display the next period on the page
    display_future_period: function() {
      this.$refs.future_period_title.innerHTML  = this.future_period;

      this.future_table_data = [];

      for (var n in this.future_active_youths) {
        let youth = this.unpack_id(this.future_active_youths[n]);
        youth.status = (youth.is_rolling_over()) ? "Rolling Over" : "New";
        this.future_table_data.push(youth);
      };
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
      // If youth doesn't have any pending changes yet, grab their current active periods
      let new_periods = this.pending_changes[id];
      if (new_periods == null) {
        try {
          new_periods = this.cached_youth_data[id]["ActivePeriods"];
        } catch {
          new_periods = [];
        };
      };

      // If a single element is passed, make it an array
      if (!Array.isArray(periods)) periods = [periods];
      
      // Update the pending changes array with a ternary operation using the new_periods array
      this.pending_changes[id] = (status)

        // If the youth is being activated, add the given period to the list
        ? [...new_periods, ...periods].filter((e, n, arr) => arr.indexOf(e) == n).sort(this.sort_periods)
        // If the youth is being deactivated, remove the given period
        : new_periods.filter((element) => !periods.includes(element));

      // Update the different period arrays & displays with the new pending changes
      console.log("Updating active arrays with id " + id + " and periods ", this.pending_changes[id]);
      this.update_active_arrays(this.unpack_id(id), this.pending_changes[id]);
    },

    // Function to determine period ordering.
    // Usage: some_period_array.sort(sort_periods)
    sort_periods: function(a, b) {
      let a_month = a.slice(0,6);
      let b_month = b.slice(0,6);
      let a_year = a.slice(-2);
      let b_year = b.slice(-2);
      if (a_year == b_year) {
        return this.period_sort_map[a_month] - this.period_sort_map[b_month];
      } else {
        return a_year.localeCompare(b_year);
      }
    },

    // Update to the next period
    move_to_next_period: function(next_period_name) {
      this.show_modal(
        "The current active period will be changed from \"" + this.current_period + "\" to \"" + this.future_period + "\".",
        "This action should only be taken at the end of the current quarter, \"" + this.current_period + "\". Please be absolutely sure that this is desired.",
        function() {

          let updated_past_periods = this.past_periods.slice(0);
          updated_past_periods.unshift(this.current_period);

          var active_period_changes = {
            CurrentPeriod: this.future_period,
            FuturePeriod:  next_period_name,
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

    gen_next_period_name: function() {
      let new_name = "";
      if (this.current_period.match(/^(winter|spring|summer|autumn)[0-9][0-9]$/g)) {
        let month = this.current_period.match(/(winter|spring|summer|autumn)/g)[0];
        let year  = this.current_period.match(/[0-9][0-9]/g)[0];

        new_name = get_next_month(month);
        new_name += ((month == "autumn") ? (parseInt(year) + 1) : year);
      } else {
        // Some default name
      };
      return new_name;

      function get_next_month(month) {
        switch (month) {
          case "winter":
            return "spring";
          case "spring":
            return "summer";
          case "summer":
            return "autumn";
          case "autumn":
            return "winter"
          default:
            return null;
        }
      }
    },

    select_youth: async function(row) {
      this.selected_youth = this.unpack_id(row.getData().full_id);
    },
  }
}
</script>