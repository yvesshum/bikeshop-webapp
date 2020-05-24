<template>
  <div class="profile_field_display">

    {{ value_string }}

      <!-- Display each item in an array -->
      <!-- <div v-if="type === 'Array'">
        <div v-for="item in get_original_value()" class="field_list_element">
          {{ item }}
        </div>
      </div> -->

      <!-- Display the string version of the value -->
      <!-- <div v-else>
        {{ get_string() }}
      </div> -->

  </div>
</template>

<script>
// import SpecialInput from '@/components/SpecialInput';
import {get_as_date} from '@/scripts/ParseDB.js';

const moment = require("moment");

export default {
  name: 'profile_field_display',
  props: ['type', 'value'],

  computed: {
    value_string: function() {
      return this.get_value_string(this.value);
    },
  },

  methods: {

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
        // case "Phone":
        //   let num = val + "";
        //   num += "__________".substring(num.length);
        //   return `(${num.substring(0,3)}) ${num.substring(3,6)}-${num.substring(6,10)}`;

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
        case "Date":
          let date = get_as_date(val);
          return date.toDateString();

        // Everything else is fine as is
        default:
          return val;
      }
    },
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
