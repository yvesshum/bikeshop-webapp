<template>
    <div class = ApproveHourLogs>
        <top-bar/>
        <h1>Approve Hours Dashboard</h1>
        <div class="toolbar_wrapper">
            <b-button-toolbar justify>

                <b-button-group>
                    <b-button variant="success" @click="accept">Approve</b-button>
                </b-button-group>

                <b-button-group>
                    <b-button variant="info" @click="editNote">Edit note</b-button>
                </b-button-group>
                <b-button-group>
                    <b-button variant="danger" @click="reject">Reject/Cancel Log</b-button>
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
        name: 'ApproveHourLogs',
        components: {
        },
        data() {
            return {
                sortBy: 'Date',
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
                rejectingID: "",
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
                let headers = await db.collection("GlobalFieldsCollection").doc("Log Table Headers").get();
                if (headers.data() == null) {
                    window.alert("Error, unable to get fields 'Log Table Headers' from 'GlobalFieldsCollection'");
                    return null;
                }

                headers = headers.data()["Work Log Headers"];
                let fields = [];
                for (let i = 0; i < headers.length; i++) {
                    fields.push({key: headers[i], sortable: true});
                }
                
                let categories = await db.collection("ApronSkills").doc("Categories").get();
                categories = categories.data();
                for(var category in categories) {
                    fields.push({key: category, sortable: true});
                }
                this.fields = fields;
            },

            async getTData() {
                let snapshot = await db.collection("GlobalPendingHours").get();
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
                //change remotely
                let forYouthProfile = await db.collection("GlobalYouthProfile").doc(row["For ID"]).get();
                console.log(forYouthProfile.data());
                if (forYouthProfile.data() == null) {
                    window.alert("Error, unable to retrieve Youth Profile data on id " + row["For ID"]);
                    return null;
                }

                this.showLoadingModal("Doing some work in the background...");
                forYouthProfile = forYouthProfile.data();
                var amount = 0;
                for(var key in this.selected[0]){
                    if(key != "Date" && key != "For ID" && key != "For Name" && key != "Notes" && key != "Document ID"){
                        let addAmount = parseFloat(this.selected[0][key]);
                        if(!isNaN(addAmount)){
                            amount += addAmount;
                        }
                        console.log("Current approve amount: " + amount);
                    }
                    console.log(key);
                }
                // let newPendingHours = parseFloat(forYouthProfile["Pending Hours"]) - amount;
                let newHoursEarned = parseFloat(forYouthProfile["Hours Earned"]) + amount;
                // console.log("New pending hours: " + newPendingHours)
                console.log("New current hours: " + newHoursEarned)
                let acceptStatus = await db.collection("GlobalYouthProfile").doc(row["For ID"]).update({
                    // "Pending Hours": newPendingHours.toString(), 
                    "Hours Earned": newHoursEarned.toString()
                });

                if (acceptStatus) {
                    window.alert("Error, unable to change sender's profile hours")
                }

                this.removeLocally(row["Document ID"]);
                
                // let status3 = db.collection("GlobalPendingHours").doc(row["Document ID"]).delete();
                // if (status3 == null) {
                //     window.alert("Err, unable to delete log from GlobalPendingHours. Log document ID: " + row["Document ID"])
                //     return null;
                // }
                
                let logStatus = await db.collection("GlobalYouthProfile").doc(row["For ID"]).collection("Work Log").doc().set({
                    "Date": row["Date"],
                    "For ID": row["For ID"],
                    "For Name": row["For Name"],
                    "Amount": amount.toString(),
                    "Notes": row["Notes"]
                });

                if (logStatus) {
                    window.alert("Error on creating a log entry in Global Youth Profile -> Work Log of Youth ID: " + row["For ID"]);
                    return null;
                }
                
                this.closeLoadingModal();
                this.showModal("Success", "Successfully approved " + row["For Name"] + "'s log")

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
                let curRow = this.selected[0];
                this.rejectingDocumentID = curRow["Document ID"];
                this.rejectingID = curRow["For ID"];
                this.showRejectModal("Are you sure?", "This cannot be undone! You are about to delete "
                    + curRow["For Name"]  + "'s log for " + curRow["Amount"]);
            },

            async confirmedDelete() {
                //adjust hours
                this.closeRejectModal();
                this.showLoadingModal("Deleting...");
                
                // let forYouthProfile = await db.collection("GlobalYouthProfile").doc(row["For ID"]).get();
                // console.log(forYouthProfile.data());
                // if (forYouthProfile.data() == null) {
                //     window.alert("Error, unable to retrieve Youth Profile data on id " + row["For ID"]);
                //     return null;
                // }
                // 
                // this.showLoadingModal("Doing some work in the background...");
                // forYouthProfile = forYouthProfile.data();
                // 
                // var amount = 0;
                // for(var key in this.selected[0]){
                //     if(key != "Date" && key != "For ID" && key != "For Name" && key != "Notes" && key != "Document ID"){
                //         let addAmount = parseFloat(this.selected[0][key]);
                //         if(!isNaN(addAmount)){
                //             amount += addAmount;
                //         }
                //         console.log("Current approve amount: " + amount);
                //     }
                // }
                // console.log("Delete Amount: " + amount)
                // let newPendingHours = parseFloat(forYouthProfile["Pending Hours"]) - amount;
                // 
                // let rejectingStatus = db.collection("GlobalYouthProfile").doc(this.rejectingID).update({
                //     "Pending Hours": newPendingHours.toString(),
                // });
                // 
                // if (rejectingStatus == null) {
                //     window.alert("Err, unable to update " + this.rejectingID + " " + forYouthProfile["First Name"] + "'s profile")
                //     return null;
                // }

                let status3 = db.collection("GlobalPendingHours").doc(this.rejectingDocumentID).delete();
                if (status3 == null) {
                    window.alert("Err, unable to delete log from GlobalPendingHours. Log document ID: " + this.rejectingDocumentID)
                    return null;
                }


                //remove locally
                let itemIndex = 0;
                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === this.rejectingDocumentID) {
                        itemIndex = i;
                        break;
                    }
                }
                this.items.splice(itemIndex, 1);

                this.$root.$emit('bv::refresh::table', 'transfer-table');
                this.closeLoadingModal();
                this.showModal("Successfully deleted transfer", "successfully deleted transfer with ID of " + this.rejectingDocumentID);
                this.rejectingDocumentID = "";



            },

            editNote() {
                this.editMsg = this.selected[0]["Notes"];
                console.log(this.editMsg, this.selected);
                this.showEditModal();

            },

            showEditModal() {
                this.editModalVisible = true;
            },

            closeEditModal() {
                this.editMsg = "";
                this.editModalVisible = false;
            },

            async saveNote() {
                let note = this.editMsg;
                this.closeEditModal();
                this.showLoadingModal("Saving note..");
                let docID = this.selected[0]["Document ID"];
                let status = await db.collection("GlobalPendingHours").doc(docID).update({"Notes": note});
                if (status) {
                    window.alert("Err: " +  err);
                    return null;
                }

                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === docID) {
                        this.items[i]["Notes"] = note;
                        break;
                    }
                }
                this.closeLoadingModal();
                this.showModal("Success!", "Your note has been saved")
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