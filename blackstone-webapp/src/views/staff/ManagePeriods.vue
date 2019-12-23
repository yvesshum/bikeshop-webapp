<template>
  <div class="manage_periods">
    <TopBar/>
    <h1>Manage Periods</h1>
    <br />

    <div class="col-container">
      <div class="col-left">
        <ButtonArrayHeader
          :left="button_header_l" :right="button_header_r" :current="display_period"
          :min="fst_period" :max="reg_period" :compareFunc="compare_periods"
          @clicked="switch_to"
        >
          <h3>{{display_period}}{{display_period == cur_period ? " (Current)" : display_period == reg_period ? " (Registration)" : ""}}</h3>
        </ButtonArrayHeader>
        <Table
          ref="current_table"
          :headingdata="headers"
          :table_data="display_youths"
          :args="args"
          @newSelection="cur_row_selected"
        />

        <YouthIDSelector periods="all"
          :args="{multiple: true, hideSelected: true, closeOnSelect: false, openDirection: 'top'}"
          @selected="s => selected_bar = s"
        />
      </div>

      <div class="col-right">
        <div v-if="selected_youths.length == 0">
          <h3>Youth Information</h3>
          Select a single youth to view/edit their classes individually, or select multiple youth with <span style="font-family: Courier, Monaco, monospace;">CTRL</span>-click to perform batch operations.
        </div>

        <!-- TODO: Load the youth's profile to get their active_periods -->
        <div v-else-if="selected_youths.length == 1">
          <PeriodsClassesDisplay
            :youth="selected_youth"
            :active_periods="get_youth_classes(selected_youth)"
            :seasons="season_list"
            :cur_period="cur_period"
            :reg_period="reg_period"
            :class_list="class_list"
            @change_period="change_period"
            detail_view
          />
        </div>

        <div v-else>
          <h3>Edit Multiple Youth</h3>

          <div>
            <div style="display: inline-block;">
              <b-dropdown
                variant="primary" :split-variant="batch_season_variant" split
                id="dropdown-text" class="m-2"
                :text="batch_season_display"
                style="margin: auto;" right
              >
                <b-dropdown-item-button v-for="s in season_list" @click="batch_season = s">
                  {{s}}
                </b-dropdown-item-button>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button @click="batch_season = null">
                  Clear
                </b-dropdown-item-button>
              </b-dropdown>
            </div>
            <div style="display: inline-block;">
              <b-dropdown
                variant="primary" :split-variant="batch_year_variant" split
                id="dropdown-text" class="m-2"
                :text="batch_year_display"
                style="margin: auto;" right
              >
                <b-dropdown-item-button v-for="y in year_list" @click="batch_year = y">
                  {{y}}
                </b-dropdown-item-button>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button @click="batch_year = null">
                  Clear
                </b-dropdown-item-button>
              </b-dropdown>
            </div>
            <div style="display: inline-block; width: 2em;"></div>
            <div style="display: inline-block;">
              <b-dropdown
                variant="success"
                id="dropdown-text" class="m-2"
                text="Set Class"
                style="margin: auto;"
                :disabled="batch_period == null"
              >
                <b-dropdown-text style="width: 260px;">
                    <i>Set the class during (season) for all selected youth.</i>
                </b-dropdown-text>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button v-for="c in class_list" @click="change_periods_selected(c)">
                  {{c}}
                </b-dropdown-item-button>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item-button @click="change_periods_selected(null)">
                  Clear
                </b-dropdown-item-button>
              </b-dropdown>
            </div>
          </div>

          <table class="table table-bordered">
            <thead>
            <tr>
                <th scope="col">Name</th>
                <th scope="col">ID</th>
                <th scope="col">{{batch_period_display}}</th>
            </tr>
            </thead>
            <tbody>
              <tr v-for="youth in selected_youths">
                <td>{{youth["First Name"]}} {{youth["Last Name"]}}</td>
                <td>{{youth["ID"]}}</td>
                <td>{{get_youth_class_display(youth, batch_season, batch_year)}}</td>
              </tr>
            </tbody>
        </table>

        </div>
      </div>
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
import Table from '@/components/Table';
import ToggleButton from '@/components/ToggleButton';
import PeriodsClassesDisplay from '@/components/PeriodsClassesDisplay';
import YouthIDSelector from '@/components/YouthIDSelector';
import ButtonArrayHeader from '@/components/ButtonArrayHeader';
import {Status} from '@/components/Status.js';
import {filter} from "@/components/Search.js";
import {forKeyVal} from '@/components/ParseDB.js';
import {Period} from '@/components/Period.js';

