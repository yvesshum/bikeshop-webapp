<!--TODO: Reject-->

<template>
    <div>
        <top-bar/>
        <h1>Transfer Hours Approval Dashboard</h1>
        <div class="toolbar_wrapper">
            <b-button-toolbar justify>

                <b-button-group>
                    <b-button variant="success" @click="accept">Approve</b-button>
                </b-button-group>

                <b-button-group>
                    <b-button variant="info" @click="editNote">Edit note</b-button>
                </b-button-group>
                <b-button-group>
                    <b-button variant="danger" @click="reject">Reject/Cancel Transfer</b-button>
                </b-button-group>

                <b-button-group>
                    <b-button variant="info" @click="getNewData">Refresh Table</b-button>
                </b-button-group>
            </b-button-toolbar>
        </div>

        <b-table
                selectable
                select-mode="single"
                selectedVaraint = "success"
                :items="items"
                :fields="fields"
                @row-selected="rowSelected"
                responsive="sm"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                id="transfer_table"
                :busy="isBusy"
        >
            <div slot="table-busy" class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong>Loading...</strong>
            </div>
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

        <b-modal v-model = "rejectModalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{rejectModalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{rejectModalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeRejectModal" variant = "secondary">cancel</b-button>
            <b-button class="mt-3" block @click="closeRejectModal(); confirmedDelete();" variant = "danger">proceed</b-button>
        </b-modal>

        <b-modal v-model = "editModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Editing
            </template>
            <!-- <div class="d-block text-center">
                <h3>Edit the following message:</h3>
            </div> -->
            <b-form-textarea
                    id="textarea"
                    v-model="editMsg"
                    placeholder="Enter a new message here.."
                    rows="2"
                    max-rows="5"
            ></b-form-textarea>

            <b-button class="mt-3" block @click="saveNote(); closeEditModal()" variant = "success">Save</b-button>
            <b-button class="mt-3" block @click="closeEditModal" variant="warning">Cancel</b-button>

        </b-modal>

        <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                {{loadingModalHeader}}
            </template>
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong> Loading...</strong>
                </div>
            </div>
        </b-modal>


    </div>



