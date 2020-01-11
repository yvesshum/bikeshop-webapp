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
import {Status} from '@/scripts/Status';

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
        formatterParams: {crossElement: false},
        width: 10,
        align: "center",
        headerSort: false,
        editable: this.editable != undefined,
        editor: 'tickCross',
        cellEdited: cell => {
          var data = cell.getData();
          var new_status = data.achieved ? Status.O : Status.X;
          var row_id = this.get_row_id(data);

          this.row_status.set(row_id, new_status);

          var changes = {
            "add": this.row_status.filter(Status.ADD),
            "rem": this.row_status.filter(Status.REM),
            "use": this.row_status.filter(Status.O),
            "not": this.row_status.filter(Status.X),
          };

          this.$emit("changes", changes);
        },
      },

      table_args: {
        groupBy: 'group',
        resizeableRows: false,
        resizeableColumns: false,
        index: 'name',

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

        // Mark rows with unsaved changes
        rowFormatter: row => {
          var row_id = this.get_row_id(row.getData());
          if (this.row_status.is_status(row_id, Status.C)) {
            row.getElement().classList.add("changed_row");
          }
          else {
            row.getElement().classList.remove("changed_row");
          }
        },
      },

      row_status: new Status(),
    };
  },

  mounted: function() {
    this.fullData.forEach(row => {
      let row_id = this.get_row_id(row);
      let status = this.checkedData.includes(row_id) ? Status.USE : Status.NOT;
      this.row_status.add_vue(this, row_id, status);
    });
  },

  watch: {
    fullData: function(new_rows) {
      new_rows.forEach(row => {
        let row_id = this.get_row_id(row);
        let status = this.checkedData.includes(row_id) ? Status.USE : Status.NOT;
        if (!this.row_status.has_key(row_id)) {
          this.row_status.add_vue(this, row_id, status);
        }
      });
    },

    checkedData: function(new_rows) {
      this.row_status.forEach(row => {
        this.row_status.set(row, new_rows.includes(row) ? Status.USE : Status.NOT);
      });
    },
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

    get_row_id: function(row) {
      return row[this.matchBy];
    },

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

    accept_changes: function() {
      this.row_status.update();
      this.table.getRows().forEach(r => r.reformat());
      this.$emit("changes", null);
    },

    discard_changes: function() {
      this.row_status.reset();
      this.table.getRows().forEach(row => {
        let row_data = row.getData();
        let row_name = this.get_row_id(row_data);
        let achieved = this.row_status.is_status(row_name, Status.O);

        this.table.updateData([{...row_data, achieved}]);
        row.reformat();
      })
      this.$emit("changes", null);
    },
  },
}
</script>

<style>

  .changed_row {
    font-weight: bold;
  }

  .highlighted_row.tabulator-row-odd, .highlighted_row.tabulator-row {
    background-color: #FEFCBD;
  }

  .highlighted_row.tabulator-row-even {
    background-color: #FDFA9B;
  }

  .highlighted_row.tabulator-selected {
    background-color: #99baad;
  }

</style>