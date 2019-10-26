<template>
  <div class="match_table">
    <!-- Filter: {{filter_by}} -->
    <!-- <b-button @click="filter_by='achieved'">Show Achieved Only</b-button> -->
    <!-- <b-button @click="filter_by='unachieved'">Show Unachieved Only</b-button> -->
    <Table :headingdata="heading_data" :table_data="table_data" :args="table_args" @Table="t => table = t"></Table>
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

  props: ['fullData', 'checkedData', 'headingData', 'matchBy', 'editable'],

  data: function() {
    return {
      filter_by: null,

      table: null,

      achieved_column: {
        field:"achieved",
        formatter:"tickCross",
        formatterParams:{crossElement: false},
        width: 10,
        align: "center",
        headerSort: false,
        editable: this.editable != undefined,
        editor: 'tickCross',
        cellEdited: cell => this.$emit("matchchange", cell.getData()),
        // bottomCalc: "count",
      },

      table_args: {
        groupBy: 'group',
        resizeableRows: false,
        resizeableColumns: false,

        // Format the header to show number of skills achieved in each category
        groupHeader: function(value, count, data, group) {
          let achieved = data.reduce((acc, curr) => acc += (curr.achieved ? 1 : 0), 0);
          return `${value} Skills <span style='float:right;'>${achieved}/${count} Achieved</span>`;
        },

        // Allow multiple selection with ctrl and shift keys
        selectable: true,

        // When row selection changes, propagate those changes upward
        rowSelectionChanged: (data, rows) => {
          this.$emit('selected', rows.map(this.row_field_map));
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
    select_value: function(field, value) {
      this.table.getRows().forEach(row => {
        let curr_value = row.getData()[field];
        if (curr_value == value) {
          this.table.selectRow(row);
        }
      });
    },

    deselect_values: function() {
      this.table.deselectRow();
    },

    // Manually grab the selected fields from the Tabulator
    // These can also be tracked using the 'selected' emit
    get_selected_fields: function() {
      return this.table.getSelectedRows().map(this.row_field_map);
    },

    // Mapping function from a Tabulator row to the data corresponding with the match field
    row_field_map: function(row) {
      return row.getData()[this.matchBy];
    },

    highlight_values: function(values, field) {

      // If no field provided, default to the one this table is matching by
      if (field == null) field = this.matchBy;

      // Loop through each row in the table to add or remove a highlight
      this.table.getRows().forEach(r => {

        // Get the classlist of the current row
        let classList = r.getElement().classList;

        // Get the value of the desired field in the current row
        let match_val = r.getData()[field];

        // If this value is in the list to highlight, do so
        if (values.includes(match_val)) {
          classList.add("highlighted_row");
        }

        // If not, clear the highlight
        else {
          classList.remove("highlighted_row");
        }
      });

    },
  },
}
</script>

<style>

  .highlighted_row.tabulator-row-odd, .highlighted_row.tabulator-row {
    background-color: #FEFCBD;
    font-weight: bold;
  }

  .highlighted_row.tabulator-row-even {
    background-color: #FDFA9B;
    font-weight: bold;
  }

  .highlighted_row.tabulator-selected {
    background-color: #99baad;
  }

</style>