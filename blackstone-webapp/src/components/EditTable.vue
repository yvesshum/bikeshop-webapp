<!--Usage:-->
<!--<Table :headingdata="['test', 'test2']" :table_data="[{'test': 'hi', 'test2': 'bye'}]" @rowSelected="someMethod"/>-->
<template>
    <div ref="edit_table"></div>
</template>
<script>
    const Tabulator = require('tabulator-tables');
    export default {
        name: 'EditTable',
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
            }
        },
        mounted () {
            // instantiate Tabulator when element is mounted
            let defaultArgs = {
                            data: this.tableData, // link data to table
                            columns: this.getColumns(),
                            responsiveLayout:"hide",  //hide columns that dont fit on the table
                            tooltips:true,            //show tool tips on cells
                            addRowPos:"top",          //when adding a new row, add it to the top of the table
                            history:true,             //allow undo and redo actions on the table
                            resizableRows:true,       //allow row order to be changed
                            initialSort:[             //set the initial sort order of the data
                                {column:"name", dir:"asc"},
                            ],
                            selectable: 1,
                            layout: "fitColumns",
                            selectableRangeMode:"click",
                            pagination: "local",
                            paginationSize: "20",
                            groupBy:"Category",
                            rowSelected: row => {
                                this.$emit('selectedRow', row);
                            }
            };
            this.tabulator = new Tabulator(this.$refs.edit_table, {...defaultArgs, ...this.args});
            this.tableData = this.table_data;
        },
        methods: {
            getColumns () {
                let ret = [];
                for (let i = 0; i < this.headingdata.length; i++) {
                    let heading = this.headingdata[i];
                    if(heading == "Skills"){
                        ret.push({
                            title: heading,
                            field: heading,
                            editor:true,
                            widthGrow: 6
                        });
                    }else{
                        ret.push({
                            title: heading,
                            field: heading,
                            editor:true,
                            widthGrow: 1
                        })
                    }
                }
                return ret;
            }
        },
    }
</script>
<style>
    @import '~tabulator-tables/dist/css/tabulator.min.css';
</style>