export default {
  name: 'manage_periods',
  components: {
    TopBar,
    Table,
    ToggleButton,
    PeriodsClassesDisplay,
    YouthIDSelector,
    ButtonArrayHeader,
  },

  data: function() {
    return {
      // The firebase addresses of the ActivePeriods and PreviousPeriods documents
      periods_db:  db.collection("GlobalPeriods"),
      metadata_db: db.collection("GlobalPeriods").doc("metadata"),

      // The actual loaded documents
      metadata_doc: null,

      // Data loaded from the ActivePeriod document
      cur_period: null,
      reg_period: null,
      fst_period: null,
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
      selected_bar: [],
      all_youth: null,

      // Misc
      season_list: null,
      year_list: [],

      period_status: null,

      batch_season: null,
      batch_year: null,

      display_period: null,
      display_youths: [],

      button_header_l: [
        {name: 'First', arr: 'b', val: 'min'},
        {name: 'Previous', val: 'prev'},
      ],

      button_header_r: [
        {name: 'Next', val: 'next'},
        {name: 'Current', arr: 'd'},
        {name: 'Registration', arr: 'b', val: 'max'},
      ],

    };
  },

  mounted: async function() {

    await this.load_metadata();
    await this.load_periods();
    this.switch_to("Current");

    this.period_status = new Object();

    // TODO:
    //  - Collect all youth
    //  - Display past periods interface
    //  - Figure out which youth are never active
  },

  computed: {
    selected_youths: function() {
      return [...this.selected_cur, ...this.selected_bar];
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

    batch_season_display: function() {
      return (this.batch_season != null) ? this.batch_season : "Choose a season";
    },

    batch_year_display: function() {
      return (this.batch_year != null) ? this.batch_year : "Choose a year";
    },

    batch_season_variant: function() {
      return (this.batch_season != null) ? "primary" : "outline-primary";
    },

    batch_year_variant: function() {
      return (this.batch_year != null) ? "primary" : "outline-primary";
    },

    batch_period: function() {
      return (this.batch_year != null && this.batch_season != null)
        ? `${this.batch_season} ${this.batch_year}`
        : null
    },

    batch_period_display: function() {
      return (this.batch_period != null) ? `Class in ${this.batch_period}` : "Choose a period";
    },
  },


  methods: {
    load_metadata: async function() {
      this.metadata_doc = await this.metadata_db.get();
      var data = this.metadata_doc.data();

      // Store current periods
      this.cur_period = data["CurrentPeriod"];
      this.reg_period = data["CurrentRegistrationPeriod"];
      this.fst_period = data["FirstPeriod"];

      // Store the list of classes
      this.classes = data["Classes"];

      // Store seasons
      this.season_list = data["Seasons"];
      Period.setSeasons(this.season_list);

      // Store years
      this.year_list = [];
      var min_year = Period.year(this.fst_period);
      var max_year = Period.year(this.reg_period);
      for (let i = parseInt(min_year); i <= parseInt(max_year); i++) {
          this.year_list.push(i.toString());
      }
    },

    load_periods: async function() {
      this.periods = {};
      this.year_list.forEach(async year => {
        this.periods[year] = (await this.periods_db.doc(year).get()).data();
      });
    },

    // Format: {'Fall 18': 'Gear Up 2', 'Winter 20': 'Gear Up 2', 'Spring 17': 'Earn a Bike', 'Summer 18': 'Gear Up 1'}
    get_youth_classes(youth) {
      var result = {};

      // Cycle through each year/season pair
      this.year_list.forEach(year => {
        this.season_list.forEach(season => {

          // Add class to object if it exists
          let youth_class = this.get_youth_class(youth, season, year);
          if (youth_class != null)
            result[season + " " + year] = youth_class;
        })
      });

      return result;
    },

    get_period(season, year) {
      if (this.periods == null || this.periods[year] == null) {
        return null;
      }
      return this.periods[year][season + " " + year];
    },

    get_youth_class(youth, season, year) {
      var full_period = this.get_period(season, year);
      if (full_period == null) return null;

      let matches = full_period.filter(y => {
        return y.ID == youth.ID && y["First Name"] == youth["First Name"] && y["Last Name"] == youth["Last Name"];
      });

      if (matches.length == 0) {
        return null;
      }
      else if (matches.length == 1) {
        return matches[0].Class
      }
      else {
        // Error - multiple records found
        return matches[0].Class
      }
    },

    get_youth_class_display(youth, season, year) {
      if (season == null || year == null) return "";
      var val = this.get_youth_class(youth, season, year);
      return (val != null) ? val : "n/a";
    },

    switch_to: function(change_code) {
      switch (change_code) {
        case "Current":
          this.display_period = this.cur_period;
          break;
        case "Registration":
          this.display_period = this.reg_period;
          break;
        case "First":
          this.display_period = this.fst_period;
          break;
        case "Previous":
          this.display_period = Period.genPrevStr(this.display_period);
          break;
        case "Next":
          this.display_period = Period.genNextStr(this.display_period);
          break;
      }

      var period = this.get_period(Period.season(this.display_period), Period.year(this.display_period));

      if (period == null) {
        this.display_youths = [];
      }

      else {
        this.display_youths = period.map(y => {
          return {...y, "Full Name": y["First Name"] + " " + y["Last Name"]}
        });
      }

      console.log(this.display_youths);
    },

    compare_periods: function(a, b) {
      return Period.compare(a, b);
    },

    cur_row_selected: function(rows) {
      this.selected_cur = this.row_selected(rows);
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

    change_periods_selected: function(change) {
      var change_list = this.selected_youths.map(youth => {
        return {youth, period: this.batch_period, new_class: change}
      });

      console.log("Changes: ", change_list);
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

  .col-container:after {
    content: "";
    display: table;
    clear: both;
  }

  .col-left {
    float: left;
    width: 45%;
    padding-left: 3%;
    padding-right: 1.5%;
  }

  .col-right {
    float: left;
    width: 55%;
    padding-left: 1.5%;
    padding-right: 3%;
  }
</style>