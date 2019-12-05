<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>
    <br />

    <div class="col-container">
      <div class="col-left">
        <h3>Current Quarter (Fall 19)</h3>
        <Table
          ref="current_table"
          :headingdata="headers"
          :table_data="cur_youths"
          :args="args"
          @newSelection="cur_row_selected"
        />

        <h3>Registration for Next Quarter (Winter 20)</h3>
        <Table
          ref="registration_table"
          :headingdata="headers"
          :table_data="reg_youths"
          :args="args"
          @newSelection="reg_row_selected"
        />
      </div>

      <div class="col-right">
        <h3>Youth Information</h3>

        <div v-if="selected_youths.length == 0">
          Select youth from the tables to the left, or choose a youth from the search bar below.
        </div>

        <!-- TODO: Load the youth's profile to get their active_periods -->
        <div v-else-if="selected_youths.length == 1">
          <PeriodsClassesDisplay
            :youth="selected_youth"
            :active_periods="{'Fall 19': 'Earn a bike', 'Winter 20': 'Gear up one', 'Spring 17': 'abc'}"
            :seasons="season_list"
            :cur_period="cur_period"
            :reg_period="reg_period"
            :class_list="class_list"
            @change_period="change_period"
            detail_view
          />
        </div>

        <div v-else>

          <b-dropdown variant="primary" id="dropdown-text" text="Year" class="m-2">
            <b-dropdown-item-button v-for="y in ['19','20']">{{y}}</b-dropdown-item-button>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item-button>Clear</b-dropdown-item-button>
          </b-dropdown>

          <b-dropdown variant="primary" id="dropdown-text" text="Season" class="m-2">
            <b-dropdown-item-button v-for="s in season_list">{{s}}</b-dropdown-item-button>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item-button>Clear</b-dropdown-item-button>
          </b-dropdown>

          <b-dropdown variant="primary" id="dropdown-text" text="Class" class="m-2">
            <b-dropdown-item-button v-for="c in class_list">{{c}}</b-dropdown-item-button>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item-button>Clear</b-dropdown-item-button>
          </b-dropdown>

        </div>
      </div>
    </div>

    <br /><br />

    <h3>Past Quarters</h3>
    <div id="past-quarters-table"></div>

  </div>
</template>


<script>
// @ is an alias to /src
import {db} from '../../firebase';
import {firebase} from '../../firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import TopBar from '@/components/TopBar';
import Table from '@/components/Table';
import ToggleButton from '@/components/ToggleButton';
import PeriodsClassesDisplay from '@/components/PeriodsClassesDisplay';
import {Status} from '@/components/Status.js';
import {filter} from "@/components/Search.js";
import {forKeyVal} from '@/components/ParseDB.js';