</template>
<script>
    import {db} from '../../firebase';
    export default {
        name: 'ApproveTransfers',
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
                modalVisible: false,
                rejectModalVisible: false,
                rejectModalHeader: "",
                rejectModalMsg: "",
                rejectingDocumentID: "",
                rejectingYouthID: "",
                editModalVisible: false,
                editMsg: "",
                isBusy: true,
                loadingModalVisible: false,
                loadingModalHeader: "",
            };

        },
        methods: {
            rowSelected(items){
                this.selected = items;
            },

            async getHeaders() {
                let headers = await db.collection("GlobalFieldsCollection").doc("OrderTransfers").get();
                headers = headers.data().fields;
                let fields = [];
                for (let i = 0; i < headers.length; i++) {
                    fields.push({key: headers[i], sortable: true});
                }
                this.fields = fields;
            },

            async getTData() {
                let snapshot = await db.collection("GlobalTransferHours").get();
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

            parse(item) {
                return JSON.parse(JSON.stringify(item));
            },

            showModal(header, msg) {
                this.modalHeader = header;
                this.modalMsg = msg;
                this.modalVisible = true;1
            },

            showRejectModal(header, msg) {
                this.rejectModalHeader = header;
                this.rejectModalMsg = msg;
                this.rejectModalVisible = true;
            },


            async accept() {
                let row = this.selected[0];
                console.log(row);
                //change remotely
                let fromYouthProfile = await db.collection("GlobalYouthProfile").doc(row["fromID"]).get();
                if (fromYouthProfile.data() == null) {
                    window.alert("Error, unable to retrieve Youth Profile data on id " + row["fromID"]);
                    return null;
                }

                this.showLoadingModal("Doing some work in the background...");
                fromYouthProfile = fromYouthProfile.data();
                let newFromPendingHours = parseFloat(fromYouthProfile["Pending Hours"]) + parseFloat(row["amount"]);
                let status = await db.collection("GlobalYouthProfile").doc(row["fromID"]).update({
                    "Pending Hours": newFromPendingHours.toString()
                });

                if (status) {
                    window.alert("Error, unable to change sender's profile hours")
                }

                let toYouthProfile = await db.collection("GlobalYouthProfile").doc(row["toID"]).get();
                if (toYouthProfile.data() == null) {
                    window.alert("Error, unable to retrieve Youth Profile data on id " + row["fromID"]);
                    return null;
                }

                this.showLoadingModal("Doing some work in the background...");
                toYouthProfile = toYouthProfile.data();
                let newToPendingHours = parseFloat(toYouthProfile["Pending Hours"]) - parseFloat(row["amount"]);
                let newToHoursEarned = parseFloat(toYouthProfile["Hours Earned"]) + parseFloat(row["amount"]);
                let status2 = await db.collection("GlobalYouthProfile").doc(row["toID"]).update({
                    "Pending Hours": newToPendingHours.toString(),
                    "Hours Earned": newToHoursEarned
                });

                if (status2) {
                    window.alert("Error, unable to change recipient's profile hours")
                    return null;
                }

                this.closeLoadingModal();
                this.showModal("Success", "Successfully approved " + row["fromName"] + "'s transfer to " + row["toName"])

                this.removeLocally(row["Document ID"]);

            },

            removeLocally(ID) {
                for (let i =0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === ID) {
                        this.items.splice(i, 1);
                        this.$root.$emit('bv::refresh::table', 'transfer-table');
                        break;
                    }
                }
            },

            closeModal() {
                this.modalVisible = false;
            },

            closeRejectModal() {
                this.rejectModalVisible = false;
            },

            async getNewData() {
                await this.getTData();
                this.$root.$emit('bv::refresh::table', 'transfer-table');
                this.showModal("Table Refreshed!", "If you don't see something expected check the firebase backend console!")

            },

            reject() {
                let rows = this.selected;
                for (let i = 0; i < rows.length; i++){
                    let curRow = rows[i];
                    this.rejectingDocumentID = curRow["Document ID"];
                    this.rejectingYouthID = curRow["Youth ID"];
                    this.showRejectModal("Are you sure?", "This cannot be undone! You are about to delete "
                        + curRow["First Name"] + " " + curRow["Last Name"] + "'s order on " + curRow["Order Date"]);
                }

            },

            async confirmedDelete() {
                //adjust hours
                let YouthProfile = await db.collection("GlobalYouthProfile").doc(this.rejectingYouthID).get();
                YouthProfile = YouthProfile.data();

                let itemIndex = 0;
                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === this.rejectingDocumentID) {
                        itemIndex = i;
                        break;
                    }
                }

                //if rejecting document is already approved
                if (this.items[itemIndex]["Status"] === "Approved") {
                    //decrease hours spent by item cost
                    let newHoursSpent = (parseFloat(YouthProfile["Hours Spent"]) - parseFloat(this.items[itemIndex]["Item Total Cost"])).toString();
                    db.collection("GlobalYouthProfile").doc(this.rejectingYouthID).update({
                        "Hours Spent": newHoursSpent
                    }).catch(err => {
                        window.alert("Error: " + err);
                        return null;
                    })
                }
                else { //if rejecting document is of pending status
                    let newHoursSpent = (parseFloat(YouthProfile["Hours Spent"]) - parseFloat(this.items[itemIndex]["Item Total Cost"])).toString();
                    let newPendingHours = (parseFloat(YouthProfile["Pending Hours"]) + parseFloat(this.items[itemIndex]["Item Total Cost"])).toString();
                    db.collection("GlobalYouthProfile").doc(this.rejectingYouthID).update({
                        "Hours Spent": newHoursSpent,
                        "Pending Hours": newPendingHours
                    }).catch(err => {
                        window.alert("Error: " + err);
                        return null;
                    });
                }

                this.toggleBusy();
                //remove order from database
                db.collection("GlobalPendingOrders").doc(this.rejectingDocumentID).delete().catch(err => {
                    window.alert("Error on deleting: " + err);
                    return null;
                });

                //remove locally
                this.items.splice(itemIndex, 1);

                this.$root.$emit('bv::refresh::table', 'transfer-table');

                this.showModal("Successfully deleted order", "successfully deleted order with ID of " + this.rejectingDocumentID);
                this.rejectingDocumentID = "";
                this.toggleBusy();


            },

            editNote() {
                if (this.selected.length > 1) this.showModal("Error", "You can only edit one note at a time!");
                else {
                    this.editMsg = this.selected[0]["Notes"];
                    this.showEditModal();
                }

            },

            showEditModal() {
                this.editModalVisible = true;
            },

            closeEditModal() {
                this.editMsg = "";
                this.editModalVisible = false;
            },

            saveNote() {
                let note = this.editMsg;
                let docID = this.selected[0]["Document ID"];
                db.collection("GlobalPendingOrders").doc(docID).update({"Notes": this.editMsg}).catch(err => {
                    window.alert("Err: ", err);
                    return null;
                });

                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === docID) {
                        this.items[i]["Notes"] = note;
                        break;
                    }
                }


            },

            toggleBusy() {
                this.isBusy = !this.isBusy;
            },

            showLoadingModal(msg) {
                this.loadingModalVisible = true;
                this.loadingModalHeader = msg;
            },

            closeLoadingModal() {
                this.loadingModalVisible = false;
            },


        },

        async mounted() {
            await this.getHeaders();
            await this.getTData();
            this.toggleBusy();

        },
    }
</script>

<style>
    .toolbar_wrapper{
        width: 60%;
        height: 40px;
        display: inline-block;
        margin: 0 auto 10px;
        border: 1px #42b983;
    }

</style>
