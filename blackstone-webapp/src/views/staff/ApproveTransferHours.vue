<template>
    <div>
        <div class="content">
        <top-bar/>
        <h1 class="title">Transfer Hours Approval Dashboard</h1>
        <PageHeader pageCategory="Staff Headers" pageName="Approve Hour Transfers"></PageHeader>
        <div class="toolbarwrapper">
            <b-button-toolbar style="justify-content: center;">
                    <b-button variant="success" @click="accept" style="margin: 1%;" :disabled="selected.length == 0">Approve</b-button>
                    <b-button variant="info" @click="editNote" style="margin: 1%;" :disabled="selected.length == 0">Edit note</b-button>
                    <b-button variant="danger" @click="reject" style="margin: 1%;" :disabled="selected.length == 0">Delete Transfer</b-button>
                    <b-button variant="info" @click="getNewData" style="margin: 1%;">Refresh Table</b-button>
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
                sticky-header="500px"
                style="border-top: 5px solid grey;"
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
        <Footer/>
    </div>



</template>
<script>
    import {db} from '../../firebase';
    import moment from 'moment'
    import {Timestamp} from '@/firebase.js'
    import PageHeader from "@/components/PageHeader.vue"
    export default {
        name: 'ApproveTransfers',
        components: {
          PageHeader,
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
                rejectingFromID: "",
                rejectingToID: "",
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
                let headers = await db.collection("GlobalFieldsCollection").doc("Hour Transfers").get();
                if (headers.data() == null) {
                    window.alert("Error, unable to get fields 'Hour Transfers' from 'GlobalFieldsCollection'");
                    return null;
                }
                headers = headers.data().fields;
                let fields = [];
                for (let i = 0; i < headers.length; i++) {
                    fields.push({key: Object.keys(headers[i])[0], sortable: true});
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
                    data["Date"] = moment(data["Date"].toDate()).format("YYYY-MM-DD hh:mm a");
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
                let fromYouthProfile = await db.collection("GlobalYouthProfile").doc(row["From ID"]).get();
                console.log(fromYouthProfile.data());
                if (fromYouthProfile.data() == null) {
                    window.alert("Error, unable to retrieve Youth Profile data on id " + row["From ID"]);
                    return null;
                }

                this.showLoadingModal("Doing some work in the background...");
                fromYouthProfile = fromYouthProfile.data();
                let newFromPendingHours = Math.round((parseFloat(fromYouthProfile["Pending Hours"]) + parseFloat(row["Amount"]))*100)/100;
                let acceptFromStatus = await db.collection("GlobalYouthProfile").doc(row["From ID"]).update({
                    "Pending Hours": newFromPendingHours
                });

                if (acceptFromStatus) {
                    window.alert("Error, unable to change sender's profile hours")
                }

                let toYouthProfile = await db.collection("GlobalYouthProfile").doc(row["To ID"]).get();
                if (toYouthProfile.data() == null) {
                    window.alert("Error, unable to retrieve Youth Profile data on id " + row["To ID"]);
                    return null;
                }

                toYouthProfile = toYouthProfile.data();
                let newToPendingHours = Math.round((parseFloat(toYouthProfile["Pending Hours"]) - parseFloat(row["Amount"]))*100)/100;
                let newToHoursEarned = Math.round((parseFloat(toYouthProfile["Hours Earned"]) + parseFloat(row["Amount"]))*100)/100;
                let acceptToStatus = await db.collection("GlobalYouthProfile").doc(row["To ID"]).update({
                    "Pending Hours": newToPendingHours,
                    "Hours Earned": newToHoursEarned
                });

                if (acceptToStatus) {
                    window.alert("Error, unable to change recipient's profile hours");
                    return null;
                }

                //Create a log collection in Global Youth Profile for these transfers
                console.log(row);
                let logFromStatus = await db.collection("GlobalYouthProfile").doc(row["From ID"]).collection("Transfer Log").doc().set({
                    "Date": Timestamp.fromDate(moment(row["Date"], "YYYY-MM-DD hh:mm a").toDate()),
                    "To ID": row["To ID"],
                    "To Name": row["To Name"],
                    "Amount": parseFloat(row["Amount"]),
                    "Notes": row["Notes"],
                    "Period": row["Period"]
                });

                let logToStatus = await db.collection("GlobalYouthProfile").doc(row["To ID"]).collection("Transfer Log").doc().set({
                    "Date": Timestamp.fromDate(moment(row["Date"], "YYYY-MM-DD hh:mm a").toDate()),
                    "From ID": row["From ID"],
                    "From Name": row["From Name"],
                    "Amount": parseFloat(row["Amount"]),
                    "Notes": row["Notes"],
                    "Period": row["Period"]
                });

                if (logFromStatus) {
                    window.alert("Error on creating a log entry in Global Youth Profile -> Transfer Log of Youth ID: " + row["From ID"]);
                    return null;
                }
                if (logToStatus) {
                    window.alert("Error on creating a log entry in Global Youth Profile -> Transfer Log of Youth ID: " + row["To ID"]);
                    return null;
                }

                this.closeLoadingModal();

                this.showModal("Success", "Successfully approved " + row["From Name"] + "'s transfer to " + row["To Name"] + " for " + row["Amount"])

                let deleteStatus = db.collection("GlobalTransferHours").doc(row["Document ID"]).delete();
                if (deleteStatus == null) {
                    window.alert("Err, unable to delete transfer from GlobalTransferHours. Transfer document ID: " + this.rejectingDocumentID)
                    return null;
                }

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
                this.showModal("Table Refreshed!", "The table should contain the latest information")

            },

            reject() {
                let curRow = this.selected[0];
                this.rejectingDocumentID = curRow["Document ID"];
                this.rejectingToID = curRow["To ID"];
                this.rejectingFromID = curRow["From ID"];
                this.showRejectModal("Are you sure?", "This cannot be undone! You are about to delete "
                    + curRow["From Name"]  + "'s transfer for " + curRow["Amount"] + " to " + curRow["To Name"]);
            },

            async confirmedDelete() {
                //adjust hours
                this.closeRejectModal();
                this.showLoadingModal("Deleting...");
                let toYouthProfile = await db.collection("GlobalYouthProfile").doc(this.rejectingToID).get();
                toYouthProfile = toYouthProfile.data();
                if(toYouthProfile == null) {
                    window.alert("Error, Unable to find Youth ID of " + this.rejectingToID);
                    return null;
                }
                let fromYouthProfile = await db.collection("GlobalYouthProfile").doc(this.rejectingFromID).get();
                fromYouthProfile = fromYouthProfile.data();
                if(fromYouthProfile == null) {
                    window.alert("Error, Unable to find Youth ID of " + this.rejectingFromID);
                    return null;
                }

                let amount = parseFloat(this.selected[0]["Amount"]);
                let newToPendingHours = Math.round((parseFloat(toYouthProfile["Pending Hours"]) - amount)*100)/100;
                let newFromPendingHours = Math.round((parseFloat(fromYouthProfile["Pending Hours"]) + amount)*100)/100;
                let newFromHoursSpent = Math.round((parseFloat(fromYouthProfile["Hours Spent"]) - amount)*100)/100;

                let rejectingToStatus = db.collection("GlobalYouthProfile").doc(this.rejectingToID).update({
                    "Pending Hours": newToPendingHours
                });
                if (rejectingToStatus == null) {
                    window.alert("Err, unable to update " + this.rejectingToID + " " + toYouthProfile["First Name"] + "'s profile")
                    return null;
                }

                let rejectingFromStatus = db.collection("GlobalYouthProfile").doc(this.rejectingFromID).update({
                    "Pending Hours": newFromPendingHours,
                    "Hours Spent": newFromHoursSpent
                });

                if (rejectingFromStatus == null) {
                    window.alert("Err, unable to update " + this.rejectingFromID + " " + fromYouthProfile["First Name"] + "'s profile")
                    return null;
                }

                let status3 = db.collection("GlobalTransferHours").doc(this.rejectingDocumentID).delete();
                if (status3 == null) {
                    window.alert("Err, unable to delete transfer from GlobalTransferHours. Transfer document ID: " + this.rejectingDocumentID)
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
                // this.showModal("Successfully deleted transfer", "successfully deleted transfer with ID of " + this.rejectingDocumentID);
                this.showModal("Successfully deleted transfer", "Successfully deleted " + fromYouthProfile["First Name"] + "'s transfer to " + toYouthProfile["First Name"] + " for " + amount)

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
                let status = await db.collection("GlobalTransferHours").doc(docID).update({"Notes": note});
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
.title {
  margin-bottom: 1rem;
}
</style>
