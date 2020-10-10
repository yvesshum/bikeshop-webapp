<template>
  <div class="profile_fields">

    <div ref="name_div" v-show="profile!=null && hideTitle!=true">
      <div class="full_name">{{youth_name}}</div>
      <div class="id_parens">(ID: {{youth_id}})</div>
    </div>

    <br />

    <table id="fields_table" ref="fields_table" v-show="profile!=null" class="table table-bordered" style="max-width: 95%">

      <tbody v-for="section in table_sections_show">

        <tr v-for="field in section.Data" v-show="show_container(field)">
          <td style="width: 35%">
            {{field}}{{field_types[field] === "Boolean" ? "?" : ""}}
            <b-badge v-show="needs_warning(field) && disableWarnings != true" pill variant="warning" class="warning_icon" v-b-tooltip.hover.html="warning_msg(field)">!</b-badge>
          </td>
          <td style="width: 65%">
            <ProfileFieldDisplay v-model="local_values[field]" :type="field_types[field]"></ProfileFieldDisplay>
          </td>
        </tr>

      </tbody>
    </table>

    <b-button v-show="allow_edits" variant="primary" @click="set_edit_mode(true)">
      Edit Profile Information
    </b-button>

    <b-modal size="lg" v-model="show_edit_modal" no-close-on-backdrop no-close-on-esc hide-header-close>
      <template slot="modal-header">
        <h2>Edit Profile for {{youth_name}} <span class="id_parens">(ID: {{youth_id}})</span></h2>
      </template>
      <div class="d-block text-center">

        <table id="fields_table" ref="fields_table" v-show="profile!=null" class="table table-bordered" style="max-width: 95%">

          <tbody v-for="section in table_sections_show">

            <tr v-if="show_section(section.Name)">
              <td class="section_name" colspan="3"> {{section.Name}}: </td>
            </tr>

            <tr v-if="show_section(section.Name) && !is_protected(field)" v-for="field in section.Data">
              <td style="margin: auto; padding: 3px;">
                <ToggleButton
                  onVariant="primary" offVariant="outline-secondary" onText="×" offText="+"
                  @Toggle="status => set_row_status(field, status)"
                  v-model="fields_used[field]"
                  v-show="show_x_button(section.Name)"
                ></ToggleButton>
              </td>

              <td :class="{changed_title: is_changed(field) && is_used(field)}">
                {{field}}{{field_types[field] === "Boolean" ? "?" : ""}}
              </td>

              <td style="padding: 3px;">
                <SpecialInputReset
                  v-show="section.Name == 'Required' || is_used(field)"
                  :defaultValue="local_values[field]"
                  :name="field" :type="field_types[field]"
                  @Mounted="i => input_fields[field] = i"
                ></SpecialInputReset>
              </td>

            </tr>

          </tbody>
        </table>

      </div>

      <template slot="modal-footer">
        <DiscardResetSave
          :hasChanges="has_changes_strict" :hasUnsaveableChanges="has_changes"
          @discard="confirm_edits('discard')" @reset="reset_changes" @save="confirm_edits('save')"
        ></DiscardResetSave>
      </template>
    </b-modal>

    <br />

    <b-modal size="lg" v-model="confirmModalVisible" @ok="accept_confirm_modal">
      <template slot="modal-header">
          <h3>Confirm Changes</h3>
      </template>

      You are about to <b>{{confirm_mode}}</b> the following changes:

      <br />
      <table style="margin: auto;">
        <tr class="change_modal_header">
          <th></th>
          <th>Original Value</th>
          <th>New Value</th>
        </tr>

        <tr v-for="(change, field) in changes_list">
          <td class="change_modal_cell_title">
            The {{field_type(field)}}field
            <span class="change_modal_field">{{field}}</span>
            will <span v-if="confirm_mode == 'discard' && change.message != 'left blank'">not</span> be
            {{change.message}}.
          </td>
          <td :class="change_modal_cell_type_old">
            <div v-if="change.message !== 'created'">{{change.old_val}}</div>
          </td>
          <td :class="change_modal_cell_type_new">
            <div v-if="change.message !== 'removed'">{{change.new_val}}</div>
          </td>
        </tr>

        <tr class="change_modal_footer">
          <td></td>
          <td v-if="confirm_mode == 'save'"></td>
          <td style="text-align: center; font-style: oblique;"><b>&uarr;</b><br/>This column will be kept</td>
          <td v-if="confirm_mode == 'discard'"></td>
        </tr>
      </table>

      <div v-if="blank_required_fields.length > 0">
        <br />
        <b-button block squared variant="warning"><h3>Warning: Blank Required Fields</h3></b-button>
        <br />
        <p>The following fields are required for every youth profile, but have not been set for {{youth_name}}.  This is most likely due to a change in which fields are required, or is the result of an out-of-date profile.</p>

        <div style="margin: auto; text-align: center; font-size: 1.25em;">
          {{blank_required_fields.toString().replace("\"", "").replace(",",", ")}}
        </div>
        <br />

        <p>Please fill in these fields if at all possible. Certain features of this site, <b>including the Emergency Contact page</b>, may not work properly if these are not filled.</p>
      </div>

      <div v-if="temp_fields.length > 0">
        <br />
        <b-button block squared variant="warning"><h3>Warning: Non-Standard Fields</h3></b-button>
        <br />
        <div v-if="unremoved_temp_fields.length > 0">
          This profile contains the following non-standard fields:</p>
          <table style="margin: auto; text-align: center; min-width: 80%">
            <tr class="change_modal_header">
              <th style="border-right: 1px solid #000">
                Field Name
              </th>
              <th>Field Value</th>
            </tr>
            <tr v-for="field in unremoved_temp_fields">
              <td class="change_modal_cell_temp" style="border-right: 1px solid #000">
                {{field}}
              </td>
              <td class="change_modal_cell_temp">
                {{
                  (changes_list != null && Object.keys(changes_list).includes(field))
                    ? changes_list[field].new_val
                    : local_values[field]
                }}
              </td>
            </tr>
          </table>
          <br />
          <p>Non-standard fields are preserved for backwards-compatibility only, and should be removed if at all possible. As such, it will not be possible to add a non-standard field back to a profile after it has been removed.</p>
          <p>Please consider merging the information in the above fields into standard fields.</p>
        </div>
      </div>
    </b-modal>


    <b-modal v-model="noEditsModalVisible" hide-footer>
      <template slot="modal-header">
        No changes have been made.
      </template>
      <b-button class="mt-3" block @click="noEditsContinue" variant="primary">
        Continue Editing
      </b-button>
      <b-button class="mt-3" block @click="noEditsReturn" variant="primary">
        Return to Display
      </b-button>
    </b-modal>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

