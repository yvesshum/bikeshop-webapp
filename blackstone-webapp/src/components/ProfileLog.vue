<template>
  <div class="profile_log">
    <CollectionTable
      ref="work_log"
      :heading_data="header_columns"
      :collection="collection"
      groupBy="Period"
      :groupByOptions="periods"
      :progressiveLoad="true"
      :doc_formatter="docFormatter"
      :args="extra_args"
      :visible="visible"
      @table="handle_table"
    ></CollectionTable>

    <FilterDropdown v-for="(col, i) in dropdown_cols" :key="'dropdown'+i"
      @dropdown_obj="obj => save_dropdown_body(col, obj)"
      @filters="col.run_success_func"
      :options="col.options"
      :operations="col.operations"
      :title="headers[col.index].title"
    />
  </div>
</template>

<script>

import CollectionTable from "@/components/CollectionTable.vue"
import FilterDropdown  from "@/components/FilterDropdown.vue"

import {make_range_editor} from "@/scripts/Search.js"
import {custom_filter_editor} from "@/scripts/Search.js"
import {custom_filter_button} from "@/scripts/Search.js"
import {custom_filter_func} from "@/scripts/Search.js"
import {get_as_date} from "@/scripts/ParseDB.js"

const moment = require("moment");

export default {
  name: 'profile_log',
  props: {

    // The collection to display - used by CollectionTable
    collection: Object,

    // The list of periods - used as the grouping mechanism for CollectionTable
    periods: { type: Array, default: () => [] },

    // Whether the table is currently visible - used by CollectionTable to trigger a redraw
    visible: Boolean,

    // The column headers for the table
    headers: { type: Array, default: () => [] },

    // Function to format the collection documents - used by CollectionTable
    docFormatter: Function,

    // The list of hour logging categories
    hourCategories: { type: Array, default: () => [] },
  },
  components: {
    CollectionTable,
    FilterDropdown,
  },

  mounted: async function() {
    this.$emit("load_complete", this);
  },

  data: function() {
    return {
      // Other Tabulator arguments for the tables
      extra_args: {

        // On load, sort all items from most recent to least recent
        initialSort: [
          {column: "Date", dir: "desc"},
        ],
      },

      // The information used to construct each FilterDropdown (parent to child)
      // Indices are NOT associated with column index
      dropdown_cols: [],

      // The functionality exposed by each FilterDropdown component (child to parent)
      // Indices DO match column index
      dropdown_objs: [],
    };
  },

  computed: {
    header_columns: function() {

      this.dropdown_cols = [];

      return this.headers.map((header, index) => {
        if (header.__style__ == undefined) {
          return header;
        }

        // Create variable to store the success function from Tabulator (which will apply the filters)
        let success_func = null;
        let show_status_func = null;
        let run_success_func = (filters) => {

          // Show whether filters are going to be applied
          if (show_status_func != null) {
            show_status_func(filters != null);
          }

          // Pass those filters on to Tabulator
          if (success_func != null) {
            return success_func(filters);
          }
        };


        // Functionality passed down to Tabulator filtering function (parent to child)
        var dropdown_body = {
          show_filter: () => {
            this.dropdown_objs[index].show();
          },
          set_success: (f) => {
            success_func = f;
          },
          set_show_status: (f) => {
            show_status_func = f;
          },
        };

        // Initialize variable to store styling for each column, based on its __style__ field
        var styling;

        switch (header.__style__) {

          case "date":
            styling = {
              formatter: this.format_date,
              ...this.get_date_filter_args(dropdown_body, false),
              sorter: this.date_sorter
            };
            this.dropdown_cols.push({index, run_success_func, ...this.get_date_params(false)});
            break;

          case "datetime":
            styling = {
              formatter: this.format_date_time,
              ...this.get_date_filter_args(dropdown_body, true),
              sorter: this.date_sorter,
            };
            this.dropdown_cols.push({index, run_success_func, ...this.get_date_params(true)});
            break;

          case "time":
            styling = {
              formatter: this.format_time,
              ...this.get_time_filter_args(),
              sorter: this.time_sorter
            };
            break;

          case "work-hours":
            styling = {
              formatter: this.format_work_hours,
              ...this.work_hour_filter_args,
              sorter: this.work_hours_sorter
            };

            // Add the dropdown body
            styling.headerFilterParams.dropdown_body = dropdown_body;
            this.dropdown_cols.push({index, run_success_func, ...this.work_hour_params});
            break;

          case "hours":
            styling = {
              formatter: cell => cell.getValue() + " Hours",
              ...this.get_hour_filter_args(),
              sorter: this.hour_sorter,
            };
            break;

          case "notes":
            styling = {
              formatter: "textarea",
              headerFilter: "input",
            };
            break;
        }

        // Copy over all other fields in header, except for __style__
        Object.keys(header).forEach(key => {
          if (key !== "__style__") {
            styling[key] = header[key];
          }
        });

        return styling;
      });
    },


    work_hour_params: function() {
      return {

        // Allow user to filter by any of the hour categories, or the total amount
        options: this.hourCategories.concat(["Total"]),

        // The filtering operations to support in the dropdown
        operations: [
          { name: "not zero", num_inputs: 0,
            filter: (option_val) => {
              return option_val != 0;
            },
          },
          { name: "at least", inclusive: true,
            filter: (option_val, filter_val, inclusive) => {
              return inclusive ? (option_val >= filter_val) : (option_val > filter_val);
            },
          },
          { name: "at most",  inclusive: true,
            filter: (option_val, filter_val, inclusive) => {
              return inclusive ? (option_val <= filter_val) : (option_val < filter_val);
            }
          },
          { name: "between",  inclusive: true, num_inputs: 2,
            filter: (option_val, filter_vals, inclusive) => {
              return inclusive
                ? (option_val >= filter_vals[0] && option_val <= filter_vals[1])
                : (option_val >  filter_vals[0] && option_val <  filter_vals[1]);
            },
          },
          { name: "exactly",
            filter: (option_val, filter_val) => {
              return option_val == filter_val;
            },
          },
        ],
      };
    },


    work_hour_filter_args: function() {

      // Get the options and operations for work hours
      var {options, operations} = this.work_hour_params;

      return {

        // Use the custom dropdown filter and its associated filtering functionality
        headerFilter:     custom_filter_button,
        headerFilterFunc: custom_filter_func,

        // Parameters for setting up the filter dropdown menu
        headerFilterParams: {

          // Use the work hour options and operations
          options, operations,

          // Center the dropdown around the button
          // In this case, since the work hours is one of the later columns, I think this alignment makes it look a bit nicer
          dropdown_align: "center",
        },

        // Parameters for doing the actual filtering
        headerFilterFuncParams: {

          // Use the operations defined above
          operations,

          // For the filter, no extra logic is needed to decode the value the user is filtering with / searching for
          parse_filter_val: (option, value) => value,

          // For the cells, grab the number of hours for the category that's specified by the filter
          parse_option_val: (option, cell, value) => { // eslint-disable-line no-unused-vars
            return (option == "Total")
              ? this.hourCategories.reduce((acc, curr) => acc + cell[curr], 0)
              : cell[option];
          },
        },
        headerFilterLiveFilter: false,
      };
    },
  },

  methods: {

    redraw: function() {
      this.table.redraw();
    },

    handle_table: function(table) {
      this.$emit("table", table);
    },

    save_dropdown_body: function(col, obj) {
      this.dropdown_objs[col.index] = obj;
    },

    // Source: https://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
    to_decimal_place: function(n, d) {
      return Number(Math.round(parseFloat(n + 'e' + d)) + "e-" + d).toFixed(d);
    },

    // =-= Formatters =-=-=

    // Formatting for the hours column of the Work Log goes here
    format_work_hours: function(cell) {
      var val = cell.getValue();
      var keys = Object.keys(val);
      var msg = "<table style='width: 90%; margin: auto;'>";
      var sum = 0;
      var num_cats = 0;

      // Add a row to the table for each category that has hours logged under it
      keys.forEach(f => {
        if (val[f] > 0) {
          msg += `<tr><td>${f}</td><td style="text-align: right;">${this.to_decimal_place(val[f], 1)}</td></tr>`;
          sum += val[f];
          num_cats++;
        }
      });

      // If there weren't any hours logged in any of the categories, return a special message
      if (num_cats == 0) {
        return `<div style="text-align: center; width: 100%; font-style: italic">No hours logged.</div>`;
      }

      // If more than one category had hours under it, make a "Total" row at the bottom to tally them all up
      if (num_cats > 1) {
        msg += "<tr style='border-top: thin solid'><td>Total</td><td style='text-align: right;'>" + this.to_decimal_place(sum, 1) + "</td></tr>";
      }

      // Close the table and return it
      msg += "</table>";
      return msg;
    },

    format_date_time: function(cell) {
      var val = cell.getValue();
      var date = get_as_date(val);

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
        let date1 = get_as_date(val[0]);
        let date2 = get_as_date(val[1]);

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
        let date = get_as_date(val);
        day     = this.get_date(date);
        weekday = this.get_weekday(date);
      }

      return `<div>${day}<br />${weekday}</div>`;
    },

    format_time: function(cell) {
      var val = cell.getValue();
      var date = get_as_date(val);

      var time = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZoneName: "short",
      });

      return `<div>${time}</div>`;
    },



    // =-= Filters =-=-=

    numeric_range_filter: function(search_range, option) {

      let above = search_range.min == null ? true : option >= parseFloat(search_range.min);
      let below = search_range.max == null ? true : option <= parseFloat(search_range.max);

      return above && below;
    },

    hour_range_filter: function(search_range, option) {
      return this.numeric_range_filter(search_range, this.get_hours_sum(option));
    },

    time_range_filter: function(search_range, option) {

      // Interpret the current cell's value
      var val = get_as_date(option);
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



    // =-= Sorters =-=-=

    date_sorter: function(a, b, aRow, bRow, column, dir, sorterParams) { // eslint-disable-line no-unused-vars
      let a_date = (Array.isArray(a)) ? get_as_date(a[0]) : get_as_date(a);
      let b_date = (Array.isArray(b)) ? get_as_date(b[0]) : get_as_date(b);
      return a_date.getTime() - b_date.getTime();
    },

    time_sorter: function(a, b, aRow, bRow, column, dir, sorterParams) { // eslint-disable-line no-unused-vars

      // Get both as dates
      let a_date = get_as_date(a);
      let b_date = get_as_date(b);

      // Get differences in hours, minutes, and seconds
      let h_diff = a_date.getHours() - b_date.getHours();
      let m_diff = a_date.getMinutes() - b_date.getMinutes();
      let s_diff = a_date.getSeconds() - b_date.getSeconds();

      return h_diff ? h_diff : (m_diff ? m_diff : s_diff);
    },

    hour_sorter: function(a, b, aRow, bRow, column, dir, sorterParams) { // eslint-disable-line no-unused-vars
      return a - b;
    },

    work_hours_sorter: function(a, b, aRow, bRow, column, dir, sorterParams) { // eslint-disable-line no-unused-vars
      return this.get_hours_sum(a) - this.get_hours_sum(b);
    },



    // Predefined column arguments for dates and for hours

    // If headerFilterLiveFilter isn't set to false, the filters will apply then disappear unless the user clicks out of the box

    get_time_filter_args: function() {
      return {
        headerFilter: make_range_editor("time"),
        headerFilterFunc: this.time_range_filter,
        headerFilterLiveFilter: false,
      };
    },

    get_date_filter_args: function(dropdown_body, include_time) {

      var {options, operations} = this.get_date_params(include_time);

      return {
        headerFilter:     custom_filter_button,
        headerFilterFunc: custom_filter_func,
        headerFilterParams: {
          options,
          operations,
          dropdown_body,
        },
        headerFilterFuncParams: {
          options, operations,
          get_cell_val: (option) => get_as_date(Array.isArray(option) ? option[0] : option),
          parse_filter_val: this.parse_filter_val_date,
          parse_option_val: this.parse_option_val_date,

        },
        headerFilterLiveFilter: false,
      };
    },

    get_hour_filter_args: function() {
      return {
        headerFilter: make_range_editor("number"),
        headerFilterFunc: this.numeric_range_filter,
        headerFilterParams: {minimum: 0, step: 0.5},
        headerFilterLiveFilter: false,
      };
    },


    get_date_params: function(include_time) {

      // Make the list of options
      let options = ["Year", "Month", "Date", "Weekday"];
      if (include_time) options.push("Time");

      return {
        options,
        operations: [
          { name: "is",
            filter: (option_val, filter_val) => {
              return option_val == filter_val;
            },
          },
          { name: "is not",
            filter: (option_val, filter_val) => {
              return option_val != filter_val;
            },
          },
          { name: "before", inclusive: true,
            filter: (option_val, filter_val, inclusive) => {
              return inclusive ? (option_val <= filter_val) : (option_val < filter_val);
            }
          },
          { name: "after", inclusive: true,
            filter: (option_val, filter_val, inclusive) => {
              return inclusive ? (option_val >= filter_val) : (option_val > filter_val);
            },
          },
          { name: "between",     inclusive: true, num_inputs: 2,
            filter: (option_val, filter_vals, inclusive) => {
              return inclusive
                ? (option_val >= filter_vals[0] && option_val <= filter_vals[1])
                : (option_val >  filter_vals[0] && option_val <  filter_vals[1]);
            },
          },
          { name: "not between", inclusive: true, num_inputs: 2,
            filter: (option_val, filter_vals, inclusive) => {
              return inclusive
                ? (option_val <= filter_vals[0] || option_val >= filter_vals[1])
                : (option_val <  filter_vals[0] || option_val >  filter_vals[1]);
            },
          }
        ],
      };
    },



    // Filter functions for getting the right value from a date cell

    parse_filter_val_date: function(option, value) {

      // Catch empty input
      if (value == undefined) return undefined;

      // Determine value based on option type
      /* eslint-disable no-case-declarations */
      switch (option) {
        case "Year":
        case "Date":
          return parseInt(value);

        case "Month":
          return this.find_in(moment.months(), value, "month");

        case "Weekday":
          return this.find_in(moment.weekdays(), value, "weekday");

        // Convert to seconds to take advantage of comparison switch block
        case "Time":

          // If input string contains "PM" (case-insensitive), add 12 hours to the final count
          // Otherwise, start from 0 seconds
          let afternoon = value.match(/[Pp](?=[Mm])/);
          let result = (afternoon == null) ? 0 : (12 * 60 * 60);

          // Split user input into hours, mins, and seconds
          // Grab all groups of one or two numbers followed by valid separator character
          let split_time = value.match(/[0-9][0-9]?(?=[: \n$Pp])/g).map(n=>parseInt(n));

          // Take advantage of fall-thru to convert as much of split_time as exists to seconds
          // This means that a time like "1:22PM" will match the query "1PM", but not the query "1:00PM"
          /* eslint-disable no-fallthrough */
          switch (split_time.length) {
            case 3:
              result += split_time[2];
            case 2:
              result += split_time[1] * 60;
            case 1:
              result += split_time[0] * 60 * 60;
          }
          /* eslint-enable no-fallthrough */


          return result;
      }
      /* eslint-enable no-case-declarations */

    },

    parse_option_val_date: function(option, date, value) {
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
          let result = 0; // eslint-disable-line no-case-declarations

          // Split user input into hours, mins, and seconds
          let split_time = this.parse_time_str(value); // eslint-disable-line no-case-declarations

          // Take advantage of fall-thru to convert as much of split_time as exists to seconds
          // This means that a time like "1:22PM" will match the query "1PM", but not the query "1:00PM"
          /* eslint-disable no-fallthrough */
          switch (split_time.length) {
            case 3:
              result += date.getSeconds();
            case 2:
              result += date.getMinutes() * 60;
            case 1:
              result += date.getHours() * 60 * 60;
          }
          /* eslint-enable no-fallthrough */


          return result;
      }
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

    get_hours_sum: function(hours) {
      return Object.keys(hours).reduce((a,c) => hours[c] == null ? a : (a + hours[c]), 0);
    },


    // Grab all groups of one or two numbers followed by valid separator character
    parse_time_str: function(str) {
      return str.match(/[0-9][0-9]?(?=[: \n$Pp])/g).map(n=>parseInt(n));
    },

    find_in: function(arr, val, type) { // eslint-disable-line no-unused-vars

      // If input is a number within the proper index, use it as the search term
      if (typeof val == "number") {
        if (val >= 0 && val < arr.length) {
          return val;
        }
        // console.warn(`Index ${val} out of bounds for ${type} array ${arr}`);
        return null;
      }

      // Filter the array down to all entries starting with the given value
      // Ideally the user will have entered an unambiguous shortening for the desired value
      let fil = arr.filter(item => item.startsWith(val));
      switch (fil.length) {
        case 0:
          // console.warn(`Unknown ${type} "${val}".`);
          break;
        case 1:
          return arr.indexOf(fil[0]);
        default:
          // console.warn(`Ambiguous ${type} "${val}". Did you mean one of the following? ${fil}`);
          break;
      }
      return null;
    },

  }
}
</script>