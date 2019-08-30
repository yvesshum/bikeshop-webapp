<!--Usage:-->
<!--<Table :headingdata="['test', 'test2']" :table_data="[{'test': 'hi', 'test2': 'bye'}]" @rowSelected="someMethod"/>-->
<template>
    <div class="table">
        <div ref="table"></div>
        <div ref="placeholder" class="tabulator-placeholder" style="text-align:center;">
            <span class="tabulator-placeholder">{{placeholder}}</span>
        </div>
    </div>
</template>
<script>
    const Tabulator = require('tabulator-tables');
    export default {
        name: 'Table',
        props:['headingdata', 'table_data', 'args', "placeholder"],
        data: function () {
            return {
                tabulator: null, // variable to hold your table
                tableData: [], // data for table to display
            }
        },
        watch: {
            // update table if data changes
            tableData: {
                handler: function (newData) {
                    this.tabulator.replaceData(newData)
                },
                deep: true
            },
            table_data: function() {
                this.tableData = this.table_data;
            },
            headingdata: function() {
                this.tabulator.setColumns(this.getColumns());
            },
        },
        mounted () {
            // instantiate Tabulator when element is mounted
            let defaultArgs = {
                            data: this.tableData, // link data to table
                            columns: this.getColumns(),
                            selectable: 1,
                            layout: "fitColumns",
                            selectableRangeMode:"click",
                            pagination: "local",
                            paginationSize: "20",
                            placeholder: this.$refs.placeholder,

                            // If a row is (de)selected, let the parent handle it
                            rowSelected:   row => this.$emit('selectedRow',   row),
                            rowDeselected: row => this.$emit('deselectedRow', row),
            };

            this.tabulator = new Tabulator(this.$refs.table, {...defaultArgs, ...this.args});
            this.tableData = this.table_data;

            this.$emit("Table", this.tabulator);
        },
    //     [
    //     {title: 'Name', field: 'name', sorter: 'string', width: 200, editor: true},
    //      title: 'Age', field: 'age', sorter: 'number', align: 'right', formatter: 'progress'}
    //     ]
        methods: {
            getColumns () {
                let ret = [];
                for (let i = 0; i < this.headingdata.length; i++) {
                    let heading = this.headingdata[i];
                    if (typeof heading == "string") {
                        ret.push({
                            title: heading,
                            field: heading,
                        });
                    } else {
                        ret.push(heading);
                    }
                }
                return ret;
            },

        },



    }
</script>
<style>
    @import '~tabulator-tables/dist/css/tabulator.min.css';
</style>