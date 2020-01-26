<!--
Displays a Firebase collection as a Tabulator table.

Usage:

    <CollectionTable
        :heading_data="list_of_headers"
        :collection="firebase_collection"
        groupBy="FieldToGroupBy"
        :groupByOptions="list_of_groups"
        :progressiveLoad="true"
        @rowSelected="function_to_handle_row"
    ></CollectionTable>


Props:

    heading_data - A list of columns to display. Each header may either be a string listing the field to display, or a header object (see Tabulator documentation). Mixing and matching is allowed.

    collection - The Firebase collection to display documents from.

    args - Additional arguments to be passed as options to the Tabulator constructor. Note that these will not override the following options, which are used by CollectionTable:

        data
        columns
        groupBy
        groupStartOpen
        groupClick
        groupValues
        groupHeader

        In addition, certain options have default values which may be overwritten in the args object. See the Tabulator constructor below for details.

    groupBy - The field to group the documents by. If not specified, the documents will not be grouped.

    groupByOptions - A list of possible groups the documents may fall into. If not specified, creates groups to match the data. Note that if this is specified, it will not be possible to load/display documents which do not match any of the listed groups.

    progressiveLoad - Whether or not to wait until the user opens a group to retreive the documents which belong in it. Note that if progressive loading is desired, the "groupByOptions" prop MUST be specified - otherwise, no documents can be retrieved.


Emits:

    rowSelected - The selected row.

-->

<template>
    <div ref="table"></div>
</template>

<script>
    // TODO: Test GROUP.FAILED with Firebase failed retrievals
    import {db} from '../../firebase';

    const Tabulator = require('tabulator-tables');

    // An "enum" to represent the status of a given group
    const GROUP = {
        LOADED: "loaded",
        LOADING: "loading",
        UNLOADED: "unloaded",
        FAILED: "failed",
    };

    export default {
        name: 'CollectionTable',
        props: ['heading_data', 'collection', 'args', 'groupBy', 'groupByOptions', 'progressiveLoad', 'doc_formatter', 'visible'],

        data: function () {
            return {
                // The Tabulator table object
                table: null,

                // The actual data displayed by the table
                tableData: [],

                // Tracks which groups have loaded, which have not, & which are currently loading
                loaded_groups: null,
            }
        },

        watch: {
            collection: async function(coll) {

                // No collection passed - clear the table data and stop the function
                if (coll == null) {
                    this.tableData = [];
                    return;
                }

                // Init vars
                let group_opts = this.groupByOptions != null;
                this.loaded_groups = new Object;

                // If not loading progressively, load the whole collection
                if (!this.progressiveLoad) {
                    let snapshot = await this.collection.get();
                    this.addCollection(snapshot);
                }

                // If group objects are already known, set their statuses based on progressiveLoad
                if (group_opts) {
                    this.groupByOptions.forEach(group => {
                        this.loaded_groups[group] = this.progressiveLoad ? GROUP.UNLOADED : GROUP.LOADED;
                    });
                }

                // Init new object to hold options based on props
                let options = {
                    groupBy: this.groupBy,
                    groupValues: group_opts ? [this.groupByOptions] : null,
                    groupStartOpen: !this.progressiveLoad,

                    // Dynamically retrieve groups from database, if applicable
                    groupClick: async (e, group) => {
                        let key = group.getKey();

                        // If group has not yet been loaded, set the status to loading
                        if (should_load(this.loaded_groups[key])) {
                            this.loaded_groups[key] = GROUP.LOADING;

                            console.log("Group:", group);

                            // Query the database for all docs in this group
                            this.collection.where(this.groupBy, "==", key).get().then(

                                // Add the docs to the table, and set the status to loaded
                                query => {
                                    this.addCollection(query);
                                    this.loaded_groups[key] = GROUP.LOADED;
                                },

                                // Catch an error
                                error => {
                                    this.loaded_groups[key] = GROUP.FAILED;
                                    // TODO: Manually close the group
                                }
                            );
                        };

                        // Helper function to determine whether a database retrieval is necessary
                        function should_load(val) {
                            return val == GROUP.UNLOADED || val == GROUP.FAILED;
                        };
                    },

                    // Format the header bar for each group
                    groupHeader: (value, count, data, group) => {
                        return `<div style='display:inline;'>
                            Items from <i>${value}</i>
                        </div>
                        <div style='display:inline;float:right;'>
                            <span style='color:#d00;'>
                                (${gen_msg(this.loaded_groups[value])})
                            </span>
                        </div>`;

                        // Generate message based on group's load status
                        function gen_msg(val) {

                            // Fixes rendering error when groupByOptions is null
                            if (!group_opts) val = GROUP.LOADED;

                            switch (val) {
                                case GROUP.UNLOADED:
                                    return "Click to load.";
                                    break;
                                case GROUP.LOADING:
                                    return "Loading...";
                                    break;
                                case GROUP.LOADED:
                                    return `${count?count:"No"} item${count==1?"":"s"}.`;
                                    break;
                                case GROUP.FAILED:
                                    return "Load failed. Click to retry.";
                                    break;
                            };
                        };
                    },
                };


                // Initialize the new Tabulator object
                this.table = new Tabulator(this.$refs.table, {

                    // Allow args prop to override
                    layout: "fitColumns",
                    selectable:1,
                    rowSelected: row => { this.$emit('rowSelected', row); },
                    groupToggleElement: "header",

                    // Include args prop options
                    ...this.args,

                    // Override values in args prop
                    ...options,
                    data: this.tableData,
                    columns: this.getColumns(),
                });

                // If no groups were given, set all automatic groups to loaded
                if (!group_opts) {
                    this.table.getGroups().forEach(group => {
                        this.loaded_groups[group.getKey()] = group.LOADED;
                    });
                }

                this.$emit("table", this.table);

                this.table.redraw();
            },

            // If the table headers change, replace them in the Tabulator object
            heading_data: function(new_headers) {
                if (this.table != null) this.table.setColumns(new_headers);
            },

            // If the table data changes, replace it in the Tabulator object
            tableData: function(new_data) {
                if (this.table != null) this.table.replaceData(new_data);

                this.table.redraw();
            },

            visible: function(val) {
                this.table.redraw();
            },
        },

        methods: {

            // Add a retrieved collection to the table
            addCollection: function(snapshot) {
                this.tableData = this.tableData.concat(this.formatCollection(snapshot));
            },

            // Format a retrieved collection for the table
            formatCollection: function(snapshot) {
                var ret = [];
                snapshot.forEach(doc => { ret.push(this.format_doc(doc)) });
                return ret;
            },

            // Format a specific doc as a row
            format_doc: function(doc) {
                if (this.doc_formatter != undefined) {
                    return this.doc_formatter(doc);
                }

                var data = doc.data();
                
                // Save the doc's ID as an extra field - used for convenience in setting status
                data["documentID"] = doc.id;
                
                return data;
            },

            // Convert the heading data passed by prop into Tabulator column specifiers
            getColumns: function() {

                // Init arr to hold results
                let ret = [];

                // Loop through each heading passed by prop
                this.heading_data.forEach(heading => {

                    // If the heading is a string, convert it to an object and add it
                    if (typeof heading == "string") {
                        ret.push( {title: heading, field: heading} );
                    }

                    // If the heading is an object, add it directly
                    else {
                        ret.push(heading);
                    }
                });

                // Return results
                return ret;
            },

            redraw: function() {
                this.table.redraw();
            },
        }
    }
</script>