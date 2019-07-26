<template>
    <div>
        <top-bar/>
        <h1>Order Status Dashboard</h1>
        <div class="toolbar_wrapper">
            <b-button-toolbar justify>
                <p>Selected {{selected.length}} rows</p>
                <b-button-group>
                    <b-dropdown right text="Set Status">
                        <b-dropdown-item @click="setPending">Pending</b-dropdown-item>
                        <b-dropdown-item @click="setApproved">Approved</b-dropdown-item>
                        <b-dropdown-item @click="setCompleted">Completed</b-dropdown-item>
                    </b-dropdown>
                </b-button-group>
                <b-button-group>
                    <b-button>Check for new data</b-button>
                </b-button-group>
            </b-button-toolbar>
        </div>

        <b-table
            selectable
            select-mode="multi"
            selectedVaraint = "success"
            :items="items"
            :fields="fields"
            @row-selected="rowSelected"
            responsive="sm"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
        >
        </b-table>

        <b-modal v-model = "modalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{modalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{modalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">ok</b-button>
        </b-modal>

    </div>



</template>
<script>
    import {db} from '../../firebase';
    export default {
        name: 'ApproveOrders',
        components: {
        },
        data() {
            return {
                sortBy: 'Order Date',
                sortDesc: false,
                fields: [],
                items: [],
                selected: [],
                modalHeader: "",
                modalMsg: "",
                modalVisible: false
            };

        },
        methods: {
            rowSelected(items){
                this.selected = items;
            },

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
                    data["documentID"] = doc.id; //this is not shown, used for the sake of convenience in setting status later
                    ret.push(data);
                });
                return ret;
            },

            parse(item) {
                return JSON.parse(JSON.stringify(item));
            },

            showModal(header, msg) {
                this.modalHeader = header;
                this.modalMsg = msg;
                this.modalVisible = true;
            },

            async setPending() {
                let rows = this.selected ;
                //chceck if the row is valid to be set as pending
                for (let i = 0; i < rows.length; i++) {
                    let curData = rows[i];

                    if (curData["Status"] !== "Pending") {
                        this.showModal("Error", "Unable to set already pending status to 'pending' in the order of " + curData["First Name"] + " " + curData["Last Name"] + " on " + curData["Order Date"]);
                        break;
                    }
                    else {
                        //changed GlobalPendingOrders to be unique document IDs
                        //that way we should be able to access the document ID
                        let YouthID = curData["Youth ID"];
                        let err = await db.collection("GlobalPendingOrders").doc(curData["documentID"]).update({Status: "Pending"});
                        if (err) {
                            window.alert("Error on setting status, please check your internet connection and try again");
                            return null;
                        }
                        //move hours from pending back to hours spent
                        let YouthProfile = await db.collection("GlobalYouthProfile").doc(YouthID).get();
                        YouthProfile = YouthProfile.data();

                        console.log('itc', curData["Item Total Cost"])
                        console.log(YouthProfile["Pending Hours"], YouthProfile["Hours Spent"]);
                        db.collection("GlobalYouthProfile").doc(YouthID).update({
                            "Pending Hours": (parseFloat(YouthProfile["Pending Hours"]) + parseFloat(curData["Item Total Cost"])).toString(),
                            "Hours Spent": (parseFloat(YouthProfile["Hours Spent"]) - parseFloat(curData["Item Total Cost"])).toString()
                        }).then((err) => {
                            if (err) console.log(err)
                        })

                        //change Status text locally
                    }
                }

            },

            setApproved() {

            },

            setCompleted() {

            },

            closeModal() {
                this.modalVisible = false;
            },
        },

        async mounted() {
            await this.getHeaders();
            await this.getTData();

        },
    }
</script>

<style>
    .toolbar_wrapper{
        width: 50%;
        height: 40px;
        display: inline-block;
        margin: 0 auto 10px;
        border: 1px #42b983;

    }

</style>
