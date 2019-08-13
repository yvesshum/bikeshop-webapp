<!--Usage:-->
<!--<Table :headingdata="['test', 'test2']" :table_data="[{'test': 'hi', 'test2': 'bye'}]" @rowSelected="someMethod"/>-->
<template>
    <div ref="table"></div>
</template>
<script>
    const Tabulator = require('tabulator-tables');
    export default {
        name: 'Table',
        props:['headingdata', 'table_data', 'args'],
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
                            rowSelected: row => {
                                console.log(row);
                                this.$emit('selectedRow', row);
                            }
            };

            this.tabulator = new Tabulator(this.$refs.table, {...defaultArgs, ...this.args});
            this.tableData = this.table_data;
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
                    ret.push({
                        title: heading,
                        field: heading,
                    })
                }
                return ret;
            },

        },



    }
</script>
<style>
    @import '~tabulator-tables/dist/css/tabulator.min.css';
</style>