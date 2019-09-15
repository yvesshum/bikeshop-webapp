<template>
  <div class="profile_fields">

    <div ref="name_div" v-show="profile!=null">
      <div class="full_name">{{youth_name}}</div>
      <div class="id_parens">(ID: {{youth_id}})</div>
    </div>

    <br />

    <div ref="stats_div" v-show="profile!=null" style="margin:auto;">
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

      <tbody v-for="section in table_sections"><tbody v-if="show_section(section.Name)">

        <tr v-show="edit_mode">
          <td class="section_name" colspan="2"> {{section.Name}}: </td>
        </tr>

        <tr v-for="field in section.Data" v-show="show_container(field)">
          <td v-show="edit_mode">
            <ToggleButton
              onVariant="primary" offVariant="outline-secondary" onText="×" offText="+"
              @Toggle="status => set_row_status(field, status)"
              v-model="fields_used[field]"
              v-show="section.Name != 'Required'"
            ></ToggleButton>
          </td>

          <td :class="{changed_title: edit_mode && is_changed(field) && is_used(field)}">
            {{field}}{{field_types[field] === "Boolean" ? "?" : ":"}}
          </td>

          <td>
            <InputDisplayToggle
              v-show="is_used(field)"
              :defaultValue="local_values[field]"
              :editMode="edit_mode"
              :name="field" :type="field_types[field]"
              @Mounted="i => input_fields[field] = i"
            ></InputDisplayToggle>
          </td>

        </tr>

        <tr><td>&nbsp;</td></tr>

      </tbody></tbody>
    </table>

    <ToggleButton
      v-show="allow_edits" v-model="edit_mode" class="profile_buttons"
      :onVariant="submit_edits_variant" offVariant="primary"
      onText="Submit Edits" offText="Edit Profile Information"
      :switchOff="confirm_save_edits"
    ></ToggleButton>

    <b-button @click="discard_changes()" v-show="edit_mode" class="profile_buttons" :variant="discard_changes_variant">
      Discard Changes
    </b-button>

    <b-button @click="reset_changes()" v-show="edit_mode" class="profile_buttons" :variant="reset_changes_variant">
      Reset All Changes
    </b-button>

    <br />

    <b-modal size="lg" v-model="confirmModalVisible" hide-footer lazy>
      <template slot="modal-title">
          Please Confirm the Following Changes
      </template>
      <div class="d-block text-center">
          <h3>The following changes will be saved:</h3>
          <br />
          <table style="margin: auto;">
            <tr>
              <th></th>
              <th class="change_modal_header">Original Value</th>
              <th class="change_modal_header">New Value</th>
            </tr>
            <tr v-for="(change, field) in changes_list">
              <td class="change_modal_cell_title">
                The field <span class="change_modal_field">{{field}}</span> has been {{change.message}}.
              </td>
              <td class="change_modal_cell_remove">
                <div v-if="change.message !== 'created'">{{change.old_val}}</div>
              </td>
              <td class="change_modal_cell_add">
                <div v-if="change.message !== 'removed'">{{change.new_val}}</div>
              </td>
            </tr>
          </table>
      </div>
      <b-button class="mt-3" block @click="acceptConfirmModal" variant="primary">Confirm</b-button>
      <b-button class="mt-3" block @click="cancelConfirmModal" variant="primary">Cancel</b-button>
    </b-modal>

    <b-modal v-model="noEditsModalVisible" hide-footer>
      <template slot="modal-title">
        No changes have been made.
      </template>
      <b-button class="mt-3" block @click="cancelNoEditsModal" variant="primary">Continue Editing</b-button>
      <b-button class="mt-3" block @click="acceptNoEditsModal" variant="primary">Return to Display</b-button>
    </b-modal>

  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import {STATUS} from '@/components/Status.js';
