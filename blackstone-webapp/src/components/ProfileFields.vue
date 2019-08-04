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
      row_status: null
    }
  },

  mounted: function() {
    
  },

  watch: {

    header_doc: function(data) {
      let table = this.$refs.fields_table;
      this.row_status = new Object();

      append_table_section(this, "Required:",   this.header_doc["required"].concat(["ActivePeriods"]));
      append_table_section(this, "Statistics:", this.header_doc["hidden"]);
      append_table_section(this, "Optional:",   this.header_doc["optional"]);

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
      function append_table_section(self, heading, content) {
        append_table_fullrow(heading);
        content.forEach(function(element) {
          self.append_field_container(element);
          self.set_row_status(element, "unused");
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

        var add_row = this.$refs.fields_table.insertRow(-1);
        add_row.id = "add_field_button_row";
        let add_button_cont = add_row.insertCell(-1);
        let add_button = document.createElement("button");
        add_button.id = "add_field_button";
        add_button.innerHTML = "+";
        add_button_cont.appendChild(add_button);
        add_button.onclick = this.insert_temp_field_container;
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

        this.$refs.fields_table.deleteRow(-1);
      };
    },

    currentProfile: function(doc) {

      // Clear the old data from the screen
      clear_data();
      for (key in this.row_status.elements) {
        this.set_row_status(key, "unused");
      };

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
            field_p = this.append_field_container(key);
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

          field_c.classList.remove("unused_field");
          if (!this.specially_displayed_fields.includes(key)) {
            field_c.classList.remove("edit_mode_only");
          };

          this.set_row_status(key, "used");

          var edit_input = document.getElementById(key + "_edit");
          
          // Set the data, with special formatting for the dates
          if (key == "Last Sign In") {
            let temp_date = new Date(data[key]);

            field_p.innerHTML = temp_date.toLocaleDateString(undefined, {
              weekday: 'long',
              day:     'numeric',
              month:   'long',
              year:    'numeric'
            });

            this.set_all_input_vals(edit_input, temp_date.toJSON().slice(0,19));
          }
          else if (key == "DOB") {
            let temp_date = new Date(data[key]);

            field_p.innerHTML = temp_date.toLocaleDateString(undefined, {
              day:     'numeric',
              month:   'long',
              year:    'numeric'
            });

            this.set_all_input_vals(edit_input, temp_date.toJSON().slice(0,10));
          }
          else if (Array.isArray(data[key])) {
            let checkbox_options = document.createElement("div");

            data[key].forEach(function(element) {
              let new_div = document.createElement("div");
              new_div.innerHTML = element;
              new_div.classList.add("field_list_element");
              field_p.appendChild(new_div);

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

            let edit_container = document.getElementById(key + "_edit_container");
            edit_container.insertBefore(checkbox_options, edit_container.childNodes[edit_container.childNodes.length-1]);
          }
          else {
            field_p.innerHTML = data[key];
            if (edit_input != null) {
              this.set_all_input_vals(edit_input, data[key]);
            }
          }
        };
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
          edit_input.placeholder = "";
          edit_input.value = "";
          edit_input.defaultValue = "";
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

    set_row_status: function(key, new_status) {

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

        // Field is currently being used in the profile
        case "used":
          container.classList.remove("edit_mode_only");
          remove_button.innerHTML = "X";
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
          remove_button.innerHTML = "X";
          edit_container.style.display = "";
          data_field.style.display = "none";
          data_title.classList.add("to_be_added_title");
          break;


        // Field is not currently being used in the profile
        case "unused":
          container.classList.add("edit_mode_only");
          remove_button.innerHTML = "+";
          edit_container.style.display = "none";
          data_field.style.display = "none";
          data_field.classList.remove("to_be_removed");
          data_title.classList.remove("to_be_removed_title");
          data_title.classList.remove("to_be_added_title");
          break;

        // Field is to be removed from the profile (edit mode only)
        case "remove":
          remove_button.innerHTML = "+";
          edit_container.style.display = "none";
          data_field.style.display = "";
          data_field.classList.add("to_be_removed");
          data_title.classList.add("to_be_removed_title");
          break;

        default:
          console.log("Error: Row cannot be set to status \"" + new_status + "\".");
      };
    },

    set_all_input_vals: function(input, val) {
      input.placeholder  = val;
      input.value        = val;
      input.defaultValue = val;
    },

    //TODO: Delete temp field container if 
    insert_temp_field_container: function() {
      var new_field_name = prompt("Please enter the title of the new field:", "");
      if (new_field_name != null) {
        new_field_name = new_field_name.trim();
        if (new_field_name == "") return null;
        this.create_field_container(new_field_name, this.$refs.fields_table.rows.length-1);
        this.set_row_status(new_field_name, "add");
        document.getElementById(new_field_name + "_remove_button_container").style.display = "";
      };
    },

    append_field_container: function(key) {
      return this.create_field_container(key, -1);
    },

    create_field_container: function(key, row_index) {
      let table = this.$refs.fields_table;

      let new_row = table.insertRow(row_index);
      new_row.id = key + "_container";
      new_row.classList.add("field_container");
      new_row.classList.add("unused_field");
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
      field_p.id = key + "_field";
      field_p.classList.add("data_field");
      field_p.classList.add("display_mode_only");

      let field_e = new_row.insertCell(-1);
      field_e.id = key + "_edit_container";
      field_e.classList.add("edit_container");
      field_e.classList.add("edit_mode_only");
      field_e.style.display = "none";
      
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

      let remove_button = document.createElement("button");
      remove_button.id = key + "_remove_button";
      remove_button.innerHTML = "+";
      let self = this;
      remove_button.onclick = function () {
        self.set_row_status(key, this.innerHTML);
      };
      remove_button_container.appendChild(remove_button);

      let reset_button = document.createElement("button");
      reset_button.innerHTML = "Reset";
      reset_button.onclick = function() {
        edit_input.value = edit_input.defaultValue;
        title_cell.style["font-weight"] = "";
      };
      field_e.appendChild(reset_button);

      return field_p;
    },

    // Toggles between edit mode and display mode
    toggle_edit_mode: function() {
      if (this.edit_mode) {
        this.check_edits();
      };
      this.edit_mode = !this.edit_mode;
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
        if (!(this.row_status[element] == "used" || this.row_status[element] == "unused")) {
          c = true;
        };
      }.bind(this));

      // If no fields to be added/removed, check existing fields for edits
      if (!c) {
        var el = form.length;
        // console.log(el);  // Displays the number of fields in edit form
        for (var e = 0; e < el; e++) {
          n = form[e];
          if (n.parentNode.parentNode.classList.contains("unused_field")) continue;
          // console.log(n);  // Displays the form elements
          c = c || (n.value != n.defaultValue);
        }
      };

      if (c) {
        // TODO: Modal which confirms changes
        alert("The edits have been saved");
        this.save_edits();
      } else {
        alert("No edits have been made");
      }
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
          // TODO: If database update fails, don't change page
          // TODO: Save data from list input
          case "used":
            changes[input_field.name] = input_field.value;
            data_field.innerHTML      = input_field.value;
            this.set_all_input_vals(input_field, input_field.value);
            break;

          // Data field is being added: Save its value to the new profile
          case "add":
            changes[input_field.name] = input_field.value;
            data_field.innerHTML      = input_field.value;
            this.set_all_input_vals(input_field, input_field.value);
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
      // db.collection('GlobalYouthProfile').doc(youth_id).update(changes);
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