<!--Values in this table are naturally reactive to changes to realtime database-->
<template>
    <div>
        <top-bar/>
        <h1 style="margin-top: 5px; margin-bot: 5px">Currently Checked-In Youth</h1>

        <b-button @click="viewProfile" style="margin-top: 5px; margin-bot: 5px" variant="info">View Profile</b-button>

        <b-table
                :items="items"
                :fields="fields"
                responsive="sm"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :busy="isBusy"
                selectable
                select-mode="single"
                selectedVaraint = "success"
                @row-selected="rowSelected"
        >
            <div slot="table-busy" class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong>Loading...</strong>
            </div>
        </b-table>
    </div>

</template>

<script>
import {rb} from '../../firebase';
import {db} from '../../firebase';
import moment from 'moment'

let checkedInRef = rb.ref('Checked In');


export default {
    name: 'CheckedIn',
    components: {
    },
    data() {
        return {
            sortBy: 'Check In Time',
            sortDesc: false,
            fields: [],
            items: [],
            isBusy: true,
            selected: []
        }
    },

    methods: {
        parse(item) {
            return JSON.parse(JSON.stringify(item));
        },

        rowSelected(items){
            this.selected = items;
        },

        async getHeaders() {
            let headers = await db.collection("GlobalFieldsCollection").doc("Checked In").get();
            headers = headers.data().fields;
            let fields = [];
            for (let i = 0; i < headers.length; i++) {
                fields.push({key: Object.keys(headers[i])[0], sortable: true});
            }
            this.fields = fields;
        },

        async getTData() {
            rb.ref('Checked In').on('value', snapshot => {
                this.items = this.formatData(snapshot.val());
            })

        },

        formatData(data){
            let ret = [];
            for (let key in data){
                let items = data[key]
                items["Check In Time"] = moment(items["Check In Time"]).format("MM/DD hh:mm a")
                ret.push({...{
                    "Youth ID": key,
                }, ...items})
            }
            

            //format Check In Time to be a nicer string

            return ret;

        },

        toggleBusy() {
            this.isBusy = !this.isBusy;
        },

        viewProfile() {
            let YouthID = this.selected[0]["Youth ID"];
            window.alert("This is an upcoming feature :) look forward to it!")
        },

    },

    async mounted() {
        await this.getHeaders();
        await this.getTData();
        this.toggleBusy();

    }
}

</script>