<template>
  <div class="profile_fields">

    <div id="name_div" v-show="profile!=null">
      <div class="full_name">{{youth_name}}</div>
      <div class="id_parens">(ID: {{youth_id}})</div>
    </div>

    <br />

    <div id="stats_div" v-show="profile!=null" style="margin:auto;">
      <div class="hours_div" v-for="item in hour_fields">
        <p class="hours_num">
          <span class="hours_whole">{{item.Whole}}</span>
          <span class="hours_decimal">.{{item.Decimal}}</span>
        </p>
        <p class="hours_name"> {{item.Name}} </p>
      </div>
    </div>

    <br />

    <table id="fields_table" ref="fields_table" v-show="profile!=null">

      <tbody v-for="section in table_sections" v-show="show_section(section.Name)">

        <caption v-show="edit_mode"> {{section.Name}}: </caption>

        <tr v-for="field in section.Data" v-show="show_container(field)" :id="field+'_container'">
          <td :id="field+'_remove_button_container'" v-show="edit_mode">
            <ToggleButton
              onVariant="outline-danger" offVariant="outline-success" onText="×" offText="+"
              @Toggle="status => set_row_status(field, status)"
              v-show="section.Name != 'Required'"
              :id="field+'_remove_button'" :ref="field+'_remove_button'"
            ></ToggleButton>
          </td>

          <td :id="field+'_title'" :class="{changed_title: edit_mode && is_changed(field)}">{{field}}:</td>

          <td :id="field+'_display_container'">
            <InputDisplayToggle
              :id="field+'_field'" :ref="field+'_field'" :name="field"
              v-show="is_used(field)"
              :defaultValue="local_values[field]"
              :editMode="edit_mode"
            ></InputDisplayToggle>
          </td>

        </tr>

        <tr><td>&nbsp;</td></tr>

      </tbody>
    </table>

    <button ref="edit_profile" v-on:click="toggle_edit_mode()">Edit!</button>
    <button ref="discard_changes" v-on:click="discard_changes()" v-show="edit_mode">
      Discard Changes
    </button>
    <button ref="reset_changes" v-on:click="reset_changes()" v-show="edit_mode">
      Reset All Changes
    </button>

    <br />

    <b-modal v-model="confirmModalVisible" hide-footer lazy>
      <template slot="modal-title">
          Please Confirm the Following Changes
      </template>
      <div class="d-block text-center">
          <h3>The following changes will be saved:</h3>
          <p v-for="(change, field) in this.changes_list">
            The field <code>{{field}}</code> has been {{changes_list[field].message}}<code>{{changes_list[field].new_val}}</code>.
          </p>
      </div>
      <b-button class="mt-3" block @click="acceptConfirmModal" variant="primary">Confirm</b-button>
      <b-button class="mt-3" block @click="cancelConfirmModal" variant="primary">Cancel</b-button>
    </b-modal>

  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import {STATUS} from '@/components/Status.js';
import {Status} from '@/components/Status.js';
import ToggleButton from '@/components/ToggleButton';
import InputDisplayToggle from '@/components/InputDisplayToggle';

