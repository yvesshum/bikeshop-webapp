<template>
  <div class="input_display_toggle">

    <div ref="display" v-if="!editMode">
      {{display_value}}
    </div>

    <div ref="edit_container" v-else>
      <SpecialInput ref="edit_input" :input="type" :arguments="input_args" @Value="edit_change">
      </SpecialInput>
      <b-button ref="reset_button" squared :variant="reset_variant" v-on:click="reset()">
        Reset
      </b-button>
    </div>

  </div>
</template>

<script>
import SpecialInput from '@/components/SpecialInput';

export default {
  name: 'input_display_toggle',
  props: ['editMode', 'name', 'type', 'defaultValue'],
  components: {
    SpecialInput
  },

  data: function() {
    return {
      edit_value: null,
    }
  },

  mounted: function() {
    this.$emit("Mounted", this);
  },

  computed: {
    reset_variant: function() {
      return (this.changed) ? "outline-danger" : "outline-secondary";
    },

    changed: function() {
      return this.edit_value != this.defaultValue;
    },

    input_args: function() {
      if (Array.isArray(this.defaultValue)) {
        return {};
      }
      return {
        placeholder: this.defaultValue,
        value: this.defaultValue,
      };
    },

    display_value: function() {
      // TODO: Use type and v-if, v-for, etc to display objects in HTML
      return this.defaultValue;

      //   // Set the data, with special formatting for the dates
      //   if (key == "Last Sign In") {
      //     try {
      //       display_date(this, key, field_p, edit_input, 19, {
      //         weekday: 'long',
      //         day:     'numeric',
      //         month:   'long',
      //         year:    'numeric'
      //       });
      //     } catch (error) {
      //       display_string(this, key, field_p, edit_input);
      //     };
      //   }
      //   else if (key == "DOB") {
      //     try {
      //       display_date(this, key, field_p, edit_input, 10, {
      //         day:     'numeric',
      //         month:   'long',
      //         year:    'numeric'
      //       });
      //     } catch (error) {
      //       display_string(this, key, field_p, edit_input);
      //     };
      //   }
      //   else if (Array.isArray(data[key])) {
      //     this.create_fields_array(key, data[key]);
      //   }
      //   else {
      //     display_string(this, key, field_p, edit_input);
      //   }

      // function display_date(self, key, field_p, edit_input, slice_range, display_options) {
      //   let temp_date = data[key].toDate();
      //   field_p.innerHTML = temp_date.toLocaleDateString(undefined, display_options);
      //   self.set_all_input_vals(edit_input, temp_date.toJSON().slice(0, slice_range));
      // }

      // function display_string(self, key, field_p, edit_input) {
      //   field_p.innerHTML = data[key];
      //   self.set_all_input_vals(edit_input, data[key]);
      // }
    },
  },

  methods: {

    reset: function() {
      this.edit_value = this.defaultValue;
      if (!Array.isArray(this.defaultValue)) {
        this.$refs.edit_input.setValue(this.defaultValue);
      }
      
      this.$emit("Reset", this.edit_value);
    },

    emit_changes: function() {
      this.$emit("Changed", this.changed);
    },

    get_display_value: function() {
      return this.defaultValue;
    },
    
    get_edit_value: function() {
      return this.edit_value;
    },

    edit_change: function(new_val) {
      this.edit_value = new_val;
      // console.log(this.name + " => ", this.defaultValue, ", ", this.edit_value);
    },

    is_blank: function() {
      return this.edit_value == null || this.edit_value == "";
    },


    // set_all_input_vals: function(input, val) {
    //   if (input != null) {
    //     input.placeholder  = val;
    //     input.value        = val;
    //     input.defaultValue = val;
    //   };
    // },



    // create_fields_array: function(key, arr) {
    //   let display_dest = document.getElementById(key + "_field");
    //   display_dest.innerHTML = "";

    //   let edit_dest = document.getElementById(key + "_edit_container");

    //   let checkbox_options = document.getElementById(key + "_array_edit_container");
    //   if (checkbox_options == null) {
    //     checkbox_options = document.createElement("div");
    //     checkbox_options.id = key + "_array_edit_container";
    //     edit_dest.insertBefore(checkbox_options, edit_dest.childNodes[edit_dest.childNodes.length-1]);
    //   }
    //   else {
    //     checkbox_options.innerHTML = "";
    //   }
      

    //   arr.forEach(function(element) {
    //     let new_div = document.createElement("div");
    //     new_div.innerHTML = element;
    //     new_div.classList.add("field_list_element");
    //     display_dest.appendChild(new_div);

    //     let new_option = document.createElement("input");
    //     new_option.type = "checkbox";
    //     new_option.checked = true;
    //     new_option.name = element;
    //     new_option.value = element;

    //     let new_option_name = document.createElement("div");
    //     new_option_name.innerHTML = element;
    //     new_option_name.style.display = "inline";

    //     checkbox_options.appendChild(new_option);
    //     checkbox_options.appendChild(new_option_name);
    //     checkbox_options.appendChild(document.createElement("br"));
    //   });

    //   this.array_fields[key] = arr;
    // },

    // get_changes_as_array: function(key) {
    //   var form = document.getElementById(key + "_array_edit_container").childNodes;
    //   var len = form.length;

    //   var list = [];

    //   for (var i = 0; i < len; i += 3) {
    //     let input = form[i];
    //     let title = form[i+1];

    //     if (input.checked) {
    //       list.push(title.innerHTML);
    //     }
    //   };

    //   return list;
    // },

  },
}
</script>

<style>
  /*.field_list_element {
    border-radius: 10px;
    border: 2px solid green;
    background-color: lightgreen;
    text-align: center;
  }*/
</style>

