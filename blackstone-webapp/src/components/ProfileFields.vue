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
      </tr>
      <tr id="ActivePeriods_container" class="field_container">
        <td>Periods Active:</td>
        <td id="ActivePeriods_field" class="field_entry"></td>
        <td id="ActivePeriods_edit_container" class="edit_container"></td>
      </tr>
      <tr id="Hours Earned_container" class="field_container">
        <td>Hours Earned:</td>
        <td id="Hours Earned_field" class="field_entry"></td>
        <td id="Hours Earned_edit_container" class="edit_container"></td>
      </tr>
      <tr id="Hours Spent_container" class="field_container">
        <td>Hours Spent:</td>
        <td id="Hours Spent_field" class="field_entry"></td>
        <td id="Hours Spent_edit_container" class="edit_container"></td>
      </tr>
      <tr id="Pending Hours_container" class="field_container">
        <td>Pending Hours:</td>
        <td id="Pending Hours_field" class="field_entry"></td>
        <td id="Pending Hours_edit_container" class="edit_container"></td>
      </tr> -->
    </table>

    <button ref="edit_profile" v-on:click="toggle_edit_mode()">Edit!</button>

    <form id="edit_form" style="display: none;" onsubmit="submit_edit_form"></form>

  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

export default {
  name: 'profile_fields',
  props: ["currentProfile"],
  components: {
    
  },

  data: function() {
    return {
      edit_mode: false
    }
  },

  mounted: function() {
    let fields_list = ["DOB", "ActivePeriods", "Hours Earned", "Hours Spent", "Pending Hours"];
    let table = this.$refs.fields_table;

    fields_list.forEach(function(element) {
      let new_row = table.insertRow(-1);
      new_row.id = element + "_container";
      new_row.classList.add("field_container");

      let title_cell = new_row.insertCell(0);
      title_cell.innerHTML = element + ":";

      let field_p = new_row.insertCell(-1);
      field_p.id = element + "_field";
      field_p.classList.add("field_entry");

      let field_e = new_row.insertCell(-1);
      field_e.id = element + "_edit_container";
      field_e.classList.add("edit_container");
      
      let edit_input = document.createElement("input");
      edit_input.type = "text";
      edit_input.id   = element + "_edit";
      edit_input.name = element;
      edit_input.classList.add("edit_input");
      field_e.appendChild(edit_input);
    })
  },

  watch: {
    currentProfile: function(doc) {

      // Clear the old data from the screen
      clear_data();

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
          var edit_input;

          if (field_p == null) {
            let new_row = document.getElementById("fields_table").insertRow(-1);
            new_row.id = key + "_container";
            new_row.classList.add("field_container_temp");

            let title_cell = new_row.insertCell(0);
            title_cell.innerHTML = key + ":";

            field_p = new_row.insertCell(-1);
            field_p.id = key + "_field";
            field_p.classList.add("field_entry");

            let field_e = new_row.insertCell(-1);
            field_e.id = key + "_edit_container";
            field_e.classList.add("edit_container");
            field_e.placeholder = data[key];
            field_e.value = data[key];

            edit_input = document.createElement("input");
            edit_input.type = "text";
            edit_input.id   = key + "_edit";
            edit_input.name = key;
            edit_input.classList.add("edit_input");
            edit_input.placeholder = data[key];
            edit_input.value       = data[key];
            field_e.appendChild(edit_input);
          }

          // If it already exists, display its container element
          else {
            let field_c = document.getElementById(key + "_container");
            if (field_c != null) {
              field_c.style.display = "";
            };

            edit_input = document.getElementById(key + "_edit");
          };
          
          // Set the data, with special formatting for the dates
          if (key == "Last Sign In") {
            let temp_date = new Date(data[key]).toLocaleDateString(undefined, {
              weekday: 'long',
              day:     'numeric',
              month:   'long',
              year:    'numeric'
            });
            field_p.innerHTML = temp_date;
            edit_input.placeholder = temp_date;
            edit_input.value       = temp_date;
          }
          else if (key == "DOB") {
            let temp_date = new Date(data[key]).toLocaleDateString(undefined, {
              day:     'numeric',
              month:   'long',
              year:    'numeric'
            });
            field_p.innerHTML = temp_date;
            edit_input.placeholder = temp_date;
            edit_input.value       = temp_date;
          }
          else {
            field_p.innerHTML = data[key];
            if (edit_input != null) {
              edit_input.placeholder = data[key];
              edit_input.value       = data[key];
            }
          }
        };
      }

      // Helper function - clear the data from the screen
      function clear_data() {
        var fields = document.getElementsByClassName("data_field");
        for (var i = 0; i < fields.length; i++) {
          fields[i].innerHTML = "";
          fields[i].style.display = "none";
        }

        let containers = document.getElementsByClassName("field_container");
        for (var i = 0; i < containers.length; i++) {
          containers[i].style.display = "none";
        }

        let temp_containers = document.getElementsByClassName("field_container_temp");
        while (temp_containers[0]) {
          temp_containers[0].parentNode.removeChild(temp_containers[0]);
        }

        document.getElementById("name_div").style.display = "none";
        document.getElementById("fields_table").style.display = "none";

        document.getElementById("edit_form").innerHTML = "";
      }
    }
  },

  methods: {

    // Toggles between edit mode and display mode
    toggle_edit_mode: function() {
      if (this.edit_mode) {
        this.switch_to_display_mode();
      } else {
        this.switch_to_edit_mode();
      };
      this.edit_mode = !this.edit_mode;
    },

    // Switches screen to display mode, submitting any edits to the database
    switch_to_display_mode: function() {
      console.log("Switching to display mode...");
      this.$refs.edit_profile.innerHTML = "Edit!";

      Object.entries(document.getElementsByClassName("field_entry")).map(([n, element]) => {
        element.style.display = "";
      });

      Object.entries(document.getElementsByClassName("edit_container")).map(([n, element]) => {
        element.style.display = "none";
      });
    },

    // Switches screen to edit mode
    switch_to_edit_mode: function() {
      console.log("Switching to edit mode...");
      this.$refs.edit_profile.innerHTML = "Submit Edits!";

      Object.entries(document.getElementsByClassName("field_entry")).map(([n, element]) => {
        element.style.display = "none";
      });

      Object.entries(document.getElementsByClassName("edit_container")).map(([n, element]) => {
        element.style.display = "";
      });
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
</style>