<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>

    <h3>Current Quarter (<span ref="current_period_title"></span>)</h3>
    <Table ref="current_youths" :headingdata="this.active_table_headers" :table_data="this.active_table_data" @selectedRow="this.select_youth"></Table>

    <h3>Next Quarter (<span ref="future_period_title"></span>)</h3>
    <Table ref="future_youths" :headingdata="this.future_table_headers" :table_data="this.future_table_data" @selectedRow="this.select_youth"></Table>

    <br />

    <button v-on:click="edit_youth_periods" ref="edit_youth_quarters_button">Edit Active Quarters for <span ref="sel_youth_name"></span></button>
    <form ref="sel_youth_periods" id="sel_youth_periods"></form>

    <br />
    <button v-on:click="save_changes">Save Changes</button>


    <br /><br />

    <button @click="logout">Logout</button>



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

      active_table_headers: ["Name", "ID", "Status"],
      active_table_data: [],

      future_table_headers: ["Name", "ID", "Status"],
      future_table_data: [],

      // Modal variables
      confirm_modal_visible: false,
      modal_title: "",
      modal_body: "",
      accept_modal: null,

      selected_youth: null,
      selected_youth_data: null,
      selected_youth_profile: null,
      edited_youth: null,

      // Misc
      month_list: ["winter", "spring", "summer", "autumn"],

      period_form_inputs: [],

      pending_changes: [],
      cached_youth_data: null,
      cached_youth_profiles: null,
    };
  },

  mounted: async function() {
    this.active_periods_doc = await this.active_periods_db.get();
    let data = this.active_periods_doc.data();

    this.past_periods_db = db.collection("GlobalVariables").doc(data["PastPeriodsDoc"]);

    this.cached_youth_data     = new Object();
    this.cached_youth_profiles = new Object();

    this.current_period = data["CurrentPeriod"];
    this.future_period  = data["FuturePeriod"];
    this.past_periods   = data["PastPeriods"];

    this.current_active_youths = data["CurrentActiveYouths"];
    this.future_active_youths  = data["FutureActiveYouths"];

    this.past_periods_doc_name = data["PastPeriodsDoc"];

    this.create_edit_quarters_form(this.$refs.sel_youth_periods);

    this.display_current_period();
    this.display_future_period();

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
        if (this.cached_youth_profiles[youth.id] != null) {
          console.log("Already retrieved " + youth.full_id);
          this.selected_youth_profile = this.cached_youth_profiles[youth.id];
          this.selected_youth_data    = this.cached_youth_data[youth.id];
        }

        // Youth profile has not been retrieved yet - load it from the database and cache it
        else {
          console.log("Retrieving " + youth.full_id + " from the database...");
          this.selected_youth_profile = await db.collection("GlobalYouthProfile").doc(this.selected_youth.id).get();
          this.cached_youth_profiles[youth.id] = this.selected_youth_profile;
          this.cached_youth_data[youth.id]     = this.selected_youth_profile.data();
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
    logout: function() {
        firebase_app.auth().signOut().then(() => {
            this.$router.replace('login');
        });
    },

    edit_youth_periods: function(event) {
      event.preventDefault();
      this.edited_youth = this.selected_youth;
      this.match_form_to_youth(
        this.selected_youth_data.ActivePeriods,
        this.$refs.sel_youth_periods
      );
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

    create_edit_quarters_form: function(form) {
      form.style.display = "none";

      this.period_form_inputs = [];
      let period_inputs = this.period_form_inputs;

      display_quarter(this.future_period, " (next)");
      display_quarter(this.current_period, " (current)");
      this.past_periods.forEach((element, n) => {display_quarter(element, "")});

      let submit_button = document.createElement("input");
      submit_button.type = "submit";
      submit_button.value = "Submit";
      form.appendChild(submit_button);

      form.onsubmit = function(event) {
        event.preventDefault();
        let checked_periods = [];
        this.period_form_inputs.forEach((element, n) => {
          if (element.checkbox.checked) {
            checked_periods.push(element.quarter);
          };
        });
        form.style.display = "none";

        this.cached_youth_data[this.edited_youth.id]["ActivePeriods"] = checked_periods;

        this.pending_changes[this.edited_youth.id] = checked_periods;
        this.update_active_arrays(this.edited_youth, checked_periods);

      }.bind(this);

      function display_quarter(quarter, extra_text) {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = quarter;
        checkbox.style.display = "inline";

        let text = document.createElement("p");
        text.innerHTML = "&nbsp;" + quarter + extra_text;
        text.style.display = "inline";

        form.appendChild(checkbox);
        form.appendChild(text);
        form.appendChild(document.createElement("br"));

        period_inputs.push({quarter, checkbox});
      }
    },

    match_form_to_youth: function(youth_periods, form) {
      this.period_form_inputs.forEach((element, n) => {
        element.checkbox.checked = youth_periods.includes(element.quarter);
      });

      form.style.display = "";
    },

    update_active_arrays: function(youth, periods) {

      this.current_active_youths = toggle_youth_in_array(this.current_active_youths, this.current_period);
      this.future_active_youths  = toggle_youth_in_array(this.future_active_youths,  this.future_period);

      this.display_current_period();
      this.display_future_period();

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

    check_changes: function() {
      let active = !objects_equal(this.get_default_changes(), this.active_periods_doc.data());
      let previous = false;

      // TODO: Track a list of edited youth/ids, and use that to check for changes in past data?
      
      return {active, previous};

      function objects_equal(a, b) {
        let a_keys = Object.getOwnPropertyNames(a);
        let b_keys = Object.getOwnPropertyNames(b);

        if (a_keys.length != b_keys.length) return false;

        for (var i = 0; i < a.length; i++) {
          if (a[a_keys[i]] != b[a_keys[i]]) {
            return false;
          };
        };

        return true;
      };
    },

    save_changes: function() {
      let changes = this.get_default_changes();
      let is_changed = this.check_changes();

      if (!is_changed.active && !is_changed.previous) {
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
    update_database: function(changes) {

      if (changes == null) {
        changes = this.get_default_changes();
      }

      console.log("Changes to be saved: ", changes);
      this.active_periods_db.update(changes).then(
        // Success
        function() {
          window.alert("Changes saved successfully!");
          // Reset any tracking variables
          return null;
        },
        // Failure
        function(err) {
          window.alert("Error updating ActivePeriods document: " + err);
          return err;
        }
      );
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

    // Display the current period on the page
    display_current_period: function() {
      this.$refs.current_period_title.innerHTML = this.current_period;

      this.active_table_data = [];

      for (var n in this.current_active_youths) {
        let youth = this.unpack_id(this.current_active_youths[n]);
        let status = (youth.is_rolling_over()) ? "Rolling Over" : "n/a";
        this.active_table_data.push({
          Name: youth.name,
          ID: youth.id,
          Status: status
        });
      };
    },

    // Display the next period on the page
    display_future_period: function() {
      this.$refs.future_period_title.innerHTML  = this.future_period;

      this.future_table_data = [];

      for (var n in this.future_active_youths) {
        let youth = this.unpack_id(this.future_active_youths[n]);
        let status = (youth.is_rolling_over()) ? "Rolling Over" : "New";
        this.future_table_data.push({
          Name: youth.name,
          ID: youth.id,
          Status: status
        });
      };
    },

    // Display the previous periods on the page
    display_past_periods: function() {
      
    },

    // Set the youth with the given ID to active or not in the given period
    set_youth_status: function(id, period, status) {
      switch (period) {
        case this.current_period:
          console.log("Adding youth " + id + " to the current period!");
          break;
        case this.next_period:
          console.log("Adding youth " + id + " to the next period!");
          break;
        default:
          console.log("Adding youth " + id + " to period " + period + "!");
          break;
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
      this.selected_youth = this.unpack_id(row._row.data.Name + " " + row._row.data.ID);
      let id = row._row.data.ID;
    },
  }
}
</script>