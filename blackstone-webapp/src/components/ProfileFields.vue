<template>
  <div class="profile_fields" style="border-style: solid; border-width: 5px;">

    <div id="name_div" style="display: none;">
      <div class="full_name"><span id="First Name_field"></span>&nbsp;<span id="Last Name_field"></span></div>
      <span class="id_parens">(ID:&nbsp;<span id="ID_field"></span>)</span>
    </div>

    <table id="fields_table" ref="fields_table" style="display: none;">
      <!-- <tr id="DOB_container" class="field_container">
        <td>Date of Birth:</td>
        <td id="DOB_field" class="field_entry"></td>
        <td id="DOB_edit_container" class="edit_container"></td>
      </tr> -->
    </table>

    <button ref="edit_profile" v-on:click="toggle_edit_mode()">Edit!</button>
    <button ref="discard_changes" v-on:click="discard_changes()" class="edit_mode_only" style="display: none;">Discard Changes</button>
    <button ref="reset_changes" v-on:click="reset_changes()" class="edit_mode_only" style="display: none;">Reset All Changes</button>

    <b-modal v-model="confirmModalVisible" hide-footer lazy>
      <template slot="modal-title">
          Please Confirm the Following Changes
      </template>
      <div class="d-block text-center">
          <h3>The following changes will be saved:</h3>
          <p>{{modalList}}</p>
          <!-- <ul ref="confirm_changes_list"></ul> -->
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