import {Status} from '@/scripts/Status.js';
import {forKeyVal} from '@/scripts/ParseDB.js';

import ToggleButton from '@/components/ToggleButton';
import SpecialInputReset from '@/components/SpecialInputReset';
import ProfileFieldDisplay from '@/components/ProfileFieldDisplay';
import PeriodsClassesDisplay from '@/components/PeriodsClassesDisplay';
import DiscardResetSave from '@/components/DiscardResetSave';


// Fields which should not be editable through the youth profile page/popup
// The fields on this list which may need to be changed are handled on other pages or
// in other components.
// These fields will not be loaded when the profile is.
const IgnoredFields = [

  // Apron Items handled in the Apron Bar
  "Apron Color", "Apron Skills",

  // Logs handled in their own pages and displayed in ProfileItemLogs
  "Work Log", "Transfer Log", "Order Log",

  // Registration items shouldn't be edited here
  "Registration Period", "Essay", "New or Returning",

  // Period and Class information handled in ManagePeriods
  "Class", "ActivePeriods",
];


// Fields that should be loaded, but should not be editable in the popup modal.
const ProtectedFields = [

  // Youths' active hours handled by the hour tracking system
  "Hours Spent", "Pending Hours", "Hours Earned",
];


// Fields that should be loaded, but should not display in the main table
const SpeciallyDisplayedFields = [

  // Youth name displayed in bold on top of the page
  "First Name", "Last Name",

  // Youths' hours displayed in large numbers
  "Hours Earned", "Hours Spent", "Pending Hours",
];

// Fields that are both protected and specially displayed will be loaded, but that's about it

// Conceptually, Protected Fields are ones you want to display but not edit, while Specially Displayed Fields are ones you want to be editable but not display (or handle the display of separately from the main table).

// The only thing is, if a field is both, instead of being both displayed and editable, it's neither displayed nor editable. This is good for regulated fields like the youth's hours, which we want to highlight in the display, but don't want to allow any edits to here.


