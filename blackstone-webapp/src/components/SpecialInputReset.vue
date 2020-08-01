<template>
  <div class="special_input_reset">

    <SpecialInput ref="edit_input" :inputType="type" :arguments="input_args" v-model="edit_value" style="display: inline-block;">
    </SpecialInput>

    <b-button ref="reset_button" squared :disabled="!changed" :variant="reset_variant" v-on:click="reset()" style="display: inline-block; float: right;" v-b-tooltip.hover.html="tooltip_data">
      <div v-if="get_original_string().length == 0">Clear</div>
      <div v-else>Reset</div>
    </b-button>

  </div>
</template>

<script>
import SpecialInput from '@/components/SpecialInput';

const moment = require("moment");

export default {
  name: 'special_input_reset',
  props: ['name', 'type', 'defaultValue'],
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

  watch: {
    defaultValue: function(new_val) {
      this.edit_value = new_val;
    },
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

    tooltip_data: function() {
      return (this.changed && this.get_original_string().length > 0)
        ? `Reset to ${this.get_original_string()}`
        : "";
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

        // Display a date in standard datestring format
        // TODO: Native js Date() is setting one day behind, for some reason
        case "Date":
          let date = this.get_as_date(val);
          return date.toDateString();

        // Everything else is fine as is
        default:
          return val;
      }
    },

    is_blank: function() {
      return this.edit_value === undefined || this.edit_value === null || this.edit_value === "";
    },

    // Error checking to get a Date object from the database
    // Should be a Timestamp, but handles error in case it isn't
    get_as_date: function(date_obj) {
      return (date_obj.toDate == undefined)
        ? new Date(date_obj.seconds * 1000)
        : date_obj.toDate();
    },
  },
}
</script>
