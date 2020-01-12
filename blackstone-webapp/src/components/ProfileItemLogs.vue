<template>
  <div class="profile_item_logs">
    <h2>Work Log</h2>
    <CollectionTable
      ref="work_log"
      :heading_data="work_log_headers"
      :collection="work_log_collection"
      groupBy="Period"
      :groupByOptions="periods"
      :progressiveLoad="true"
      :doc_formatter="work_doc_formatter"
      :visible="visible"
      style="width:90%;margin:auto;"
    ></CollectionTable>

    <br />

    <h2>Order Log</h2>
    <CollectionTable
      ref="order_log"
      :heading_data="order_log_headers"
      :collection="order_log_collection"
      groupBy="Period"
      :groupByOptions="periods"
      :progressiveLoad="true"
      :visible="visible"
      style="width:90%;margin:auto;"
    ></CollectionTable>

    <br />

    <h2>Hour Transfer Log</h2>
    <CollectionTable
      ref="transfer_log"
      :heading_data="trans_log_headers"
      :collection="trans_log_collection"
      groupBy="Period"
      :groupByOptions="periods"
      :progressiveLoad="true"
      :visible="visible"
      style="width:90%;margin:auto;"
    ></CollectionTable>
  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../firebase';
import {firebase} from '../firebase';
import CollectionTable from "@/components/CollectionTable.vue"
import {filter} from "@/scripts/Search.js";
import {make_range_editor} from "@/scripts/Search.js"
import {custom_filter_editor} from "@/scripts/Search.js"

const moment = require("moment");
var Tabulator = require("tabulator-tables");