export default {
  name: 'profile_fields',
  props: ["profile", "headerDoc", "edit", "showOptionalFields", "hideFields"],
  components: {
    ToggleButton,
    InputDisplayToggle
  },

  data: function() {
    return {
      edit_mode: false,
      specially_displayed_fields: [
        "First Name",
        "Last Name",
        "Hours Earned",
        "Hours Spent",
        "Pending Hours",
      ],
      hidden_fields: [
        "Apron Level",
        "Work Log",
        "Transfer Log",
        "Order Log",
        "Last Sign In",
      ],
      hour_fields_list: ["Hours Earned", "Hours Spent", "Pending Hours"],

      row_status: null,
      confirmModalVisible: false,
      changes_list: null,

      local_values: {},
    }
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

    // Allow "showOptionalFields" to be passed in as just a tag, or with a bound value
    show_optional_fields: function() {
      if (typeof this.showOptionalFields == "string") {
        return true;
      } else {
        return !!this.showOptionalFields;
      }
    },

    table_sections: function() {
      if (this.headerDoc == null) return [];

      let data = this.headerDoc.data();
      let temp = [];
      let hidden_fields = this.hidden_fields;
      
      make_section("Required", "required");
      make_section("", "hidden");
      
      if (this.show_optional_fields) {
        make_section("Optional", "optional");
      }

      return temp;

      function make_section(Name, section) {
        temp.push({ Name, Data: data[section].filter( k => !hidden_fields.includes(k) )} );
      };
    },

    hour_fields: function() {
      let temp = [];

      this.hour_fields_list.forEach(title => {
        let hours = this.format_hours(title, 2);
        temp.push({
          Name:    title,
          Whole:   hours.substring(0,hours.indexOf('.')),
          Decimal: hours.substring(hours.indexOf('.')+1),
        });
      });

      return temp;
    },

    youth_name: function() {
      if (this.local_values == null) return "";
      let first_name = this.local_values["First Name"];
      let last_name =  this.local_values["Last Name"];
      return `${first_name} ${last_name}`;
    },

    youth_id: function() {
      if (this.profile == null) return "";
      return this.profile.id;
    },
  },

  mounted: function() {
    if (!this.allow_edits) {
      this.$refs.edit_profile.style.display = "none";
    };

    // TODO: Make a computed value to allow dynamic field hiding?
    if (this.hideFields != null) {
      this.hidden_fields = [...this.hidden_fields, ...this.hideFields];
    };
  },

  watch: {

    headerDoc: function(new_header) {

      let data = new_header.data();

      this.row_status = new Status();

      this.init_row_status(data, "required", STATUS.REQ);
      this.init_row_status(data, "hidden",   STATUS.IMM);
      if (this.show_optional_fields) {
        this.init_row_status(data, "optional", STATUS.UNUSED);
      }

      // Have to use Vue.$set to make the new properties reactive (dynamic updates)
      this.row_status.keys().forEach(key => {
        this.$set(this.local_values, key, null);
      });
    },

    
    edit_mode: function(val) {

      if (!this.allow_edits) return;

      // Go into edit mode
      if (this.edit_mode) {
        this.$refs.edit_profile.innerHTML = "Submit Edits!";
      }

      // Reset to display mode
      else {
        this.$refs.edit_profile.innerHTML = "Edit!";
      };
    },

    profile: function(doc) {

      // Clear the old data from the screen
      // TODO - confirm change profile modal if unsaved changes?
      this.row_status.set_all_safe(STATUS.UNUSED);
      Object.keys(this.local_values).forEach(key => {
        this.local_values[key] = null;
      });

      // If a profile was passed, display it to the screen
      if (doc != null) {

        // Init vars
        var data = doc.data();        

        for (var key in data) {
          if (this.hidden_fields.includes(key)) continue;

          if (this.row_status[key] == null) {
            // TODO: Handle non-standard field - Maybe STATUS.TEMP and STATUS.TEMP_REMOVE?
          }

          this.local_values[key] = data[key];
          this.set_row_status(key, STATUS.USED);
        };

        // this.row_status.keys().filter(k => !Object.keys(data).includes(k)).forEach(key => {
        //   console.log("Key " + key + " found in row_status but not data.");
        //   console.log(this.local_values[key]);
        // });
      }
    }
  },

  methods: {

    init_row_status(data, field, stat) {
      data[field]
        .filter( k => !this.hidden_fields.includes(k) )
        .forEach(key => this.row_status.add_vue(this, key, stat));
    },

    show_section: function(section) {
      return !(this.edit_mode && section == '');
    },

    show_container: function(key) {
      if (this.edit_mode) {
        return true;
      }
      else {
        return (this.row_status.is_status(key, STATUS.O) && !this.specially_displayed_fields.includes(key));
      }
    },

    format_hours: function(field, dp) {
      if (this.local_values == null) return "";
      let hours = this.local_values[field];
      return Number(Math.round(parseFloat(hours + 'e' + dp)) + "e-" + dp).toFixed(dp);
    },

    set_row_status: function(key, new_status) {

      if (new_status == true) new_status = STATUS.O;
      if (new_status == false) new_status = STATUS.X;

      new_status = this.row_status.set_safe(key, new_status);

      let remove_button =  this.$refs[key + "_remove_button"][0];

      // Perform any extra operations
      switch (new_status) {

        case STATUS.REQ:
        case STATUS.IMM:
          break;

        // Field is currently being used in the profile
        case STATUS.USED:
        case STATUS.ADD:
          remove_button.set_active(true);
          break;

        // Field is not currently being used in the profile
        case STATUS.UNUSED:
        case STATUS.REMOVE:
          remove_button.set_active(false);
          break;

        default:
          console.log("Error: Row cannot be set to status \"" + new_status + "\".");
      };
    },

    // Toggles between edit mode and display mode
    toggle_edit_mode: function() {
      if (this.edit_mode) {
        this.check_edits();
      } else {
        this.edit_mode = !this.edit_mode;
      };
    },

    is_used: function(field) {
      return this.row_status.is_status(field, STATUS.O);
    },

    is_changed: function(field) {
      let temp = this.$refs[field + "_field"];
      if (temp == null) return false;
      return temp[0].changed;
    },

    get_input_type: function(field) {
      return 'text';
    },

    //FUNCTION to check if form changes with edit
    //Parameters: called upon form submission
    check_edits: function(event) {
      
      var n;
      var c = false;

      // Check for any fields to be added/removed
      if (this.row_status.filter([STATUS.ADD, STATUS.REMOVE]).length > 0) {
        console.log(this.row_status.filter([STATUS.ADD, STATUS.REMOVE]));
        c = true;
      }

      // If no fields to be added/removed, check existing fields for edits
      else {
        let poss = this.row_status.filter([STATUS.USED, STATUS.REQ]);
        let len = poss.length;
        for (var n = 0; n < len; n++) {
          // console.log("Checking key " + poss[n] + " input: ", input);
          if (this.is_changed(poss[n])) {
            c = true;
            break;
          }
        };
      };

      if (c) {
        this.create_confirm_modal();
        this.confirmModalVisible = true;
      } else {
        alert("No edits have been made");
      }
    },

    create_confirm_modal: function() {
      this.changes_list = new Object();

      this.row_status.forEach(function(key) {
        let input_field = this.$refs[key + "_field"][0];

        switch(this.row_status[key]) {
          // If field is unused or immutable, it won't have any changes to report
          case STATUS.UNUSED:
          case STATUS.IMM:
            break;

          case STATUS.REMOVE:
            this.changes_list[input_field.name] = {
              message: "removed",
              new_val: "",
            };
            break;

          case STATUS.REQ:
          case STATUS.USED:
            if (input_field.changed) {
              this.changes_list[key] = {
                message: "set to ",
                new_val: input_field.get_edit_value(),
              };
            };
            break;

          // Data field is being added: Save its value to the new profile
          case STATUS.ADD:
            if (input_field.changed) {
              this.changes_list[key] = {
                message: "created and set to ",
                new_val: input_field.get_edit_value(),
              };
            };
            break;

          // Catchall case
          default:
            console.log("Unknown status \"" + this.row_status[key] + "\" for key \"" + key + "\"");
        };
      }.bind(this));
    },



    // FUNCTION that saves edits to firebase, called by check_edits upon
    // determination that actual edits were made
    // Parameters: ID of youth
    save_edits: async function(){
      // creates an object to store edited values
      var changes = new Object();

      // Add all used fields to the changes object
      this.row_status.filter(STATUS.O).forEach(key => {
        let input_field = this.$refs[key + "_field"][0];
        changes[key] = input_field.get_edit_value();
      });

      // Add all unused fields as empty strings
      this.row_status.filter(STATUS.X).forEach(key => {
        changes[key] = "";
      });

      console.log("New profile:", changes);

      // Saves edits to firebase
      // db.collection('GlobalYouthProfile').doc(this.youth_id).update(changes).catch(err => {
      //   window.alert("Error: " + err);
      //   return null;
      // });

      // If no error updating database, change the field data on the page
      for (var key in changes) {
        // TODO: Just store these in an object when they're created, or something
        // TODO: Use v-model to link local_values to the input?
        let input_field = this.$refs[key + "_field"][0];
        this.local_values[key] = input_field.get_edit_value();
      };

      this.row_status.update();
    },


    discard_changes: function() {
      this.edit_mode = !this.edit_mode;
    },

    reset_changes: function() {
      this.row_status.reset();
      this.row_status.forEach(field => {
        this.$refs[field + "_field"][0].reset();
        this.$refs[field+'_remove_button'][0].set_active(this.row_status.is_status(field, STATUS.O));
      });
    },

    acceptConfirmModal: function() {
      this.confirmModalVisible = false;
      this.save_edits();
      this.edit_mode = false;
    },

    cancelConfirmModal: function() {
      this.confirmModalVisible = false;
    },
  }
}
</script>

<style>
  .full_name {
    font-size: 2em;
    margin-bottom: 0;
  }

  .id_parens {
    color: gray;
    font-size: 0.75em;
  }

  #fields_table {
    margin: auto;
    text-align: left;
  }

  .to_be_removed {
    color: gray;
    font-style: oblique;
  }

  .changed_title {
    font-weight: bold;
  }

  /* The div element containing each hours field (number + name) */
  .hours_div {
    display: inline-block;
    text-align: center;
    padding: 0px 15px;
  }

  /* The div element containing the entire hour number */
  .hours_num {
    font-weight: bold;
    font-family: "Courier New", Courier, monospace;
    margin: 0px;
  }

  /* The whole part of the hour number (before the decimal place) */
  .hours_whole {
    font-size: 175%;
  }

  /* The decimal part of the hour number (after the decimal place) */
  .hours_decimal {
    font-size: 1.2em;
  }

  /* The name labelling the hour number */
  .hours_name {

  }
</style>