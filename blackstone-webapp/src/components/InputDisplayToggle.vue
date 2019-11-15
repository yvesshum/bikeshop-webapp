<template>
  <div class="input_display_toggle">

    <div ref="display" v-if="!editMode">

      <!-- Display each item in an array -->
      <div v-if="type === 'Array'">
        <div v-for="item in get_original_value()" class="field_list_element">
          {{ item }}
        </div>
      </div>

      <!-- Display the string version of the value -->
      <div v-else>
        {{ get_original_string() }}
      </div>
    </div>

    <div ref="edit_container" v-else>
      <SpecialInput ref="edit_input" :inputType="type" :arguments="input_args" v-model="edit_value">
      </SpecialInput>
      <b-button ref="reset_button" squared :variant="reset_variant" v-on:click="reset()">
        <div v-if="changed">
          <span v-if="get_original_string().length > 0">
            Reset to {{get_original_string()}}
          </span>
          <span v-else>Clear</span>
        </div>
        <div v-else>Reset</div>
      </b-button>
    </div>

  </div>
</template>

<script>
import SpecialInput from '@/components/SpecialInput';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default {
  name: 'input_display_toggle',
  props: ['editMode', 'name', 'type', 'defaultValue'],
  components: {
    SpecialInput
  },

  data: function() {
    return {
      edit_value: undefined,
    }
  },

  mounted: function() {
    this.edit_value = this.defaultValue;
    this.$emit("Mounted", this);
  },

  computed: {
    reset_variant: function() {
      return (this.changed) ? "danger" : "outline-secondary";
    },

    changed: function() {
      return this.edit_value != this.defaultValue;
    },

    input_args: function() {
      if (Array.isArray(this.defaultValue)) {
        return {};
      }
      return {
        value: this.defaultValue,
        align: "center",
      };
    },
  },

  methods: {

    reset: function() {
      this.edit_value = this.defaultValue;
      this.$emit("Reset", this.edit_value);
    },

    emit_changes: function() {
      this.$emit("Changed", this.changed);
    },

    get_original_value: function() {
      return this.defaultValue;
    },

    get_changed_value: function() {
      return this.edit_value;
    },

    get_original_string: function() {
      return this.get_value_string(this.get_original_value());
    },

    get_changed_string: function() {
      return this.get_value_string(this.get_changed_value());
    },

    get_value_string: function(val) {

      // Display a null value as an empty string
      if (val == null) return "";

      // Display non-null values according to their type
      switch (this.type) {

        // Display a boolean as "Yes" or "No"
        case "Boolean":
          return val ? "Yes" : "No";
          break;

        // Display a phone number in (___) ___-____ format, complete with underscores
        case "Phone":
          let num = val + "";
          num += "__________".substring(num.length);
          return `(${num.substring(0,3)}) ${num.substring(3,6)}-${num.substring(6,10)}`;

        // Display an array as a list with commas
        case "Array":
          let arr = "";
          val.forEach(item => arr += item + ", ");
          return arr;

        // Display a time in 12h format (as opposed to 24h)
        case "Time":
          let time = val.split(":");
          let hh = Number(time[0]);
          let pm = hh > 12;
          let h = pm ? (hh - 12) : (hh == 0 ? 12 : hh);

          return `${h}:${time[1]} ${pm ? "PM" : "AM"}`;

        // Display a date in "Month DD, YYYY" format
        // TODO: Native js Date() is setting one day behind, for some reason
        case "Date":
          // let d = new Date(val);
          // console.log("Date val: ", val);
          // console.log("Date: ", d);
          // return d.toLocaleDateString(undefined, {
          //   day:     'numeric',
          //   month:   'long',
          //   year:    'numeric'
          // });
          let date = {
            year: val.substring(0, val.indexOf("-")),
            month: Number(val.substring(val.indexOf("-")+1, val.lastIndexOf("-")))-1,
            day: val.substring(val.lastIndexOf("-")+1),
          };
          return `${months[date.month]} ${date.day}, ${date.year}`;

        // Everything else is fine as is
        default:
          return val;
      }
    },

    is_blank: function() {
      return this.edit_value === null || this.edit_value === "";
    },


    // set_all_input_vals: function(input, val) {
    //   if (input != null) {
    //     input.placeholder  = val;
    //     input.value        = val;
    //     input.defaultValue = val;
    //   };
    // },
  },
}
</script>

<style>
  .field_list_element {
    border-radius: 10px;
    border: 2px solid green;
    background-color: lightgreen;
    text-align: center;
  }
</style>

