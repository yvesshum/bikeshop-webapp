<!--
A Table with an editable active and inactive list, which can switch between display and edit views.

-->

<template>
    <div class="binary_table">
        <div ref="display_table_container">
            <Table ref="display_table"
                :headingdata="this.displayTableHeaders"
                :table_data="this.active_data"
                :args="displayOptions"
                @selectedRow="this.row_selected"
                @deselectedRow="this.row_deselected"
                @Table="emit_table"
            >
            </Table>
        </div>

        <div ref="edit_table_container" style="display:none;">
          <DoubleTable
            :headers="this.editTableHeaders"
            :data="this.edit_table_data"
            :placeholders="this.placeholders"
            :table_height="this.editTableHeight"
            @DataChange="this.edit_change"
            @DataUpdate="this.edit_update"
          >
            <template slot="left_title"><h4>Inactive</h4></template>
            <template slot="right_title"><h4>Active</h4></template>
          </DoubleTable>
        </div>

        <ToggleButton onVariant="success" offVariant="primary" :onText="this.onText" :offText="this.offText" @Toggle="toggle_edit_mode" block></ToggleButton>
    </div>
</template>

<script>
    import Table from "@/components/Table.vue"
    import DoubleTable from "@/components/DoubleTable.vue"
    import ToggleButton from "@/components/ToggleButton.vue"

    export default {
        name: 'BinaryTable',
        props: [
            'displayTableHeaders',
            'editTableHeaders',

            'tableData',

            'displayOptions',
            'editOptions',

            'placeholders',
            'editTableHeight',

            'onText',
            'offText',
        ],

        components: {
            Table,
            DoubleTable,
            ToggleButton
        },

        data: function () {
            return {
                // Lists for the active rows and the inactive rows
                active_data: [],
                inactive_data: [],

                // An object to package the active and inactive data for the DoubleTable
                edit_table_data: null,

                // The most recent configuration of the DoubleTable
                edit_pending: null,
            };
        },

        mounted: function() {
            this.active_data   = this.get_child_safe(this.tableData, "active",   []);
            this.inactive_data = this.get_child_safe(this.tableData, "inactive", []);
            this.set_edit_table();
        },

        watch: {

            tableData: function(new_data) {
                this.active_data   = this.get_child_safe(this.tableData, "active",   []);
                this.inactive_data = this.get_child_safe(this.tableData, "inactive", []);
                this.set_edit_table();
            },

        },

        methods: {

            show_display_table: function() {
                this.$refs.edit_table_container.style.display = "none";
                this.$refs.display_table_container.style.display = "";
            },

            show_edit_table: function() {
                this.$refs.edit_table_container.style.display = "";
                this.$refs.display_table_container.style.display = "none";
            },

            set_edit_table: function() {
              this.edit_table_data = {
                left: this.inactive_data,
                right: this.active_data,
              };
            },

            accept_edits: function() {
                let edits = this.edit_pending;
                let active   = this.get_child_safe(edits, "right", []);
                let inactive = this.get_child_safe(edits, "left",  []);

                this.active_data   = active;
                this.inactive_data = inactive;
                this.$emit("AcceptEdits", {active, inactive});
            },

            get_child_safe: function(parent, child, default_value) {
                return (parent == null || parent == undefined || parent[child] == null || parent[child] == undefined) ? default_value : parent[child];
            },


            /* Child emit handlers */

            toggle_edit_mode: function(toggle_val) {
                if (toggle_val) {
                    this.show_edit_table();
                }
                else {
                    this.accept_edits();
                    this.show_display_table();
                };
            },

            edit_change: function(changes) {
                this.edit_pending = changes;
            },

            edit_update: function(updates) {
                this.edit_pending = updates;
            },

            row_selected: function(row) {
                this.$emit("selectedRow", row);
            },

            row_deselected: function(row) {
                this.$emit("deselectedRow", row);
            },

            emit_table: function(table) {
                this.$emit("Table", table);
            },
        }
    }
</script>