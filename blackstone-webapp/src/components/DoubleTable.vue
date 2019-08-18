<!--
    Display two Tabulator tables side by side, such that rows can be moved from one to the other. Usage:

    <DoubleTable
        :headers="['Column 1', 'Column 2']"
        :data="{left_data, right_data}"
        @DataChange="function_to_handle_data"
        @DataUpdate="function_after_updates_applied"
    >

    Props:
        headers - The column headers to use on both tables

        data - An object with two fields:
            left: The rows to place in the left table
            right: The rows to place in the right table

        pending_data - Used to update data within the table (see below)

        options - Arguments for the Tabulator constructor to be applied to both tables

        placeholders - An object with two fields. If null, no placeholder text is used.
            left: The placeholder text for the left table when it has no rows
            right: The placeholder text for the right table when it has no rows

        table_height - The height for both tables. Defaults to 311.

    Emits:
        DataChange - Object containing fields in left and in right, every time data is changed from within this component
        DataUpdate - Object containing fields in left and in right, once updates are applied from a parent component

    To manually set all the data in the table, set the "data" prop to the desired values.

    To update certain data in the table without overwriting, set the "pending_data" prop to an object containing any of the following fields:
        
        put_left: Array of rows to add to the left, removing from right if applicable
        put_right: Array of rows to add to the right, removing from left if applicable

        move_left: Array of rows to move to the left iff they exist on the right
        move_right: Array of rows to move to the right iff they exist on the left

        add_left: Array of rows to add to the left iff they do not exist on the right
        add_right: Array of rows to add to the right iff they do not exist on the left

        remove: Array of rows to remove from the table altogether
        remove_left: Array of rows to remove if they are in the left table
        remove_right: Array of rows to remove if they are in the right table

    Once the above changes have been made, the DataUpdate trigger will be emitted - this is how the parent knows the updates are complete.

    Note that, at the current time, DataChange and DataUpdate are the only ways to retrive the data from the table.

-->

<template>
    <div class="double_table">
        <div class="table_container">
            <slot name="left_title"></slot>
            <div ref="left_table"></div>
            <slot name="left_footer"></slot>
        </div>
        <div class="table_container">
            <slot name="right_title"></slot>
            <div ref="right_table"></div>
            <slot name="right_footer"></slot>
        </div>
    </div>
</template>

