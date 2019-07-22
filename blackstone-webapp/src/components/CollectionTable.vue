<!--
    Usage:

    <CollectionTable :heading_data="['Category 1', 'Category 2', 'Category 3']" :current_profile="Profile" collection_name="Collection">

    heading_data: list of headers in the order to be displayed
    current_profile: profile to track
    collection_name: collection within the profile to display
-->

<!-- TODO: Read just from collection, skipping profile? -->

<template>
    <Table :headingdata="heading_data" :table_data="tableData"></Table>
</template>
<script>
    import Table from "@/components/Table.vue"

    export default {
        name: 'CollectionTable',
        props: ['heading_data', 'current_collection', 'args'],
        components: {Table},

        data: function () {
            return {
                tableData: [], // data for table to display
            }
        },

        watch: {
            current_collection: async function(coll) {
                if (coll != null) {
                    var temp = await coll.get();
                    this.tableData = this.formatCollection(temp);
                }
                else {
                    this.tableData = [];
                }
            }
        },

        methods: {
            formatCollection: function(snapshot) { //formats into array of objects
                var ret = [];
                snapshot.forEach(doc => {
                    var data = doc.data();
                    data["Order Date"] = (new Date(doc.id).toLocaleString());
                    data["documentID"] = doc.id; //this is not shown, used for the sake of convenience in setting status later
                    ret.push(data);
                });
                return ret;
            }

        }
    }
</script>