<template>
    <Table :headingdata="['test', 'test2']" :table_data="[{'test': 'hi', 'test2': 'bye'}]" @rowSelected="updateSelected"/>
</template>
<script>
    import Table from '../../components/Table';
    export default {
        name: 'ApproveOrders',
        components: {
            Table,
        },
        data() {
            return {
                selectedRow: null
            };

        },
        methods: {
            updateSelected (data) {
                this.selectedRow = data;
            }
        }
    }
</script>
