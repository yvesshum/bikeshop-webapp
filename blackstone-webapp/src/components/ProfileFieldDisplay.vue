<template>
  <div class="profile_field_display">
    <div v-if="type!='Essay'" >
      {{ value_string }}
    </div>
    <pre v-else class="essay">{{value_string}}</pre>
  </div>
</template>

<script>
// import SpecialInput from '@/components/SpecialInput';
import {get_as_date} from '@/scripts/ParseDB.js';

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
        /* eslint-disable no-case-declarations */

        // Display a boolean as "Yes" or "No"
        case "Boolean":
          return val ? "Yes" : "No";

        // Display a phone number in (___) ___-____ format, complete with underscores
        // case "Phone":
        //   let num = val + "";
        //   num += "__________".substring(num.length);
        //   return `(${num.substring(0,3)}) ${num.substring(3,6)}-${num.substring(6,10)}`;

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
        
        case "Essay":
          let essays = val;
          var essayText = "";
          for(const cls in essays){
            essayText += "Class - " + cls + ":\n";
            for (const question in essays[cls]){
              essayText += "\tQuestion: " + question.split("\\n").join("\n\t") + "\n";
              essayText += "\tAnswer: " + essays[cls][question].split("\\n").join("\n\t") + "\n";
              essayText += "\t--------\n"
            }
          }
          essayText = essayText.trim();
          // console.log(essayText);
          return essayText;
          

        // Everything else is fine as is
        default:
          return val;
      }
      /* eslint-enable no-case-declarations */


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
  
  .essay {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    font-size: 16px;
    overflow-x: auto;
    display: inline;
    word-wrap: break-word;
    text-align: left;
  }
</style>
