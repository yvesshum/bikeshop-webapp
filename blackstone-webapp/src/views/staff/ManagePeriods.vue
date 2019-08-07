<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>

    <h3 ref="current_period_title"></h3>
    <ul ref="current_youths"></ul>

    <h3 ref="future_period_title"></h3>
    <ul ref="future_youths"></ul>

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

export default {
  name: 'manage_periods',
  components: {
    TopBar
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

      // Modal variables
      confirm_modal_visible: false,
      modal_title: "",
      modal_body: "",
      accept_modal: null,

      // Misc
      month_list: ["winter", "spring", "summer", "autumn"],
    };
  },

  mounted: async function() {
    this.active_periods_doc = await this.active_periods_db.get();
    let data = this.active_periods_doc.data();

    this.past_periods_db = db.collection("GlobalVariables").doc(data["PastPeriodsDoc"]);

    this.current_period = data["CurrentPeriod"];
    this.future_period  = data["FuturePeriod"];
    this.past_periods   = data["PastPeriods"];

    this.current_active_youths = data["CurrentActiveYouths"];
    this.future_active_youths  = data["FutureActiveYouths"];

    this.display_current_period();
    this.display_future_period();
  },

  methods: {
    logout: function() {
        firebase_app.auth().signOut().then(() => {
            this.$router.replace('login');
        });
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

    // Save changes to Firebase
    // Returns null on success, and error on failure
    update_database: function(changes) {

      if (changes == null) {
        changes = {
          CurrentPeriod: this.current_period,
          FuturePeriod:  this.future_period,
          PastPeriods:   this.past_periods,
          CurrentActiveYouths: this.current_active_youths,
          FutureActiveYouths:  this.future_active_youths,
          PastPeriodsDoc: this.active_periods_doc.data()["PastPeriodsDoc"],
        };
      }

      console.log("Changes to be saved: ", changes);

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

      for (var n in this.current_active_youths) {
        let item = document.createElement("li");
        let youth = this.unpack_id(this.current_active_youths[n]);
        item.innerHTML = youth.name + " (ID: " + youth.id + ")";
        this.$refs.current_youths.appendChild(item);
      };
    },

    // Display the next period on the page
    display_future_period: function() {
      this.$refs.future_period_title.innerHTML  = this.future_period;

      for (var n in this.future_active_youths) {
        let item = document.createElement("li");
        let youth = this.unpack_id(this.current_active_youths[n]);
        item.innerHTML = youth.name + " (ID: " + youth.id + ")";
        if (youth.is_rolling_over()) item.innerHTML += " (Rolling over)";
        this.$refs.future_youths.appendChild(item);
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
  }
}
</script>