export default {
  name: 'profile_fields',
  props: ["currentProfile", "header_doc"],
  components: {
    
  },

  data: function() {
    return {
      edit_mode: false,
      specially_displayed_fields: ["First Name", "Last Name"],
      row_status: null,
      array_fields: null,
      confirmModalVisible: false,
      modalList: ""
    }
  },

  mounted: function() {
    
  },

  watch: {

    header_doc: function(new_header) {
      let table = this.$refs.fields_table;
      let data = new_header.data();

      this.row_status = new Object();
      this.array_fields = new Object();

      let immutable_fields = data["hidden"].concat("Last Sign In").filter(function(element) {
        return !["Work Log", "Order Log", "Transfer Log"].includes(element);
      });

      append_table_section(this, "Required:", data["required"], "required");
      append_table_section(this, "",          immutable_fields, "immutable");
      append_table_section(this, "Optional:", data["optional"], "unused");

      function append_table_fullrow(heading) {
        let new_row = table.insertRow(-1);
        new_row.classList.add("edit_mode_only");
        new_row.style.display = "none";
        let new_cell = new_row.insertCell(-1);
        new_cell.colSpan = "3";
        new_cell.innerHTML = heading;
        new_cell.style["text-align"] = "center";
      };

      // Takes in vue component as self for scoping
      function append_table_section(self, heading, content, default_state) {
        append_table_fullrow(heading);
        content.forEach(function(element) {
          self.append_field_container(element, default_state);
          self.set_row_status(element, default_state);
        });
        append_table_fullrow("&nbsp;");
      };
    },

    
    edit_mode: function(val) {

      // Go into edit mode
      if (this.edit_mode) {
        this.$refs.edit_profile.innerHTML = "Submit Edits!";

        document.querySelectorAll(".edit_mode_only").forEach((element, n) => {
          element.style.display = "";
        });

        document.querySelectorAll(".edit_input").forEach((element, n) => {
          if (this.row_status[element.name] == "unused") {
            element.parentNode.style.display = "none";
          };
        });

        document.querySelectorAll(".display_mode_only").forEach((element, n) => {
          element.style.display = "none";
        });
      }

      // Reset to display mode
      else {
        this.$refs.edit_profile.innerHTML = "Edit!";

        document.querySelectorAll(".edit_mode_only").forEach((element, n) => {
          element.style.display = "none";
        });

        document.querySelectorAll(".display_mode_only").forEach((element, n) => {
          element.style.display = "";
        });

        document.querySelectorAll('.field_title').forEach((element, n) => {
          element.style["font-weight"] = "";
        });

        document.querySelectorAll('.edit_input').forEach((element, n) => {
          // console.log(element);
          element.value = element.defaultValue;
          if (this.row_status[element.name] == "unused") {
            this.set_all_input_vals(element, "");
          }
        });
      };
    },

    currentProfile: function(doc) {

      // Clear the old data from the screen
      clear_data();

      // Set the status of all non-required and non-immutable fields to "unused"
      Object.keys(this.row_status).filter(function(key) {
        return !["required", "immutable"].includes(this.row_status[key]);
      }.bind(this)).forEach(function(key) {
        this.set_row_status(key, "unused");
      }.bind(this));

      // If a profile was passed, display it to the screen
      if (doc != null) {

        // Show the name and table of fields
        document.getElementById("name_div").style.display = "";
        document.getElementById("fields_table").style.display = "";

        // Init vars
        var data = doc.data();

        // Load the youth's ID to the page
        document.getElementById("ID_field").innerHTML = doc.id;
      
        // Loop through each field in the data
        for (var key in data) {

          if (key == "Apron Level") continue;

          // Find appropriate p for field, or create it if it does not exist
          var field_p = document.getElementById(key + "_field");
          let field_c = document.getElementById(key + "_container");

          if (field_p == null) {
            field_p = this.append_field_container(key, "unused");
            field_c = document.getElementById(key + "_container");
          }

          
          else if (this.specially_displayed_fields.includes(key)) {
            if (field_c != null) {
              field_c.classList.add("edit_mode_only");
            };
          }

          // If it already exists, display its container element
          else {
            field_p.style.display = "";
            if (field_c != null) {
              field_c.style.display = "";
            };
          };

          if (!this.specially_displayed_fields.includes(key)) {
            field_c.classList.remove("edit_mode_only");
          };

          this.set_row_status(key, "used");

          var edit_input = document.getElementById(key + "_edit");
          
          // Set the data, with special formatting for the dates
          if (key == "Last Sign In") {
            try {
              display_date(this, key, field_p, edit_input, 19, {
                weekday: 'long',
                day:     'numeric',
                month:   'long',
                year:    'numeric'
              });
            } catch {
              display_string(this, key, field_p, edit_input);
            };
          }
          else if (key == "DOB") {
            try {
              display_date(this, key, field_p, edit_input, 10, {
                day:     'numeric',
                month:   'long',
                year:    'numeric'
              });
            } catch {
              display_string(this, key, field_p, edit_input);
            };
          }
          else if (Array.isArray(data[key])) {
            this.create_fields_array(key, data[key]);
          }
          else {
            display_string(this, key, field_p, edit_input);
          }
        };
      }

      function display_date(self, key, field_p, edit_input, slice_range, display_options) {
        let temp_date = data[key].toDate();
        field_p.innerHTML = temp_date.toLocaleDateString(undefined, display_options);
        self.set_all_input_vals(edit_input, temp_date.toJSON().slice(0, slice_range));
      }

      function display_string(self, key, field_p, edit_input) {
        field_p.innerHTML = data[key];
        self.set_all_input_vals(edit_input, data[key]);
      }

      // Helper function - clear the data from the screen
      function clear_data() {

        // Clear the standard fields
        Object.entries(document.getElementsByClassName("field_container")).map(([n, element]) => {
          // Hide the row
          element.style.display = "none";

          // Clear the field
          element.getElementsByClassName("data_field")[0].innerHTML = "";

          // Clear the edit box
          let edit_input = element.getElementsByClassName("edit_container")[0].getElementsByClassName("edit_input")[0];
          // TODO: Fix scoping issue so we can use set_all_fields function
          if (edit_input != null) {
            edit_input.placeholder = "";
            edit_input.value = "";
            edit_input.defaultValue = "";
          }
        });

        // Clear the nonstandard fields
        let temp_containers = document.getElementsByClassName("field_container_temp");
        while (temp_containers[0]) {
          temp_containers[0].parentNode.removeChild(temp_containers[0]);
        };

        // Hide the containers
        document.getElementById("name_div").style.display = "none";
        document.getElementById("fields_table").style.display = "none";
      }
    }
  },

  methods: {

    get_changes_as_array: function(key) {
      var form = document.getElementById(key + "_array_edit_container").childNodes;
      var len = form.length;

      var list = [];

      for (var i = 0; i < len; i += 3) {
        let input = form[i];
        let title = form[i+1];

        if (input.checked) {
          list.push(title.innerHTML);
        }
      };

      return list;
    },

    create_fields_array: function(key, arr) {
      let display_dest = document.getElementById(key + "_field");
      display_dest.innerHTML = "";

      let edit_dest = document.getElementById(key + "_edit_container");

      let checkbox_options = document.getElementById(key + "_array_edit_container");
      if (checkbox_options == null) {
        checkbox_options = document.createElement("div");
        checkbox_options.id = key + "_array_edit_container";
        edit_dest.insertBefore(checkbox_options, edit_dest.childNodes[edit_dest.childNodes.length-1]);
      }
      else {
        checkbox_options.innerHTML = "";
      }
      

      arr.forEach(function(element) {
        let new_div = document.createElement("div");
        new_div.innerHTML = element;
        new_div.classList.add("field_list_element");
        display_dest.appendChild(new_div);

        let new_option = document.createElement("input");
        new_option.type = "checkbox";
        new_option.checked = true;
        new_option.name = element;
        new_option.value = element;

        let new_option_name = document.createElement("div");
        new_option_name.innerHTML = element;
        new_option_name.style.display = "inline";

        checkbox_options.appendChild(new_option);
        checkbox_options.appendChild(new_option_name);
        checkbox_options.appendChild(document.createElement("br"));
      });

      this.array_fields[key] = arr;
    },

    set_row_status: function(key, new_status) {

      if (new_status == "required") {
        this.row_status[key] = new_status;
        return;
      };

      // If special X or + is entered, determine which new status to use based on current status
      let old_status = this.row_status[key];
      if (new_status == "X") new_status = ((old_status == "used") ? "remove" : "unused");
      if (new_status == "+") new_status = ((old_status == "unused") ? "add" : "used");

      // Update the status
      this.row_status[key] = new_status;

      let container =      document.getElementById(key + "_container");
      let remove_button =  document.getElementById(key + "_remove_button")
      let data_field =     document.getElementById(key + "_field");
      let edit_container = document.getElementById(key + "_edit_container");
      let data_title =     document.getElementById(key + "_title");
      let edit_field =     document.getElementById(key + "_edit");

      // Perform any extra operations
      switch (new_status) {

        case "immutable":
          container.classList.add("display_mode_only");
          break;

        // Field is currently being used in the profile
        case "used":
          container.classList.remove("edit_mode_only");
          if (remove_button != null) remove_button.innerHTML = "X";
          if (this.edit_mode) {
            edit_container.style.display = "";
            data_field.style.display = "none";
          } else {
            data_field.style.display = "";
            if (this.specially_displayed_fields.includes(key)) {
              edit_container.style.display = "";
              container.classList.add("edit_mode_only");
            }
          };

          data_field.classList.remove("to_be_removed");
          data_title.classList.remove("to_be_removed_title");
          data_title.classList.remove("to_be_added_title");
          
          break;

        // Field is to be added to the profile (edit mode only)
        case "add":
          if (remove_button != null) remove_button.innerHTML = "X";
          edit_container.style.display = "";
          data_field.style.display = "none";
          data_title.classList.add("to_be_added_title");
          break;


        // Field is not currently being used in the profile
        case "unused":
          container.classList.add("edit_mode_only");
          if (remove_button != null) remove_button.innerHTML = "+";
          edit_container.style.display = "none";
          data_field.style.display = "none";
          data_field.classList.remove("to_be_removed");
          data_title.classList.remove("to_be_removed_title");
          data_title.classList.remove("to_be_added_title");
          break;

        // Field is to be removed from the profile (edit mode only)
        case "remove":
          if (remove_button != null) remove_button.innerHTML = "+";
          edit_container.style.display = "none";
          data_field.style.display = "";
          data_field.classList.add("to_be_removed");
          data_title.classList.add("to_be_removed_title");
          break;

        case "required":
          break;

        default:
          console.log("Error: Row cannot be set to status \"" + new_status + "\".");
      };
    },

    set_all_input_vals: function(input, val) {
      if (input != null) {
        input.placeholder  = val;
        input.value        = val;
        input.defaultValue = val;
      };
    },

    append_field_container: function(key, default_state) {
      return this.create_field_container(key, -1, default_state);
    },

    create_field_container: function(key, row_index, default_state) {

      if (!["unused", "immutable", "required"].includes(default_state)) {
        console.log("The default state of key ", key, " cannot be ", default_state);
      };
      
      let table = this.$refs.fields_table;

      let new_row = table.insertRow(row_index);
      new_row.id = key + "_container";
      new_row.classList.add("field_container");
      new_row.classList.add("edit_mode_only");

      let remove_button_container = new_row.insertCell(-1);
      remove_button_container.id = key + "_remove_button_container";
      remove_button_container.classList.add("remove_button_container");
      remove_button_container.classList.add("edit_mode_only");
      remove_button_container.style.display = "none";

      let title_cell = new_row.insertCell(-1);
      title_cell.id = key + "_title";
      title_cell.classList.add("field_title");
      title_cell.innerHTML = key + ":";

      var field_p = new_row.insertCell(-1);
      if (!this.specially_displayed_fields.includes(key)) field_p.id = key + "_field";
      field_p.classList.add("data_field");
      field_p.classList.add("display_mode_only");

      let field_e = new_row.insertCell(-1);
      field_e.id = key + "_edit_container";
      field_e.classList.add("edit_container");
      field_e.classList.add("edit_mode_only");
      field_e.style.display = "none";

      // TODO: Only set input type as date if field is actually a date
      // TODO: Collect which fields are dates into an array on profile switch?

      // Only create an edit bar if the field can be changed
      if (default_state != "immutable") {
        let edit_input = document.createElement("input");
        if (key == "DOB") {
          edit_input.type = "date";
        }
        else if (key == "Last Sign In") {
          edit_input.type = "datetime-local";
        }
        else if (key == "ActivePeriods") {
          edit_input.style.display = "none";
        }
        else {
          edit_input.type = "text";
        }
        edit_input.id   = key + "_edit";
        edit_input.name = key;
        edit_input.classList.add("edit_input");
        edit_input.addEventListener('input', function() {
          if (edit_input.value != edit_input.defaultValue) {
            title_cell.style["font-weight"] = "bold";
          } else {
            title_cell.style["font-weight"] = "";
          }
        });
        field_e.appendChild(edit_input);
      };

      // Only create a remove button if the field can be removed
      if (default_state == "unused") {
        let remove_button = document.createElement("button");
        remove_button.id = key + "_remove_button";
        remove_button.innerHTML = "+";
        let self = this;
        remove_button.onclick = function () {
          self.set_row_status(key, this.innerHTML);
        };
        remove_button_container.appendChild(remove_button);
      };

      // Only create a reset button if the field can be edited
      if (default_state != "immutable") {
        let reset_button = document.createElement("button");
        reset_button.innerHTML = "Reset";
        reset_button.onclick = function() {
          edit_input.value = edit_input.defaultValue;
          title_cell.style["font-weight"] = "";
        };
        field_e.appendChild(reset_button);
      }

      return field_p;
    },

    // Toggles between edit mode and display mode
    toggle_edit_mode: function() {
      if (this.edit_mode) {
        this.check_edits();
      } else {
        this.edit_mode = !this.edit_mode;
      };
    },



    //FUNCTION to check if form changes with edit
    //Parameters: called upon form submission
    check_edits: function(event) {
      // event.preventDefault();
      const form = document.getElementsByClassName("edit_input");
      
      var n;
      var c = false;

      // Check for any fields to be added/removed
      Object.keys(this.row_status).forEach(function(element) {
        if ((this.row_status[element] == "add" || this.row_status[element] == "remove")) {
          c = true;
        };
      }.bind(this));

      // If no fields to be added/removed, check existing fields for edits
      if (!c) {
        var el = form.length;
        // console.log(el);  // Displays the number of fields in edit form
        for (var e = 0; e < el; e++) {
          n = form[e];
          
          // Don't bother checking immutable or unused fields for changes
          if (["immutable", "unused"].includes(this.row_status[n.name])) continue;

          if (this.array_fields[n.name] != null) {
            c = c || (JSON.stringify(this.array_fields[n.name]) !== JSON.stringify(this.get_changes_as_array(n.name)));
          } else {
            // console.log(n);  // Displays the form elements
            c = c || (n.value != n.defaultValue);
          };
        }
      };

      if (c) {
        this.create_confirm_modal();
        this.confirmModalVisible = true;
      } else {
        alert("No edits have been made");
      }
    },

    create_confirm_modal: function() {
      this.modalList = "";
      // const change_list = this.$refs["confirm_changes_list"];
      // console.log(change_list);

      Object.keys(this.row_status).forEach(function(key) {
        let input_field = document.getElementById(key + "_edit");
        if (input_field == null) return;

        switch(this.row_status[key]) {
          // If field is unused or immutable, it won't have any changes to report
          case "unused":
          case "immutable":
            break;

          case "remove":
            this.modalList += "The field " + input_field.name + " has been removed.\n";
            break;

          case "required":
          case "used":
            if (input_field.defaultValue != input_field.value) {
              let temp1 = "";
              if (this.array_fields[key] != null) {
                temp1 = this.get_changes_as_array(key);
              } else {
                temp1 = input_field.value;
              };
              this.modalList += "The field " + key + " has been set to " + temp1 + "\n";
            };
            break;

          // Data field is being added: Save its value to the new profile
          case "add":
            if (input_field.defaultValue != input_field.value) {
              let temp2 = "";
              if (this.array_fields[key] != null) {
                temp2 = this.get_changes_as_array(key);
              } else {
                temp2 = input_field.value;
              };
              this.modalList += "The field " + key + " has been created and set to " + temp2 + "\n";
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
      let youth_id = document.getElementById("ID_field").innerHTML;

      // Cycle through each potential field and use the data accordingly
      Object.keys(this.row_status).forEach(function(key) {
        let input_field = document.getElementById(key + "_edit");
        if (input_field == null) return;

        let data_field = document.getElementById(input_field.name + "_field");
        switch(this.row_status[key]) {
          // Data field is not used by this profile: Do nothing
          case "unused":
            break;

          // Data field is being removed: Set it do unused and do nothing w the data
          case "remove":
            this.set_row_status(key, "unused");
            break;

          // Data field is used: Save its updated value to the new profile and to the page
          // TODO: Allow user to add list item
          // TODO: Display all possible active periods?
          // TODO: Fallthrough from add to used?

          // TODO: Save dates as dates!
          // TODO: If name field is changed, update ActivePeriods doc
          case "required":
          case "immutable":
          case "used":
            if (this.array_fields[key] != null) {
              changes[input_field.name] = this.get_changes_as_array(key);
            } else {
              changes[input_field.name] = input_field.value;
            }
            break;

          // Data field is being added: Save its value to the new profile
          case "add":
            changes[input_field.name] = input_field.value;
            this.set_row_status(key, "used");
            break;

          // Catchall case
          default:
            console.log("Unknown status \"" + this.row_status[key] + "\" for key \"" + key + "\"");
        };
      }.bind(this));

      // Remove bolding from edited field titles
      // TODO: Make this a CSS class
      Object.entries(document.getElementsByClassName("field_title")).map(([n, element]) => {
        element.style["font-weight"] = "";
      })

      console.log("New profile:", changes);

      // Saves edits to firebase
      // db.collection('GlobalYouthProfile').doc(youth_id).update(changes).catch(err => {
      //   window.alert("Error: " + err);
      //   return null;
      // });

      // If no error updating database, change the field data on the page
      for (var key in changes) {
        if (this.array_fields[key] != null) {
          this.create_fields_array(key, changes[key]);
        } else {
          let input_field = document.getElementById(key + "_edit");
          document.getElementById(key + "_field").innerHTML = changes[key];
          this.set_all_input_vals(input_field, input_field.value);
        };
      };
    },


    discard_changes: function() {
      this.edit_mode = !this.edit_mode;
    },

    reset_changes: function() {
      Object.entries(document.getElementsByClassName("edit_input")).map(([n, element]) => {
        element.value = element.defaultValue;
      });
      Object.entries(document.getElementsByClassName("field_title")).map(([n, element]) => {
        element.style["font-weight"] = "";
      })
    },

    acceptConfirmModal: function() {
      this.confirmModalVisible = false;
      this.save_edits();
      this.edit_mode = false;
    },

    cancelConfirmModal: function() {
      this.confirmModalVisible = false;
    },

    convert_to_fields: function(container) {
      let key = container.id.slice(0, container.id.lastIndexOf("_"));

      var fields = new Object();

      fields.container = container;
      fields.title_cell = document.getElementById(key + "_title");
      fields.field = document.getElementById(key + "_field");
      fields.edit_field = document.getElementById(key + "_edit");
      fields.edit_container = document.getElementById(key + "_edit_container");
      fields.remove_button_container = document.getElementById(key + "_remove_button_container");

      return fields;
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
    /*display: none;*/
    margin: auto;
    text-align: left;
  }

  .to_be_removed {
    color: gray;
    font-style: oblique;
  }

  .field_list_element {
    border-radius: 10px;
    border: 2px solid green;
    background-color: lightgreen;
    text-align: center;
  }

  .to_be_added_title, .to_be_removed_title {
    font-weight: bold;
  }
</style>