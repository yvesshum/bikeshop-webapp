<template>
    <div>
        <top-bar/>
        <b-table
            :items="items"
            :fields="fields"
            responsive="sm"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
        >
        </b-table>


    </div>

</template>

<script>
import {db} from '../../firebase';

export default {
    name: 'YouthCheckOrders',
    components: {
    },

    data() {
            return {
                sortBy: 'Order Date',
                sortDesc: false,
                fields: [],
                items: [],
            };

    },

    methods: {
        async getHeaders() {
                let headers = await db.collection("GlobalFieldsCollection").doc("StaffOrderApproval").get();
                headers = headers.data().fields;
                let fields = [];
                for (let i = 0; i < headers.length; i++) {
                    fields.push({key: headers[i], sortable: true});
                }
                this.fields = fields;
        },

        async getTData() {
                let snapshot = await db.collection("GlobalPendingOrders").get();
                this.items = this.formatCollection(snapshot);
        },

        formatCollection(snapshot) {
                let ret = [];
                snapshot.forEach(doc => {
                    let data = doc.data();
                    data["Document ID"] = doc.id; //this is not shown, used for the sake of convenience in setting status later
                    ret.push(data);
                });
                return ret;
        },

    },

    async mounted() {
            await this.getHeaders();
            await this.getTData();
    }

}

</script>