import {Status} from '@/components/Status.js';
import {forKeyVal} from '@/components/ParseDB.js';
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
        "Apron Color",
        "Work Log",
        "Transfer Log",
        "Order Log",
        "Last Sign In",
      ],
      hour_fields_list: ["Hours Earned", "Hours Spent", "Pending Hours"],

      row_status: null,
      confirmModalVisible: false,
      noEditsModalVisible: false,
      changes_list: null,

      local_values: {},

      input_fields: {},

      fields_used: {},
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

        // Temp var to store all fields in this section
        let Data = [];

        // Loop through name/val pairs in this section
        forKeyVal(data[section], (name, val) => {
          if (!hidden_fields.includes(name)) {
            Data.push(name);
          }
        });

        // Add fields to array of sections
        temp.push({Name, Data});
      };
    },

    field_types: function() {
      if (this.headerDoc == null) return {};

      let temp = new Object();
      let data = this.headerDoc.data();

      Object.keys(data).forEach(section => {
        forKeyVal(data[section], (name, val) => {
          if (!this.hidden_fields.includes(name)) {
            temp[name] = val;
          }
        });
      });

      return temp;
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

    submit_edits_variant: function() {
      if (this.edit_mode) {
        if (this.has_changes_strict) {
          return 'success';
        }
        return 'outline-success';
      }
      return 'outline-secondary';
      // return (this.edit_mode && this.has_changes_strict) ? 'success' : 'outline-secondary';
    },

    discard_changes_variant: function() {
      if (this.edit_mode) {
        if (this.has_changes) {
          return 'danger';
        }
        return 'outline-danger';
      }
      return 'outline-secondary';
    },

    reset_changes_variant: function() {
      return (this.edit_mode && this.has_changes) ? 'warning' : 'outline-warning';
    },

    has_changes: function() {
      return this.check_edits(false);
    },

    has_changes_strict: function() {
      return this.check_edits(true);
    },
  },

  mounted: function() {
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
        this.$set(this.fields_used, key, false);
      });
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

          // Empty string means unused field
          if (field_used(data[key])) {
            this.local_values[key] = data[key];
            this.set_row_status(key, STATUS.USED);
            this.fields_used[key] = true;
          }
        };
      }

      function field_used(field) {
        // TODO: This might have to be more sophisticated for different data types
        return field != "";
      };
    }
  },

  methods: {

    init_row_status(data, field, stat) {
      forKeyVal(data[field], (name, val) => {
        if (!this.hidden_fields.includes(name)) {
          this.row_status.add_vue(this, name, stat);
        }
      });
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

    // Source: https://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
    format_hours: function(field, dp) {
      if (this.local_values == null) return "";
      let hours = this.local_values[field];
      return Number(Math.round(parseFloat(hours + 'e' + dp)) + "e-" + dp).toFixed(dp);
    },

    // Set the status of a given field in the Status object and make appropriate changes
    set_row_status: function(field, new_status) {

      // Optionally parse boolean values into status values for easier usage in Vue HTML
      if (new_status == true) new_status = STATUS.O;
      if (new_status == false) new_status = STATUS.X;

      // Set the status in the Status object, ignoring required and immutable fields
      new_status = this.row_status.set_safe(field, new_status);
    },

    set_edit_mode: function(val) {
      this.edit_mode = val;
    },

    is_used: function(field) {
      return this.fields_used[field];
    },

    is_changed: function(field) {
      let input_field = this.input_fields[field];
      return (input_field == null) ? false : input_field.changed;
    },

    get_input_type: function(field) {
      return 'text';
    },

    // Checks if changes have been made, then looks for user input accordingly
    // If changes, ask to save them; if not, alert user and stay in edit mode 
    // Run by the edit ToggleButton when clicked off edit mode
    confirm_save_edits: function() {
      // Check if edits have been made
      let changed = this.check_edits(true);

      // Check for user input based on results
      if (changed) {
        this.create_confirm_modal();
        this.confirmModalVisible = true;
      }
      else {
        this.noEditsModalVisible = true;
      }

      // Return false to prevent the edit ToggleButton from switching off edit mode just yet
      // If the confirm modal is accepted, it will manually change edit mode instead
      return false;
    },

    //FUNCTION to check if form changes with edit
    check_edits: function(strict) {

      if (this.row_status == null) return false;

      // Check for fields being added/removed which are not empty
      let add_rem = this.row_status.filter([STATUS.ADD, STATUS.REMOVE]);

      if (strict) {
        add_rem = add_rem.filter(key => {
          return !this.input_fields[key].is_blank();
        });
      }

      if (add_rem.length > 0) {
        return true;
      }

      // If no fields to be added/removed, check existing fields for edits
      else {
        let poss = this.row_status.filter([STATUS.USED, STATUS.REQ]);
        let len = poss.length;

        // Use a for loop to break as soon as a change is found
        for (var n = 0; n < len; n++) {
          if (this.is_changed(poss[n])) {
            return true;
          }
        };
      };

      // If we made it this far, there must not be any changes
      return false;
    },

    create_confirm_modal: function() {

      // (Re)initialize the changes_list object
      this.changes_list = new Object();

      // Filter through all fields which might have been changed
      this.row_status.unfilter([STATUS.IMM, STATUS.UNUSED]).forEach(key => {

        // Initialize vars
        let input_field = this.input_fields[key];
        let stat = this.row_status[key];
        let message = null;

        // Mark each field based on how it has been changed (if at all)
        // Order does matter here - blank must supercede ADD and changed
        if (stat == STATUS.REMOVE) {
          message = "removed";
        }
        else if (input_field.is_blank()) {
          message = "left blank";
        }
        else if (stat == STATUS.ADD) {
          message = "created";
        }
        else if (input_field.changed) {
          message = "changed";
        }

        // If message has been set, then a change has been made to this field
        if (message != null) {
          this.changes_list[key] = {
              message,
              new_val: input_field.get_changed_string(),
              old_val: input_field.get_original_string(),
          };
        };
      });
    },



    // FUNCTION that saves edits to firebase, called by check_edits upon
    // determination that actual edits were made
    // Parameters: ID of youth
    save_edits: async function(){
      // creates an object to store edited values
      var changes = new Object();

      // Don't bother with immutable fields, since we're using Firebase update()
      this.row_status.unfilter(STATUS.IMM).forEach(key => {
        let input_field = this.input_fields[key];

        // If field is being used, save its value to the new changes object
        if (this.row_status.is_status(key, STATUS.O) && !input_field.is_blank()) {
          changes[key] = input_field.get_changed_value();
        }

        // If not, save an empty string
        else {
          changes[key] = "";
        }
      });

      console.log("New profile:", changes);

      // Saves edits to firebase
      // db.collection('GlobalYouthProfile').doc(this.youth_id).update(changes).catch(err => {
      //   window.alert("Error: " + err);
      //   return null;
      // });

      // If no error updating database, change the field data on the page
      for (var key in changes) {
        // TODO: Use v-model to link local_values to the input?
        this.local_values[key] = this.input_fields[key].get_changed_value();
      };

      this.discard_empty_fields();
      this.row_status.update();
    },


    discard_empty_fields: function() {
      this.row_status.filter([STATUS.ADD, STATUS.USED]).forEach(key => {
        if (this.input_fields[key].is_blank()) {
          this.set_row_status(key, STATUS.X);
          this.fields_used[key] = false;
        };
      });
    },

    discard_changes: function() {
      // Reset any local fields
      this.reset_changes();

      // Remove any empty fields
      this.discard_empty_fields();

      // Switch out of edit mode
      this.set_edit_mode(false);
    },

    reset_changes: function() {
      this.row_status.reset();
      this.row_status.unfilter(STATUS.IMM).forEach(field => {
        this.input_fields[field].reset();
        this.fields_used[field] = this.row_status.is_status(field, STATUS.O);
      });
    },

    acceptConfirmModal: function() {
      this.confirmModalVisible = false;
      this.save_edits();
      this.set_edit_mode(false);
    },

    cancelConfirmModal: function() {
      this.confirmModalVisible = false;
    },

    cancelNoEditsModal: function() {
      this.noEditsModalVisible = false;
    },

    acceptNoEditsModal: function() {
      this.discard_changes();
      this.noEditsModalVisible = false;
    }
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

  .section_name {
    font-size: 150%;
    font-weight: bold;
    text-align: center;
  }

  .profile_buttons {
    display: inline-block;
    margin: 0px 5px;
    /*outline: 5px solid black;*/
  }

  .change_modal_header {
    border-bottom: 2px solid #000;
  }

  .change_modal_field {
    font-family: "Courier New", Courier, monospace;
    color: fuchsia;
    font-weight: bold;
  }

  .change_modal_cell_title {
    text-align: left;
    width: 50%;
  }

  .change_modal_cell_remove {
    border-top: 1px solid #000;
    width: 25%;
    background-color: #FADBD8;
    color:#7B241C;
  }

  .change_modal_cell_add {
    border-top: 1px solid #000;
    width: 25%;
    background-color: #D5F5E3;
    color:#1D8348;
  }
</style>