<template>
  <div class="profile_fields" style="border-style: solid; border-width: 5px;">

    <div id="name_div" style="display: none;">
      <div class="full_name"><span id="First Name_field">Yves</span>&nbsp;<span id="Last Name_field">Shum</span></div>
      <span class="id_parens">(ID:&nbsp;<span id="ID_field">10001</span>)</span>
    </div>

    <table id="fields_table" style="display: none;">
      <tr id="DOB_container" class="field_container">
        <td>Date of Birth:</td>
        <td id="DOB_field"></td>
      </tr>
      <tr id="ActivePeriods_container" class="field_container">
        <td>Periods Active:</td>
        <td id="ActivePeriods_field"></td>
      </tr>
      <tr id="Last Sign In_container" class="field_container">
        <td>Last Sign In:</td>
        <td id="Last Sign In_field"></td>
      </tr>
      <tr id="Hours Earned_container" class="field_container">
        <td>Hours Earned:</td>
        <td id="Hours Earned_field"></td>
      </tr>
      <tr id="Hours Spent_container" class="field_container">
        <td>Hours Spent:</td>
        <td id="Hours Spent_field"></td>
      </tr>
      <tr id="Pending Hours_container" class="field_container">
        <td>Pending Hours:</td>
        <td id="Pending Hours_field"></td>
      </tr>
    </table>

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
        var data = doc.loaded.data();

        // Load the youth's ID to the page
        document.getElementById("ID_field").innerHTML = doc.loaded.id;
      
        // Loop through each field in the data
        for (var key in data) {

          if (key == "Apron Level") continue;

          // Find appropriate p for field, or create it if it does not exist
          var field_p = document.getElementById(key + "_field");

          if (field_p == null) {
            let new_row = document.getElementById("fields_table").insertRow(-1);
            new_row.id = key + "_container";
            new_row.classList.add("field_container_temp");

            let title_cell = new_row.insertCell(0);
            title_cell.innerHTML = key + ":";
            field_p = new_row.insertCell(-1);

            field_p.id = key + "_field";
          }

          // If it already exists, display its container element
          else {
            let field_c = document.getElementById(key + "_container");
            if (field_c != null) {
              field_c.style.display = "";
            }
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
          }
          else if (key == "DOB") {
            let temp_date = new Date(data[key]).toLocaleDateString(undefined, {
              day:     'numeric',
              month:   'long',
              year:    'numeric'
            });
            field_p.innerHTML = temp_date;
          }
          else {
            field_p.innerHTML = data[key];
          }

          // Create edit field
          var x = document.createElement("input");
          x.type = "text";
          x.id = key + "_edit";
          x.name = key;
          x.placeholder = data[key];
          x.value = data[key];
          document.getElementById("edit_form").appendChild(x);
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

        document.getElementById("edit_form").innerHTML = "";
      }
    }
  },

  methods: {

    submit_edit_form: function() {
      // TODO: Submission stuff!
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