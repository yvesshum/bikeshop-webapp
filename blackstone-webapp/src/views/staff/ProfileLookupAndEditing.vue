<template>
  <div class="profile_lookup_staff">
    <TopBar/>
    <p>This is the staff view of the youth profile lookup page</p>

    <!-- Replaced selector bar with static buttons to test without spamming firebase -->
    <YouthIDSelector @selected="load_youth"/>
    <!-- <button ref="adam_button" v-on:click="load_adam()">Load Adam's Profile</button> -->
    <!-- <button ref="yves_button" v-on:click="load_yves()">Load Yves's Profile</button> -->
    <!-- <button ref="none_button" v-on:click="load_none()">Clear Profile Info</button> -->

    <div ref="body_fields" style="display: none;">
      <ProfileFields :profile="currentProfile" :headerDoc="header_doc" edit showOptionalFields />
      <!-- <ApronBar /> -->

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

      work_log_headers_omit: ["First Name", "Last Name", "Youth ID"],

      periods: [],



      work_log_headers: [
        { // The Date
          title: "Date", field: "Date", formatter: this.format_date,
          headerFilter: true, headerFilterFunc: this.date_filter,
        },
        { // The check in time
          title: "Check In", field: "Check In", formatter: this.format_time,
          headerFilter: "number", headerFilterFunc: this.time_filter,
        },
        { // The check out time
          title: "Check Out", field: "Check Out", formatter: this.format_time,
          headerFilter: "number", headerFilterFunc: this.time_filter,
        },
        { // The hours earned, broken down by category
          title: "Hours", field: "Hours", formatter: this.format_work_hours
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
          formatter: (cell) => cell.getValue() + " Hours"
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

    let periods_doc = await db.collection("GlobalVariables").doc("ActivePeriods").get();
    let periods_data = periods_doc.data();
    this.periods = [periods_data["CurrentPeriod"], ...periods_data["PastPeriods"]];
  },

    methods: {

      load_youth: async function(youth) {

        // No id returned - clear the page
        if (youth == null) {
          this.load_none();
        }

        // Id returned - load profile for that youth
        else {
          this.$refs.body_fields.style.display = "";

          let snapshot = db.collection("GlobalYouthProfile").doc(youth.ID);

          this.currentProfile = await snapshot.get();
          this.order_log_collection = snapshot.collection("Order Log");
          this.work_log_collection  = snapshot.collection("Work Log");
        }
      },

      load_adam: async function() {

        this.$refs.body_fields.style.display = "";

        let snapshot = db.collection("GlobalYouthProfile").doc("HPLtPG2rZCfdGhATE36x");

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection  = snapshot.collection("Work Log");
      },

      load_yves: async function() {

        this.$refs.body_fields.style.display = "";

        let snapshot = db.collection("GlobalYouthProfile").doc("10001");

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection  = snapshot.collection("Work Log");
      },

      load_none: function() {
        this.$refs.body_fields.style.display = "none";
        this.currentProfile = null;
        this.order_log_collection = null;
        this.work_log_collection  = null;
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

        return `<p>${day}<br />${weekday}</p>`;
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

        return `<p>${time}</p>`;
      },

      time_filter: function(search_term, option) {
        var val = option.toDate();
        var hour = (val.getHours() % 12).toString();
        console.log(hour, typeof hour, search_term, typeof search_term);
        return hour == search_term;
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
    }
}
</script>