export default {
  name: 'profile_item_logs',
  props: ["snapshot", "periods", "visible"],
  components: {
    CollectionTable,
  },

  data: function() {
    return {
      work_log_collection: null,
      order_log_collection: null,
      trans_log_collection: null,

      work_log_table: null,
      order_log_table: null,

      work_log_headers: [
        { // The Date
          title: "Date", field: "Date", formatter: this.format_date,
          ...this.get_date_filter_args(false),
        },
        { // The check in time
          title: "Check In", field: "Check In", formatter: this.format_time,
          headerFilter: make_range_editor("time"), headerFilterFunc: this.time_range_filter,
        },
        { // The check out time
          title: "Check Out", field: "Check Out", formatter: this.format_time,
          headerFilter: make_range_editor("time"), headerFilterFunc: this.time_range_filter,
        },
        { // The hours earned, broken down by category
          title: "Hours", field: "Hours", formatter: this.format_work_hours,
          ...this.get_hour_filter_args(),
          headerFilterFunc: this.hour_range_filter,
        },
        { // Notes
          title: "Notes", field: "Notes", formatter: this.format_notes,
          headerFilter: true,
        },
      ],

      order_log_headers: [
        { // The name of the item
          title: "Item Name", field: "Item Name", headerFilter: true,
        },
        { // The ID number of the item
          title: "Item ID", field: "Item ID", headerFilter: true,
        },
        { // The date and time of the order
          title: "Date", field: "Order Date", formatter: this.format_date_time,
          ...this.get_date_filter_args(true),
        },
        { // The cost of the item (in hours)
          title: "Cost", field: "Item Total Cost",
          formatter: cell => cell.getValue() + " Hours",
          ...this.get_hour_filter_args(),
        },
        { // Notes
          title: "Notes", field: "Notes", formatter: this.format_notes,
          headerFilter: true,
        },
      ],

      trans_log_headers: [
        { // The name of the recipient
          title: "To Name", field: "To Name",
          headerFilter: true, headerFilterFunc: filter
        },
        { // The ID of the recipient
          title: "To ID", field: "To ID", headerFilter: true,
        },
        { // The number of hours transferred
          title: "Amount Transferred", field: "Amount",
          formatter: cell => cell.getValue() + " Hours",
          ...this.get_hour_filter_args(),
        },
        { // The date and time of the order
          title: "Date", field: "Date", formatter: this.format_date,
          ...this.get_date_filter_args(false),
        },
        { // Notes
          title: "Notes", field: "Notes", formatter: this.format_notes,
          headerFilter: true,
        },
      ],

      // Helper function to group document data for the work log table
      work_doc_formatter: (doc) => {
        var data = doc.data();
        return {
          "Date": [ data["Check In"], data["Check Out"] ],
          "Check In": data["Check In"],
          "Check Out": data["Check Out"],
          "Hours": {
            "Class": data["Class"],
            "Elective": data["Elective"],
            "Bike Riding or Cycling": data["Bike Riding or Cycling"],
            "Shop Support": data["Shop Support"],
            "Other": data["Other"],
            "Misc": data["Misc"],
          },
          "Notes": data["Notes"],
          "Period": data["Period"],
        };
      },
    };
  },

  computed: {
    // work_log_table: function() {
    //   console.log(this.$refs.work_log);
    //   console.log(this.$refs.work_log["table"]);
    //   console.log(this.$refs.work_log.$data);
    //   console.log(this.$refs.work_log.$data.table);
    //   return this.$refs.work_log.table;
    // },
  },

  watch: {
    snapshot: function(snapshot) {
      console.log(snapshot);

      if (snapshot == null) {
        this.work_log_collection  = null;
        this.order_log_collection = null;
        this.trans_log_collection = null;
      }

      else {
        this.work_log_collection  = snapshot.collection("Work Log");
        this.order_log_collection = snapshot.collection("Order Log");
        this.trans_log_collection = snapshot.collection("Transfer Log");
      }
    },
  },

  methods: {

    // =-= Formatters =-=-=

    // Formatting for the hours column of the Work Log goes here
    format_work_hours: function(cell) {
      var val = cell.getValue();
      var keys = Object.keys(val);
      var msg = "<table>";
      var sum = 0;

      keys.forEach(f => {
        if (val[f] > 0) {
          msg += `<tr><td>${f}:</td><td>${val[f]}</td></tr>`;
          sum += val[f];
        }
      });
      msg += "<tr><td>Total:</td><td>" + sum + "</td></tr>";
      msg += "</table>";

      return msg;
    },

    format_date_time: function(cell) {
      var val = cell.getValue();
      var date = val.toDate();

      var day     = this.get_date(date);
      var weekday = this.get_weekday(date);
      var time    = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZoneName: "short",
      });

      return `<div>${day}<br />${weekday} &emsp; ${time}</div>`;
    },

    format_date: function(cell) {
      var day, weekday;
      var val = cell.getValue();

      if (Array.isArray(val)) {
        let date1 = val[0].toDate();
        let date2 = val[1].toDate();

        if (this.same_day(date1, date2)) {
          day     = this.get_date(date1);
          weekday = this.get_weekday(date1);
        }
        else {
          day = date1.toLocaleDateString(undefined, {month: "short", day: "numeric"}) + " - " + date2.toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"});
          weekday = `${this.get_weekday(date1)} - ${this.get_weekday(date2)}`;
        }

      }

      else {
        let date = val.toDate();
        day     = this.get_date(date);
        weekday = this.get_weekday(date);
      }

      return `<div>${day}<br />${weekday}</div>`;
    },

    format_time: function(cell) {
      var val = cell.getValue();
      var date = val.toDate();

      var time = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZoneName: "short",
      });

      return `<div>${time}</div>`;
    },

    format_notes: function(cell) {
      let val = cell.getValue();
      return `<i>${val == null ? "" : val}</i>`
    },



    // =-= Filters =-=-=

    date_filter: function(filters, option) {

      var datestamp = Array.isArray(option) ? option[0] : option;
      var date = datestamp.toDate();

      // Result will be true if every filter passes
      var result = filters.every(filter => {

        // Parse desired value(s) from filter and actual value from user input
        var option_val = parse_option_val(filter.option, date, filter.value);
        var filter_val = parse_filter_val(filter.option, filter.value);
        var second_val = parse_filter_val(filter.option, filter.value2);

        // If the search term was invalid for some reason, skip over this filter
        if (filter_val == null) return true;

        // By this point, option_val holds the appropriate value of the current cell,
        // and filter_val holds the desired value from the filter, e.g.
        //    option_val = 2019
        //    filter_val = 2015

        // Compare the option value and filter value based on the given operation
        switch (filter.op) {
          case "is":
            return option_val == filter_val;

          case "is not":
            return option_val != filter_val;

          case "before":
            return filter.inclusive
              ? (option_val <= filter_val)
              : (option_val < filter_val);

          case "after":
            return filter.inclusive
              ? (option_val >= filter_val)
              : (option_val > filter_val);

          case "between":
            return filter.inclusive
              ? (option_val >= filter_val && option_val <= second_val)
              : (option_val >  filter_val && option_val <  second_val);

          case "not between":
            return filter.inclusive
              ? (option_val <= filter_val || option_val >= second_val)
              : (option_val <  filter_val || option_val >  second_val);
        }
      });

      return result;


      function find_in(arr, val, type) {

        // If input is a number within the proper index, use it as the search term
        if (typeof val == "number") {
          if (val >= 0 && val < arr.length) {
            return val;
          }
          console.warn(`Index ${val} out of bounds for ${type} array ${arr}`);
          return null;
        }

        // Filter the array down to all entries starting with the given value
        // Ideally the user will have entered an unambiguous shortening for the desired value
        let fil = arr.filter(item => item.startsWith(val));
        switch (fil.length) {
          case 0:
            console.warn(`Unknown ${type} "${val}".`);
            break;
          case 1:
            return arr.indexOf(fil[0]);
          default:
            console.warn(`Ambiguous ${type} "${val}". Did you mean one of the following? ${fil}`);
            break;
        }
        return null;
      }

      function parse_filter_val(option, value) {

        // Catch empty input
        if (value == undefined) return undefined;

        // Determine value based on option type
        switch (option) {
          case "Year":
          case "Date":
            return parseInt(value);

          case "Month":
            return find_in(moment.months(), value, "month");

          case "Weekday":
            return find_in(moment.weekdays(), value, "weekday");

          // Convert to seconds to take advantage of comparison switch block
          case "Time":

            // If input string contains "PM" (case-insensitive), add 12 hours to the final count
            // Otherwise, start from 0 seconds
            let afternoon = filter.value.match(/[Pp](?=[Mm])/);
            let result = (afternoon == null) ? 0 : (12 * 60 * 60);

            // Split user input into hours, mins, and seconds
            // Grab all groups of one or two numbers followed by valid separator character
            let split_time = filter.value.match(/[0-9][0-9]?(?=[: \n$Pp])/g).map(n=>parseInt(n));

            // Take advantage of fall-thru to convert as much of split_time as exists to seconds
            // This means that a time like "1:22PM" will match the query "1PM", but not the query "1:00PM"
            switch (split_time.length) {
              case 3:
                filter_val += split_time[2];
              case 2:
                filter_val += split_time[1] * 60;
              case 1:
                filter_val += split_time[0] * 60 * 60;
            }

            return result;
        }
      }

      function parse_option_val(option, date, value) {
        switch (option) {
          case "Year":
            return date.getFullYear();

          case "Month":
            return date.getMonth();

          case "Date":
            return date.getDate();

          case "Weekday":
            return date.getDay();

          // Convert to seconds to take advantage of next switch block
          case "Time":

            // Initialize result to 0 seconds
            let result = 0;

            // Split user input into hours, mins, and seconds
            let split_time = parse_time_str(value);

            // Take advantage of fall-thru to convert as much of split_time as exists to seconds
            // This means that a time like "1:22PM" will match the query "1PM", but not the query "1:00PM"
            switch (split_time.length) {
              case 3:
                result += date.getSeconds();
              case 2:
                result += date.getMinutes() * 60;
              case 1:
                result += date.getHours() * 60 * 60;
            }

            return result;
        }
      }

      // Grab all groups of one or two numbers followed by valid separator character
      function parse_time_str(str) {
        return str.match(/[0-9][0-9]?(?=[: \n$Pp])/g).map(n=>parseInt(n));
      }
    },

    numeric_range_filter: function(search_range, option) {

      let above = search_range.min == null ? true : option >= parseInt(search_range.min);
      let below = search_range.max == null ? true : option <= parseInt(search_range.max);

      return above && below;
    },

    hour_range_filter: function(search_range, option) {
      let sum = Object.keys(option).reduce((a,c) => option[c] == null ? a : (a + option[c]), 0);
      return this.numeric_range_filter(search_range, sum);
    },

    time_range_filter: function(search_range, option) {

      // Interpret the current cell's value
      var val = option.toDate();
      var hour = val.getHours().toString();
      var mins = val.getMinutes().toString();
      var time = [hour, mins];

      // Initialize variables to tell whether option is too early or too late
      var above = true, below = true;

      // If a minimum range was passed, compare it to the current option
      if (search_range.min != null) {
        let min = search_range.min.split(":");
        above = time_strings_leq(min, time);
      }

      // If a maximum range was passed, compare it to the current option
      if (search_range.max != null) {
        let max = search_range.max.split(":");
        below = time_strings_leq(time, max);
      }

      // If the maximum is earlier than the minimum, then the range extends through midnight
      // from one day into the next, essentially
      // In this case we invert the search space - anything after the min OR before the max
      // For example, given the range 9PM to 2AM, the times 10PM and 1AM are both valid,
      // even though technically 10PM is after the max of 2AM, and 1AM is before the min 9PM
      var inverted = search_range.min != null
        && search_range.max != null
        && search_range.min > search_range.max;

      // Return true if the option is at earliest the min value and at latest the max value
      return inverted ? (above || below) : (above && below);


      // Helper functions - return true if t1 <= t2
      // Takes arguments of the form ["01", "00"] for 1AM
      function time_strings_leq(t1, t2) {
        let h1 = parseInt(t1[0]), h2 = parseInt(t2[0]);
        let m1 = parseInt(t1[1]), m2 = parseInt(t2[1]);
        return (h1 < h2) || (h1 == h2 && m1 <= m2);
      }
    },



    // Predefined column arguments for dates and for hours

    get_date_filter_args: function(include_time) {
      let options = ["Year", "Month", "Date", "Weekday"];
      if (include_time) options.push("Time");

      return {
        headerFilter: custom_filter_editor,
        headerFilterFunc: this.date_filter,
        headerFilterParams: {
          options,
          operations: [
            "is", "is not",
            {name: "before", inclusive: true},
            {name: "after",  inclusive: true},
            {name: "between",     inclusive: true, num_inputs: 2},
            {name: "not between", inclusive: true, num_inputs: 2}
          ],
        },
      };
    },

    get_hour_filter_args: function() {
      return {
        headerFilter: make_range_editor("number"),
        headerFilterFunc: this.numeric_range_filter,
        headerFilterParams: {minimum: 0},
      };
    },



    // Helper functions for dealing with time

    // Check whether two datetimes occur on the same date
    same_day: function(date1, date2) {

      return date1.getDate() === date2.getDate()
        && date1.getMonth() === date2.getMonth()
        && date1.getFullYear() === date2.getFullYear();
    },

    // Get the string representation of the weekday of a date
    get_weekday: function(date) {
      return date.toLocaleDateString(undefined, {weekday: "long"});
    },

    // Get the string representation of a date
    get_date: function(date) {
      return date.toLocaleDateString(undefined, {dateStyle: "long"})
    },
  }
}
</script>