export default {
  name: 'profile_fields',
  props: ["profile", "headerDoc", "edit", "showOptionalFields", "ignoreFields", "disableWarnings", "hideTitle"],
  components: {
    ToggleButton,
    SpecialInputReset,
    ProfileFieldDisplay,
    PeriodsClassesDisplay,
    DiscardResetSave,
  },

  data: function() {
    return {
      // Track whether currently in edit mode
      edit_mode: false,

      temp_fields: [],

      row_status: null,
      confirmModalVisible: false,
      noEditsModalVisible: false,
      changes_list: null,
      confirm_mode: null,

      local_values: {},

      input_fields: {},

      fields_used: {},

      show_edit_modal: false,
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

    // Collate hard-coded ignored fields with any fields passed in via prop
    ignored_fields: function() {
      if (this.ignoreFields != null) {
        return [...IgnoredFields, ...this.ignoreFields];
      } else {
        return IgnoredFields;
      }
    },

    table_sections: function() {
      if (this.headerDoc == null) return [];

      let data = this.headerDoc.data();
      let temp = [];

      make_section.call(this, "Required", "required");
      make_section.call(this, "Hidden", "hidden");
      
      if (this.show_optional_fields) {
        make_section.call(this, "Optional", "optional");
      }

      temp.push({Name: "Non-Standard", Data: this.temp_fields});

      return temp;

      function make_section(Name, section) {

        // Temp var to store all fields in this section
        let Data = [];

        // Save all non-hidden fields in this section to the result
        forKeyVal(data[section], (name, val) => {
          if (!this.is_ignored(name)) {
            Data.push(name);
          }
        });

        // Add fields to array of sections
        temp.push({Name, Data});
      };
    },

    table_sections_show: function() {
      return this.table_sections.filter(section => {
        return this.show_section(section);
      });
    },

    unremoved_temp_fields: function() {
      if (this.changes_list == null) {
        return this.temp_fields;
      }
      return this.temp_fields.filter(k =>
        this.changes_list[k] == null || this.changes_list[k].message != 'removed'
      );
    },

    blank_required_fields: function() {
      if (this.row_status == undefined) return [];
      return this.row_status.filter(Status.REQ).filter(field => {
        return this.local_values[field] == undefined;
      });
    },

    field_types: function() {
      if (this.headerDoc == null) return {};

      let temp = new Object();
      let data = this.headerDoc.data();

      Object.keys(data).forEach(section => {
        forKeyVal(data[section], (name, val) => {
          if (!this.is_ignored(name)) {
            temp[name] = val;
          }
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

    active_periods: function() {
      if (this.profile == null) return [];
      return this.profile.data()["ActivePeriods"];
    },

    has_changes: function() {
      return this.check_edits(false);
    },

    has_changes_strict: function() {
      return this.check_edits(true);
    },

    change_modal_cell_type_old: function() {
      return this.confirm_mode == 'save'
        ? 'change_modal_cell_remove'
        : 'change_modal_cell_add';
    },

    change_modal_cell_type_new: function() {
      return this.confirm_mode == 'save'
        ? 'change_modal_cell_add'
        : 'change_modal_cell_remove';
    },
  },

  mounted: function() {

    // Load the headers from the prop if it's set
    if (this.headerDoc != undefined) {
      this.load_header_doc(this.headerDoc);
    };

    // Load the profile from the prop if it's set
    if (this.profile != undefined) {
      this.load_profile(this.profile);
    };
  },

  watch: {

    headerDoc: function(new_header) {
      this.load_header_doc(new_header);
    },

    profile: function(doc) {
      this.load_profile(doc);
    },

    show_edit_modal: function(new_val) {
      this.edit_mode = new_val;
    }
  },

  methods: {

    init_row_status(data, field, stat) {
      forKeyVal(data[field], (name, val) => {
        if (this.is_protected(name)) {
          this.row_status.add_vue(this, name, Status.IMM);
        }
        else if (!this.is_ignored(name)) {
          this.row_status.add_vue(this, name, stat);
        }
      });
    },

    show_section: function(section) {
      if (section == "Non-Standard") return this.temp_fields.length > 0;
      return section != '';
    },

    show_container: function(key) {
      if (this.row_status == null) return false;
      return (
        (this.row_status.is_status(key, Status.U) || this.row_status.is_status(key, Status.USE_T))
        && !this.is_specially_displayed(key)
      );
    },

    show_x_button: function(section) {
      return section == "Optional" || section == "Non-Standard";
    },

    load_header_doc: function(new_header) {
      let data = new_header.data();

      this.row_status = new Status();

      this.init_row_status(data, "required", Status.REQ);
      this.init_row_status(data, "hidden",   Status.NOT);
      if (this.show_optional_fields) {
        this.init_row_status(data, "optional", Status.NOT);
      }

    },

    load_profile: function(doc) {
      // If for some reason the row_status hasn't been initialized yet, do so now
      if (this.row_status == null) this.row_status = new Status();

      // Clear the old data from the screen
      this.row_status.set_all_safe(Status.NOT);
      Object.keys(this.local_values).forEach(key => {
        // Set to undefined rather than deleting to keep it reactive w Vue
        this.local_values[key] = undefined;
        this.fields_used[key] = false;
      });

      // Delete temporary fields from previous profile (if applicable)
      this.temp_fields.forEach(field => {
        this.row_status.delete(field);
      });
      this.temp_fields = [];

      // If a profile was passed, display it to the screen
      if (doc != null) {

        // Init vars
        var data = doc.data();        

        for (var key in data) {
          if (this.is_ignored(key)) continue;

          if (field_used(data[key])) {
            if (this.row_status[key] == null) {
              this.temp_fields.push(key);
              this.row_status.add_vue(this, key, Status.USE_T);
            }

            // Empty string means unused field
            else {
              this.set_row_status(key, Status.USE);
            }

            // Have to use Vue.$set to make the new properties reactive (dynamic updates)
            this.$set(this.local_values, key, data[key]);
            this.$set(this.fields_used, key, true);
          }
        };
      }

      function field_used(field) {
        // TODO: This might have to be more sophisticated for different data types
        return field !== null && field !== undefined && field !== "";
      };
    },

    // Set the status of a given field in the Status object and make appropriate changes
    set_row_status: function(field, new_status) {

      // Optionally parse boolean values into status values for easier usage in Vue HTML
      if (new_status == true) new_status = Status.O;
      if (new_status == false) new_status = Status.X;

      // Set the status in the Status object, ignoring required and immutable fields
      new_status = this.row_status.set_safe(field, new_status);
    },

    set_edit_mode: function(val) {
      this.edit_mode = val;
      this.show_edit_modal = val;
    },

    is_used: function(field) {
      return this.fields_used[field];
    },

    // Whether the field is ignored - see IgnoredFields above
    is_ignored: function(field) {
      return this.ignored_fields.includes(field);
    },

    // Whether the field is protected - see ProtectedFields above
    is_protected: function(field) {
      return ProtectedFields.includes(field);
    },

    // Whether the field is specially displayed - see SpeciallyDisplayedFields above
    is_specially_displayed: function(field) {
      return SpeciallyDisplayedFields.includes(field);
    },

    is_changed: function(field) {
      let input_field = this.input_fields[field];
      return (input_field == null) ? false : input_field.changed;
    },

    needs_warning: function(field) {
      return this.unremoved_temp_fields.includes(field) || this.blank_required_fields.includes(field);
    },

    warning_msg: function(field) {
      if (this.blank_required_fields.includes(field)) {
        return "This field is required, but no value was found.";
      }
      else if (this.unremoved_temp_fields.includes(field)) {
        return "This is a non-standard field.";
      }
      return "";
    },

    // Checks if changes have been made, then looks for user input accordingly
    // If changes, ask to save them; if not, alert user and stay in edit mode
    // Run by the edit ToggleButton when clicked off edit mode
    confirm_edits: function(mode) {
      // Check if edits have been made
      let changed = this.check_edits(true);

      this.confirm_mode = mode;

      // Check for user input based on results
      if (changed) {
        this.create_confirm_modal();
        this.confirmModalVisible = true;
      }
      else if (mode == "save") {
        this.noEditsModalVisible = true;
      }
      else {
        this.set_edit_mode(false);
      }

    },

    //FUNCTION to check if form changes with edit
    check_edits: function(strict) {

      if (this.row_status == null) return false;

      // Check for fields being added/removed which are not empty
      let add_rem = this.row_status.filter(Status.C);

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
        let poss = this.row_status.filter([Status.USE, Status.REQ, Status.USE_T]);
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
      this.row_status.unfilter([Status.IMM, Status.NOT]).forEach(key => {

        // Initialize vars
        let input_field = this.input_fields[key];
        let stat = this.row_status[key];
        let message = null;

        // Mark each field based on how it has been changed (if at all)
        // Order does matter here - blank must supercede ADD and changed
        if (stat == Status.REM || stat == Status.REM_T) {
          message = "removed";
        }
        else if (input_field.is_blank()) {
          message = "left blank";
        }
        else if (stat == Status.ADD) {
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

    accept_confirm_modal: function() {
      if (this.confirm_mode == "discard") {
        this.discard_changes();
      }
      else if (this.confirm_mode == "save") {
        this.save_edits();
      }
      this.confirm_mode = null;
    },



    // FUNCTION that saves edits to firebase, called by check_edits upon
    // determination that actual edits were made
    // Parameters: ID of youth
    save_edits: async function() {
      // creates an object to store edited values
      var changes = new Object();

      // Don't bother with immutable fields, since we're using Firebase update()
      this.row_status.unfilter(Status.IMM).forEach(key => {
        let input_field = this.input_fields[key];

        // If field is being used, save its value to the new changes object
        if (this.row_status.is_status(key, Status.O) && !input_field.is_blank()) {
          changes[key] = input_field.get_changed_value();
        }

        // If not, save an empty string
        else {
          changes[key] = "";
        }
      });


      // Emit the changes to be saved by the reference tracker
      this.$emit("save_changes", {
        changes,

        // If successful updating database, change the field data on the page
        success: () => {
          for (var key in changes) {

            // If any non-standard field is being removed, delete it from the page
            if (this.row_status.is_status(key, Status.REM_T)) {
              this.temp_fields = this.temp_fields.filter(k => k != key);
              delete this.local_values[key];
            }

            // For all other fields, simply update their local values
            else {
              this.local_values[key] = this.input_fields[key].get_changed_value();
            }
          };

          // Discard empty fields and update the row_status object to reflect the new values
          this.discard_empty_fields();
          this.row_status.update();

          // Switch out of edit mode
          this.set_edit_mode(false);
        },

        // In case of error...
        error: (err) => {
          window.alert("Error: " + err);
          return null;
        }
      });
    },


    discard_empty_fields: function() {
      this.row_status.filter([Status.ADD, Status.USE]).forEach(key => {
        if (this.input_fields[key].is_blank()) {
          this.set_row_status(key, Status.X);
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
      this.row_status.unfilter(Status.IMM).forEach(field => {
        this.input_fields[field].reset();
        this.fields_used[field] = this.row_status.is_status(field, Status.O);
      });
    },

    noEditsContinue: function() {
      this.noEditsModalVisible = false;
    },

    noEditsReturn: function() {
      this.discard_changes();
      this.noEditsModalVisible = false;
    },

    field_type: function(field) {
      if (this.temp_fields.includes(field)) {
        return "non-standard ";
      }
      if (this.row_status.is_status(field, Status.REQ)) {
        return "required ";
      }
      return "";
    },
  }
}
</script>

<style>
  .full_name {
    font-size: 2em;
    margin-bottom: 0;
    color: black;
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

  .change_modal_header > th {
    border-bottom: 2px solid #000;
    padding: 3pt;
    text-align: center;
  }

  .change_modal_footer > td {
    border-top: 2px solid #000;
  }

  .change_modal_field {
    font-family: "Courier New", Courier, monospace;
    color: fuchsia;
    font-weight: bold;
  }

  .change_modal_cell_title {
    text-align: left;
    width: 50%;
    padding: 3pt;
  }

  .change_modal_cell_remove {
    border-top: 1px solid #000;
    width: 25%;
    background-color: #FADBD8;
    color:#7B241C;
    text-align: center;
  }

  .change_modal_cell_add {
    border-top: 1px solid #000;
    width: 25%;
    background-color: #D5F5E3;
    color:#1D8348;
    text-align: center;
  }

  .change_modal_cell_temp {
    border-top: 1px solid #000;
    /*width: 25%;*/
    /*background-color: #F9FFb3;*/
    background-color: #EEF2BD;
    color:#636928;
    text-align: center;
  }

  .warning_icon {
    cursor: pointer;
    float: right;
  }
</style>