export default {
  name: 'manage_periods',
  components: {
    TopBar,
    Table,
    ToggleButton,
    PeriodsClassesDisplay,
  },

  data: function() {
    return {
      // The firebase addresses of the ActivePeriods and PreviousPeriods documents
      periods_db:  db.collection("GlobalPeriods"),
      metadata_db: db.collection("GlobalPeriods").doc("metadata"),

      // The actual loaded documents
      metadata_doc: null,

      // Data loaded from the ActivePeriod document
      past_periods: [],
      cur_period: null,
      reg_period: null,
      cur_youths: [], // With period_status, are these two even necessary?
      reg_youths: [],
      classes: [],

      // The column headers for the table
      headers: [
        { // The name of the youth
          title: "Name", field: "Full Name",
          headerFilter: true, headerFilterFunc: filter
        },
        { // The ID of the youth
          title: "ID", field: "ID", width: 90, headerFilter: true
        },
        { // The class the youth is registered in
          // TODO: Get filter values from the database
          // TODO: Group by class?
          title: "Class", field: "Class", headerFilter: "select",
          headerFilterParams: {values: ["", "Earn a bike", "Gear up one", "Geared up two"]}
        },
      ],
      args: {
        selectable: true,
      },

      selected_cur: [],
      selected_reg: [],
      all_youth: null,

      // Misc
      season_list: null,
      period_sort_map: null,

      period_status: null,

    };
  },

  mounted: async function() {

    await this.load_metadata();
    await this.load_current_youths();

    this.period_status = new Object();

    // TODO:
    //  - Collect all youth
    //  - Display past periods interface
    //  - Figure out which youth are never active
  },

  computed: {
    selected_youths: function() {
      return [...this.selected_cur, ...this.selected_reg];
    },

    selected_youth: function() {
      if (this.selected_youths.length == 1) {
        return this.selected_youths[0];
      }
      else {
        return null;
      }
    },

    youth_name: function() {
      return (this.selected_youth != null) ? this.selected_youth["Full Name"] : "";
    },

    youth_id: function() {
      return (this.selected_youth != null) ? this.selected_youth["ID"] : "";
    },

    class_list: function() {
      var ret = [];
      forKeyVal(this.classes, (name, val) => {
        ret.push(name);
      });
      return ret;
    },
  },


  methods: {
    load_metadata: async function() {
      this.metadata_doc = await this.metadata_db.get();
      var data = this.metadata_doc.data();

      // Store current periods
      this.cur_period = data["CurrentPeriod"];
      this.reg_period = data["CurrentRegistrationPeriod"];

      // Store the list of classes
      this.classes = data["Classes"];

      // Store seasons
      this.season_list = data["Seasons"];
      this.period_sort_map = new Object();
      this.season_list.forEach(function(element, n) {
        this.period_sort_map[element] = n;
      }.bind(this));
    },

    load_current_youths: async function() {
      this.cur_youths = await this.load_youths(this.cur_period);
      this.reg_youths = await this.load_youths(this.cur_period);



      this.cur_youths.forEach(youth => 
        youth["Full Name"] = `${youth["First Name"]} ${youth["Last Name"]}`
      );

      this.reg_youths.forEach(youth => 
        youth["Full Name"] = `${youth["First Name"]} ${youth["Last Name"]}`
      );
    },

    load_youths: async function(period) {
      var name = this.split_period_name(period);
      var doc = await this.periods_db.doc(name.year).get();
      return doc.data()[period];
    },

    split_period_name: function(period) {
      var p = period.split(" ");
      return {season: p[0], year: p[1]};
    },

    // Function to determine period ordering.
    // Usage: some_period_array.sort(sort_periods)
    sort_periods: function(a, b) {
      let a_month = a.slice(0,-2).trim();
      let b_month = b.slice(0,-2).trim();
      let a_year = a.slice(-2);
      let b_year = b.slice(-2);
      if (a_year == b_year) {
        return this.period_sort_map[a_month] - this.period_sort_map[b_month];
      } else {
        return a_year.localeCompare(b_year);
      }
    },

    cur_row_selected: function(rows) {
      this.selected_cur = this.row_selected(rows);
    },

    reg_row_selected: function(rows) {
      this.selected_reg = this.row_selected(rows);
    },

    row_selected: function(rows) {
      return (rows.length == 0) ? [] : rows.map(row => row.getData());
    },

    contains: function(list, youth) {
      for (let x in list) {
        let curr = list[x];
        if (youth["ID"] == curr["ID"] && youth["Full Name"] == curr["Full Name"]) {
          return true;
        }
      }
      return false;
    },

    is_active: function(youth, season, year) {
      // TODO: Use youth's profile or relevant periods document?
      return (season == "Winter" || year == "19");
    },

    change_period: function(change) {
      console.log("Changing period: ", change);
    },

  },

}

</script>

<style scoped>
  .full_name {
    font-size: 2em;
    margin-bottom: 0;
  }

  .id_parens {
    color: gray;
    font-size: 0.75em;
  }
</style>