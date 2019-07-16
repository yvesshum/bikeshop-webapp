<template>
  <div class="profile_fields" style="border-style: solid; border-width: 5px;">
    <p>This is where the basic fields go!</p>
    
    <p id="Name_field"       class="data_field"></p>
    <p id="DOB_field"        class="data_field"></p>
    <p id="Hair_Color_field" class="data_field"></p>
    <div id="variable_fields"></div>

    <form id="edit_form" onsubmit="submit_edit_form" style="display: none;"></form>

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
      if (data != null) {

        // Init vars
        var variable_fields = document.getElementById("variable_fields");
        var data = doc.data();
      
        // Loop through each field in the data
        for (var key in data) {

          if (key == "Apron Level") continue;

          // Find appropriate p for field, or create it if it does not exist
          var field_p = get_or_make_field(key);
          
          // Set the data
          field_p.innerHTML = key + ": " + data[key];
          field_p.style.display = "block";

          // Create edit field
          var x = document.createElement("input");
          x.type = "text";
          x.id = key + "_edit";
          x.name = key;
          x.placeholder = data[key];
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

        document.getElementById("variable_fields").innerHTML = "";
        document.getElementById("edit_form").innerHTML = "";
      }

      // Helper function - get proper div for the field
      function get_or_make_field(key) {
        var field_p = document.getElementById(key + "_field");
        if (field_p == null) {
          field_p = document.createElement("P");
          field_p.id = key + "_field";
          variable_fields.appendChild(field_p);
        }
        return field_p;
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