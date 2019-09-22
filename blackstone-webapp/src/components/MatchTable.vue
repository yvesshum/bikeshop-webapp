<template>
  <div class="match_table">
    <!-- Filter: {{filter_by}} -->
    <!-- <b-button @click="filter_by='achieved'">Show Achieved Only</b-button> -->
    <!-- <b-button @click="filter_by='unachieved'">Show Unachieved Only</b-button> -->
    <Table :headingdata="heading_data" :table_data="table_data" :args="table_args"></Table>
  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import Table from '@/components/Table';

export default {
  name: 'match_table',

  components: {
    Table,
  },

  props: ['fullData', 'checkedData', 'headingData', 'matchBy'],

  data: function() {
    return {
      filter_by: null,

      achieved_column: {
        field:"achieved",
        formatter:"tickCross",
        formatterParams:{crossElement: false},
        width: 10,
        align: "center",
        headerSort: false,
        // bottomCalc: "count",
      },

      table_args: {
        groupBy: 'group',
        resizeableRows: false,
        resizeableColumns: false,
        groupHeader: function(value, count, data, group) {
          let achieved = data.reduce((acc, curr) => acc += (curr.achieved ? 1 : 0), 0);
          return `${value} Skills <span style='float:right;'>${achieved}/${count} Achieved</span>`;
        },
      },
    };
  },

  computed: {
    table_data: function() {
      return this.fullData.map(c => {
        return {achieved: this.checkedData.includes(c[this.matchBy]), ...c};
      })
    },

    heading_data: function() {
      return [ this.achieved_column, ...this.headingData ];
    },
  },

  methods: {
    
  },
}
</script>