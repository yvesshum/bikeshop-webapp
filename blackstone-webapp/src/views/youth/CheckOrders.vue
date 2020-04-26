<template>
    <div>
        <top-bar/>
        <h1 class="title">Check Orders</h1>
        <b-table
            :items="items"
            :fields="fields"
            responsive="sm"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            :busy="isBusy"
        >
            <div slot="table-busy" class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Loading...</strong>
            </div>
        </b-table>
        <Footer/>
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
                isBusy: true,
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
                this.fields = JSON.parse(JSON.stringify(fields)).map(el=>{
                  return {
                    key:Object.keys(el.key)[0],
                    sortable:true
                    }}
                  );
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
                    data["Order Date"] = data["Order Date"].toDate();
                    ret.push(data);
                });
                return ret;
        },

        toggleBusy() {
            this.isBusy = !this.isBusy;
        },

    },

    async mounted() {
            await this.getHeaders();
            await this.getTData();
            this.toggleBusy();
    }

}


</script>

<style>
.title {
margin-bottom: 1rem;
}
</style>
