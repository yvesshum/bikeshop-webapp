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
import Table from '@/components/Table';
import {Status} from '@/scripts/Status';

export default {
  name: 'match_table',

  components: {
    Table,
  },

  props: {
    fullData: {
      type: Array
    },

    checkedData: {
      type: Array
    },

    headingData: {},

    matchBy: {
      type: [String, Array],
    },

    editable: {
      type: Boolean,
      default: false,
    },

    args: {},
  },

  data: function() {
    return {
      filter_by: null,

      table: null,

      achieved_column: {
        title:"Achieved?",
        field:"achieved",
        formatter:"tickCross",
        formatterParams: {crossElement: false},
        width: 115,
        align: "center",
        headerSort: false,
        editable: this.editable != undefined,
        editor: 'tickCross',
        cellEdited: cell => {
          var data = cell.getData();
          var new_status = data.achieved ? Status.O : Status.X;
          var row_id = this.get_row_id(data);

          this.row_status.set(row_id, new_status);

          var add = this.table.getRows().filter(row =>
            this.row_status.is_status(this.get_row_id(row.getData()), Status.ADD)
          );

          var rem = this.table.getRows().filter(row =>
            this.row_status.is_status(this.get_row_id(row.getData()), Status.REM)
          );

          this.$emit("changes", {add, rem});
        },
      },

      default_table_args: {
        index: this.matchBy,

        // Format the header to show number of skills achieved in each category
        groupHeader: function(value, count, data, group) { // eslint-disable-line no-unused-vars
          let achieved = data.reduce((acc, curr) => acc += (curr.achieved ? 1 : 0), 0);
          return `${value} Skills <span style='float:right;'>${achieved}/${count} Achieved</span>`;
        },

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
    this.fullData.forEach(row_data => {
      let row_id = this.get_row_id(row_data);
      let status = this.in_checked_data(row_data) ? Status.USE : Status.NOT;
      this.row_status.add_vue(this, row_id, status);
    });
  },

  watch: {

    // Any time the full set of data updates, add new rows to the row_status object as necessary
    fullData: function(new_row_data) { // eslint-disable-line no-unused-vars

      // Loop through each row data object in the full set
      this.fullData.forEach(row_data => {
        let row_id = this.get_row_id(row_data);

        // If data not yet in table, check its status in checkedData and add it
        if (!this.row_status.has_key(row_id)) {
          let status = this.in_checked_data(row_data) ? Status.USE : Status.NOT;
          this.row_status.add_vue(this, row_id, status);
        }
      });
    },


    // Any time the checked data updates, set the row_status object to match it
    checkedData: function(new_row_data) { // eslint-disable-line no-unused-vars

      // For each row_data object in the full set, update it to match the new checkedData
      this.fullData.forEach(row_data => {
        let row_id = this.get_row_id(row_data);
        let status = this.in_checked_data(row_data) ? Status.USE : Status.NOT;
        this.row_status.set(row_id, status);
      });
    },

    table: function(new_table) {
      this.$emit("table", new_table);
    },
  },

  computed: {
    table_data: function() {
      return this.fullData.map(c => { return {achieved: this.in_checked_data(c), ...c}; });
    },

    heading_data: function() {
      return [ ...this.headingData, this.achieved_column ];
    },

    table_args: function() {
      return {...this.default_table_args, ...this.args(this.is_achieved_cell)};
    },
  },

  methods: {

    is_achieved_cell: function(cell) {
      return cell.achieved;
    },

    // Get a unique identifier for each row, as specified by the matchBy prop
    get_row_id: function(row) {

      // Matching by multiple fields - format as strings separated by |, e.g. "|A|B|C|"
      if (Array.isArray(this.matchBy)) {
        return this.matchBy.reduce((acc, curr) => {return acc + row[curr] + "|"}, "|");
      }

      // Matching by single field - grab it from the row
      else {
        return row[this.matchBy];
      }
    },

    in_checked_data: function(row) {
      var achieved = false;

        // matchBy     -> ["name", "category", "color"]
        // checkedData -> [{name, category, color}, {name, category, color}]
        // row         -> {name: ???, category: ???, color: ???}

        // If matching by an array, check each element
        if (Array.isArray(this.matchBy)) {

          var matchByFields = this.matchBy.map(field => row[field]);

          // Loop through until a match is found
          for (var i = 0; i < this.checkedData.length; i++) {
            var thing = true;

            for (var j = 0; j < this.matchBy.length; j++) {
              thing = thing && (matchByFields[j] == this.checkedData[i][j]);
            }

            if (thing) {
              return true;
            }
          }

          return false;
        }

        // If matching by a string, can just check for that field's value
        else if (typeof this.matchBy === "string") {
          return this.checkedData.includes(row[this.matchBy]);
        }
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

      // row_status object has a native function to handle accepting changes
      this.row_status.update();

      // Get rid of the bold/highlighting that marks changed rows
      this.table.getRows().forEach(r => r.reformat());

      // Emit that there are now no changes, since all previous changes are now the default
      this.$emit("changes", null);
    },

    discard_changes: function() {

      // Reset the row_status object
      this.row_status.reset();

      // Go through each row in the table and reset its "achieved" field to the original value
      this.table.getRows().forEach(row => {

        // Check whether the current row should be achieved or not
        let row_name = this.get_row_id(row.getData());
        let achieved = this.row_status.is_status(row_name, Status.O);

        // Update the row and ensure the change displays
        row.update({achieved});
        row.reformat();
      });

      // Emit that there are no changes
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