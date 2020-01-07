<template>
  <div class="profile_lookup_staff">
    <TopBar/>
    <p>This is the staff view of the youth profile lookup page</p>

    <YouthIDSelector @selected="load_youth"/>
    <br />

    <div ref="body_fields" v-show="currentProfile != null">
      <ProfileFields :profile="currentProfile" :headerDoc="header_doc" :periodData="period_data" edit showOptionalFields />

      <br />

      <ApronBar :profile="currentProfile" />

      <br /><br />

      <h2>Order Log</h2>
      <CollectionTable
        ref="order_log"
        :heading_data="order_log_headers"
        :collection="order_log_collection"
        groupBy="Period"
        :groupByOptions="periods"
        :progressiveLoad="true"
        style="width:90%;margin:auto;"
      ></CollectionTable>

      <br />

      <h2>Work Log</h2>
      <CollectionTable
        ref="work_log"
        :heading_data="work_log_headers"
        :collection="work_log_collection"
        groupBy="Period"
        :groupByOptions="periods"
        :progressiveLoad="true"
        :doc_formatter="doc_formatter"
        style="width:90%;margin:auto;"
      ></CollectionTable>

      <br /><br />
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../../firebase';
import {firebase} from '../../firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import TopBar from '@/components/TopBar';
import YouthIDSelector from "@/components/YouthIDSelector.vue"
import ProfileFields from "@/components/ProfileFields.vue"
import ApronBar from "@/components/ApronBar.vue"
import CollectionTable from "@/components/CollectionTable.vue"
import {Period} from "@/components/Period.js";
import {mapKeyVal} from "@/components/ParseDB.js";
import {make_range_editor} from "@/components/Search.js"

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileFields,
    ApronBar,
    CollectionTable,
  },

  data: function() {
    return {
      currentProfile: null,
      order_log_collection: null,
      work_log_collection: null,
      header_doc: null,

      log_headers_doc: null,

      order_log_headers: [],

      periods_db: db.collection("GlobalPeriods"),
      periods_doc: null,
      period_data: null,
      periods: [],


      work_log_headers: [
        { // The Date
          title: "Date", field: "Date", formatter: this.format_date,
          headerFilter: true, headerFilterFunc: this.date_filter,
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
          headerFilter: make_range_editor("number"),
          headerFilterParams: {minimum: 0},
          headerFilterFunc: this.numeric_range_filter,
        },
        "Notes",
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
          headerFilter: true, headerFilterFunc: this.date_filter,
        },
        { // The cost of the item (in hours)
          title: "Cost", field: "Item Total Cost",
          formatter: (cell) => cell.getValue() + " Hours",
          headerFilter: make_range_editor("number"),
          headerFilterParams: {minimum: 0},
          headerFilterFunc: this.numeric_range_filter,
        },
        "Notes",
      ],

      // Helper function to group document data for the table
      doc_formatter: (doc) => {
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

  mounted: async function() {
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();

    await this.load_profile_data();
  },

    methods: {

      load_profile_data: async function() {
        this.periods_doc = await this.periods_db.doc("metadata").get();
        var data = this.periods_doc.data();

        await Period.setSeasons(data["Seasons"]);
        this.periods = Period.enumerateStr(data["CurrentPeriod"], data["FirstPeriod"]);

        this.period_data = {
          cur_period: data["CurrentPeriod"],
          reg_period: data["CurrentRegistrationPeriod"],
          seasons:    data["Seasons"],
          class_list: mapKeyVal(data["Classes"], (name, desc) => name),
        };
      },

      load_youth: async function(youth) {

        // No id returned - clear the page
        if (youth == null) {
          this.currentProfile = null;
          this.order_log_collection = null;
          this.work_log_collection  = null;
        }

        // Id returned - load profile for that youth
        else {
          let snapshot = db.collection("GlobalYouthProfile").doc(youth.ID);

          this.currentProfile = await snapshot.get();
          this.order_log_collection = snapshot.collection("Order Log");
          this.work_log_collection  = snapshot.collection("Work Log");
        }
      },

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

      date_filter: function(search_term, option) {
        var date1 = option.In.toDate();
        var date2 = option.Out.toDate();
        var formatted_date = this.format_date(date1, date2).replace(/<.+?>/g, " ").toLowerCase();

        return formatted_date.indexOf(search_term.toLowerCase()) >= 0;
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

      same_day: function(date1, date2) {

        return date1.getDate() === date2.getDate()
          && date1.getMonth() === date2.getMonth()
          && date1.getFullYear() === date2.getFullYear();
      },

      get_weekday: function(date) {
        return date.toLocaleDateString(undefined, {weekday: "long"});
      },

      get_date: function(date) {
        return date.toLocaleDateString(undefined, {dateStyle: "long"})
      },

      numeric_range_filter: function(search_range, option) {

        let above = search_range.min == null ? true : option >= parseInt(search_range.min);
        let below = search_range.max == null ? true : option <= parseInt(search_range.max);

        return above && below;
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
    }
}
</script>