<script>
    import Table from "@/components/Table.vue"
    const Tabulator = require('tabulator-tables');

    export default {
        name: 'DoubleTable',
        props: ['headers', 'data', 'pending_data', 'options', 'placeholders', 'table_height'],
        components: {Table},

        data: function () {
            return {

                // The two table objects
                left_table: null,
                right_table: null,

                // The arguments used to construct the Tabulators
                args: null,
                default_args: {
                    height:(this.table_height == null)?311:this.table_height,
                    layout:"fitColumns",
                    movableRows:true,
                    movableRowsReceiver: "add",
                    movableRowsSender: "delete",
                    resizableColumns:false,
                    columns:this.headers,
                    movableRowsReceivedFailed:this.row_change_fail,
                    movableRowsReceivingStop:this.row_change_complete,
                },

                // The actual placeholder text
                _placeholders: null,
            };
        },

        mounted: function() {

            this._placeholders = this.placeholders;
            if (this._placeholders == null) {
                this._placeholders = {
                    left: "",
                    right: "",
                };
            } else {
                if (this._placeholders.left == null) {
                    this._placeholders.left = "";
                };
                if (this._placeholders.right == null) {
                    this._placeholders.right = "";
                };
            };

            // Initialize what options will be passed to both tables
            this.args = {...this.default_args, ...this.options};

            // Initialize the left table
            this.left_table = new Tabulator(this.$refs.left_table, {
                ...this.args,
                movableRowsConnectedTables: this.$refs.right_table,
                placeholder:                this._placeholders.left,
                data:                       this.get_data_safe("left", []),
            });

            // Initialize the right table
            this.right_table = new Tabulator(this.$refs.right_table, {
                ...this.args,
                movableRowsConnectedTables: this.$refs.left_table,
                placeholder:                this._placeholders.right,
                data:                       this.get_data_safe("right", []),
            });
        },

        watch: {

            // Hard set - Update the data if changed from the parent
            data: function() {

                // Replace table data, using empty array for null/undefined values
                this.left_table.replaceData(this.get_data_safe("left", []));
                this.right_table.replaceData(this.get_data_safe("right", []));

                // Return successful updates to parent
                this.emit_updates();
            },

            // Hard set - Update the headers if changed from the parent
            headers: function() {
                // Replace table headers
                this.left_table.setColumns(this.headers);
                this.right_table.setColumns(this.headers);

                // Return successful updates to parent
                this.emit_updates();
            },

            // Soft set - Move rows between tables without overwriting other rows
            // TODO: Rigorous testing!
            pending_data: function() {
                Object.keys(this.pending_data).forEach(function(key) {
                    let arr = this.pending_data[key];
                    switch (key) {
                        // Put cases - Put data on given side, removing from other if applicable
                        case "put_left":
                            arr.forEach((row) => this.move_data(row, "left", false));
                            break;
                        case "put_right":
                            arr.forEach((row) => this.move_data(row, "right", false));
                            break;

                        // Move cases - Move data to given side if it exists on the other side (i.e. only operate on data if it already exists in the table)
                        case "move_left":
                            arr
                            .filter((row) => this.right_table.getData().includes(row))
                            .forEach((row) => move_data(row, "left", false));
                            break;
                        case "move_right":
                            arr
                            .filter((row) => this.left_table.getData().includes(row))
                            .forEach((row) => move_data(row, "right", false));
                            break;

                        // Add cases - Move data to given side if it does not exist on the other side (i.e. operate on data if it does not already exist in the table)
                        case "add_left":
                            arr
                            .filter((row) => !this.right_table.getData().includes(row))
                            .forEach((row) => move_data(row, "left", false));
                            break;
                        case "add_right":
                            arr
                            .filter((row) => !this.left_table.getData().includes(row))
                            .forEach((row) => move_data(row, "right", false));
                            break;

                        // Remove cases - Remove data from whole table or given side
                        case "remove":
                            arr.forEach((row) => this.remove_row(row, null, false));
                            break;
                        case "remove_left":
                            arr.forEach((row) => this.remove_row(row, "left", false));
                            break;
                        case "remove_right":
                            arr.forEach((row) => this.remove_row(row, "right", false));
                            break;

                        // Default - Unrecognized specifier
                        default:
                            console.log("Invalid specifier \"" + key + "\" in pending_data object.");
                            break;
                    }
                }.bind(this));
                this.emit_updates();
            },
        },

        methods: {
            // Emitted when changes are made from within the tables
            emit_changes: function() {
                this.$emit("DataChange", this.get_data());
            },

            // Emitted when changes from the parent are successfully applied
            emit_updates: function() {
                this.$emit("DataUpdate", this.get_data());
            },

            // Returns the data in the two tables
            get_data: function() {
                return {
                    left: this.left_table.getData(),
                    right: this.right_table.getData(),
                };
            },

            // Returns data[side] if data exists and data[side] exists,
            // returns default_value otherwise
            get_data_safe: function(side, default_value) {
                return (this.data == null || this.data == undefined || this.data[side] == null || this.data[side] == undefined) ? default_value : this.data[side];
            },

            // Runs after row movement finishes
            row_change_complete: function(fromTable) {
                this.emit_changes();
            },

            // Runs if row movement fails for some reason
            row_change_fail: function(fromRow, toRow, fromTable){
                console.log("Failed to move row", fromRow, " to row ", toRow, " from table ", fromTable);
            },

            // Manually move a row to one table, removing from the other if applicable
            move_data: function(row, to_side, allow_emit) {
                to_side = to_side.toLowerCase();

                let to_table = null;
                let from_table = null;
                if (to_side == "left") {
                    to_table = this.left_table;
                    from_table = this.right_table;
                }
                else if (to_side == "right") {
                    to_table = this.right_table;
                    from_table = this.left_table;
                }
                else {
                    console.log("Unrecognized side \"" + to_side + "\". Please use \"left\" or \"right\".");
                    return;
                };

                this.remove_row(row, from_table, false);
                to_table.addRow(row);

                if (allow_emit) {
                    this.emit_updates();
                };
            },

            // Remove a row from the given table
            // If table is null, removes from either table
            remove_row: function(row, table, allow_emit) {
                // TODO: Some code to remove a row
                // if table == null, use both

                if (allow_emit) {
                    this.emit_updates();
                };
            },
        }
    }
</script>

<style>
    .table_container {
        width: 50%;
        display: inline-block;
    }
</style>