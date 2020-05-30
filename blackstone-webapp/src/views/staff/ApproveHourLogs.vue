//TODO: figure out how to do multiple hour logs.
// Plan: 
// Rewrite the functional routine for doing 1 approval
// Write an outer function to traverse selection, applying that functional routine
// If 1 fails, break out of it and say which ones were successful
// If successful, just display a modal of the successful ones 
<template>
    <div class = ApproveHourLogs>
        <div class="content">
        <top-bar/>
        <h1 class="title">Approve Hours Dashboard</h1>
        <div class="toolbar_wrapper">
            <b-button-toolbar style="justify-content: center;">
                    <b-button variant="success" @click="accept" style="margin: 1%;" :disabled="this.selected.length == 0">Approve</b-button>
                    <b-button variant="info" @click="editHours" style="margin: 1%;" :disabled="this.selected.length > 1 || this.selected.length == 0">Edit Hours</b-button>
                    <b-button variant="info" @click="editNote" style="margin: 1%;" :disabled="this.selected.length > 1 || this.selected.length == 0">Edit note</b-button>
                    <b-button variant="danger" @click="reject" style="margin: 1%;" :disabled="this.selected.length > 1 || this.selected.length == 0">Reject/Cancel Log</b-button>
                    <b-button variant="info" @click="getNewData" style="margin: 1%;">Refresh Table</b-button>
            </b-button-toolbar>
        </div>

        <b-table
            striped
            hover
            selectable
            responsive
            select-mode="multi"
            selectedVaraint = "success"
            :items="items"
            :fields="fields"
            @row-selected="rowSelected"
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

        <b-modal v-model = "hoursModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Editing hours
            </template>
            <!-- <div class="d-block text-center">
                <h3>Edit the following message:</h3>
            </div> -->
            <div v-for="(category, index) in editSelectedHours" :key="index">
                Category: <b>{{category.Category}}</b> - Currently set to {{category.Hours}} hour(s)
                <br>
                <VueNumberInput
                  center
                  v-model="editSelectedHours[index].Hours"
                  :min="0"
                  :step="0.5"
                  placeholder="category.Hours"
                  align="center"
                  style="width: 20rem"
                  controls
                  :inputtable="false"
                />
                <hr>
            </div>
            <!-- <b-form-textarea
                    id="textarea"
                    v-model="editSelectedHours"
                    placeholder="Enter a new message here.."
                    rows="2"
                    max-rows="5"
            ></b-form-textarea> -->

            <b-button class="mt-3" block @click="saveHours(); closeHoursModal()" variant = "success">Save</b-button>
            <b-button class="mt-3" block @click="closeHoursModal(); this.editSelectedHours = {};" variant="warning">Cancel</b-button>

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
    import moment from 'moment';
    import {Timestamp} from '../../firebase'
    import VueNumberInput from '@chenfengyuan/vue-number-input';
    export default {
        name: 'ApproveHourLogs',
        components: {
          VueNumberInput
        },
        data() {
            return {
                sortBy: 'Check In',
                sortDesc: false,
                fields: [],
                items: [],
                selected: [],
                shouldRefreshTable: true,

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
                loadingModalVisible: false,
                loadingModalHeader: "",
                hoursModalVisible: false,

                isBusy: true,
                
                deleteAmount: 0,
                
                editSelectedHours: {}
            };

        },
        methods: {
            rowSelected(items){
                this.selected = items;
            },
            reject: function(evt) {
                evt.preventDefault();
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

                let categories = await db.collection("GlobalVariables").doc("Hour Logging Categories").get();
                categories = categories.data();
                for (let i = 0; i <categories["Categories"].length; i ++) {
                    fields.push({key: categories["Categories"][i], sortable: true, editor:"input"});
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
                    console.log(data["Check In"].toDate());
                    // moment(data["Date"].toDate()).format("YYYY-MM-DD hh:mm a");
                    data["Check In"] = moment(data["Check In"].toDate()).format("YYYY-MM-DD hh:mm a");
                    data["Check Out"] = moment(data["Check Out"].toDate()).format("YYYY-MM-DD hh:mm a");
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
                
                //loop through selected 
                let documentIDs = [];
            
                let selectedLength = this.selected.length;

                this.shouldRefreshTable = false; // shouldn't refresh that often in bulk or else lag
                for (let i = 0; i < selectedLength; i++) {
                    console.log('A', this.selected[i], this.selected[i]["Document ID"])
                    let currentRow = this.selected[i];
                    documentIDs.push(currentRow["Document ID"]);

                    let approveStatus = await this.approvehours(currentRow);
                    if (!approveStatus) {
                        documentIDs.pop();
                        for (let j = 0; i < documentIDs.length; j++) {
                            this.removeLocally(documentIDs[j]);
                        }

                        //error message
                        let msg = "Error, something went wrong."
                        if (i > 0) {
                            msg += "The first " + i + "was approved though.";
                        }
                        //calculate successful fields 
                        this.showModal(msg);
                        this.$root.$emit('bv::refresh::table', 'transfer_table'); 
                        break;
                    }
                }
                //TODO: Table not updating properly after deleting
                
                for (let i = 0; i < documentIDs.length; i++) {
                    this.removeLocally(documentIDs[i]);
                }
                this.shouldRefreshTable = true;
                console.log('a', this.items.length);
                
                this.closeLoadingModal();
                this.$root.$emit('bv::refresh::table', 'transfer_table');                 

                if (selectedLength > 1) {
                    this.showModal("Success", "Successfully approved " + selectedLength + " hour log requests");
                }
                else {
                    // was hoping to make a more personal message but oh well
                     this.showModal("Success", "Successfully approved 1 hour log request")
                }

            },

            async approvehours(row) {
                let forYouthProfile = await db.collection("GlobalYouthProfile").doc(row["Youth ID"]).get();
                // console.log(forYouthProfile.data());
                if (forYouthProfile.data() == null) {
                    window.alert("Error, unable to retrieve Youth Profile data on id " + row["Youth ID"]);
                    return false;
                }

                this.showLoadingModal("Doing some work in the background...");
                forYouthProfile = forYouthProfile.data();
                var amount = 0;
                for(var key in this.selected[0]){
                    if(key != "Check In" && key != "Period" && key != "Youth ID" && key != "First Name" && key != "Notes" && key != "Document ID" && key != "Check Out" && key != "Last Name"){
                        let addAmount = parseFloat(this.selected[0][key]);
                        if(!isNaN(addAmount)){
                            amount += addAmount;
                        }
                        else {
                            window.alert("Error line 309 in ApproveHourLogs.vue, addAmount is NaN")
                        }
                    }
                }

                let newPendingHours = Math.round((parseFloat(forYouthProfile["Pending Hours"]) - amount)*100)/100;
                let newHoursEarned = Math.round((parseFloat(forYouthProfile["Hours Earned"]) + amount)*100)/100;
                
                console.log(newPendingHours, newHoursEarned);
                let acceptStatus = await db.collection("GlobalYouthProfile").doc(row["Youth ID"]).update({
                    "Pending Hours": newPendingHours,
                    "Hours Earned": newHoursEarned
                });

                if (acceptStatus) {
                    window.alert("Error, unable to change sender's profile hours")
                    return false;
                }


                let status3 = db.collection("GlobalPendingHours").doc(row["Document ID"]).delete();
                if (status3 == null) {
                    window.alert("Err, unable to delete log from GlobalPendingHours. Log document ID: " + row["Document ID"])
                    return false;;
                }
                console.log('w', worklog);
                console.log('r', row);
                let worklog = row; //soft copy
                let docID = worklog["Document ID"]; //to restore ID for local deletion
                delete worklog["Document ID"];
                console.log('w', worklog);
                console.log('r', row);
                worklog["Check In"] = Timestamp.fromDate(moment(worklog["Check In"], "YYYY-MM-DD hh:mm a").toDate());
                worklog["Check Out"] = Timestamp.fromDate(moment(worklog["Check Out"], "YYYY-MM-DD hh:mm a").toDate());

                let logStatus = await db.collection("GlobalYouthProfile").doc(row["Youth ID"]).collection("Work Log").doc().set(worklog);

                worklog["Document ID"] = docID

                if (logStatus) {
                    window.alert("Error on creating a log entry in Global Youth Profile -> Work Log of Youth ID: " + row["Youth ID"]);
                    return null;
                }

                return true;

            },

            removeLocally(ID) {
                for (let i = 0; i < this.items.length; i++) {
                    // console.log(this.items[i]["Document ID"], ID)
                    if (this.items[i]["Document ID"] === ID) {
                        this.items.splice(i, 1);
                        if (this.shouldRefreshTable) {
                            this.$root.$emit('bv::refresh::table', 'transfer_table');
                        }
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
                await this.getHeaders();
                await this.getTData();
                this.$root.$emit('bv::refresh::table', 'transfer_table');
                this.showModal("Table Refreshed!", "If you don't see something expected check the firebase backend console!")

            },

            reject() {
                let curRow = this.selected[0];
                this.rejectingDocumentID = curRow["Document ID"];
                this.rejectingID = curRow["Youth ID"];
                var amount = 0;
                for(var key in curRow){
                    if(key != "Check In" && key != "Period" && key != "Youth ID" && key != "First Name" && key != "Notes" && key != "Document ID" && key != "Check Out" && key != "Last Name"){
                        let addAmount = parseFloat(curRow[key]);
                        if(!isNaN(addAmount)){
                            amount += addAmount;
                        }
                        console.log("Current delete amount: " + amount);
                    }
                }
                console.log("Delete Amount: " + amount)
                this.deleteAmount = amount
                this.showRejectModal("Are you sure?", "This cannot be undone! You are about to delete "
                    + curRow["First Name"] + " " + curRow["Last Name"] + "'s log for " + this.deleteAmount);
            },

            async confirmedDelete() {
                //adjust hours
                this.closeRejectModal();
                this.showLoadingModal("Deleting...");
                let curRow = this.selected[0];

                let forYouthProfile = await db.collection("GlobalYouthProfile").doc(curRow["Youth ID"]).get();
                console.log(forYouthProfile.data());
                if (forYouthProfile.data() == null) {
                    window.alert("Error, unable to retrieve Youth Profile data on id " + curRow["Youth ID"]);
                    return null;
                }

                this.showLoadingModal("Doing some work in the background...");
                forYouthProfile = forYouthProfile.data();

                let newPendingHours = Math.round((parseFloat(forYouthProfile["Pending Hours"]) - this.deleteAmount) * 100) / 100;

                let rejectingStatus = db.collection("GlobalYouthProfile").doc(this.rejectingID).update({
                    "Pending Hours": newPendingHours,
                });

                if (rejectingStatus == null) {
                    window.alert("Err, unable to update " + this.rejectingID + " " + forYouthProfile["First Name"] + "'s profile")
                    return null;
                }

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

                this.$root.$emit('bv::refresh::table', 'transfer_table');
                this.closeLoadingModal();
                this.showModal("Successfully deleted hour log request", "successfully deleted request with ID of " 
                    + this.rejectingDocumentID + "\n You may safely disregard this message");
                this.rejectingDocumentID = "";



            },

            editNote() {
                this.editMsg = this.selected[0]["Notes"];
                console.log(this.editMsg, this.selected);
                this.showEditModal();

            },

            editHours() {
                let curRow = this.selected[0];
                if (curRow == null) {
                    return null;
                }
                var editSelectedHours = [];
                for(var key in curRow){
                    if(key != "Check In" && key != "Period" && key != "Youth ID" && key != "First Name" && key != "Notes" && key != "Document ID" && key != "Check Out" && key != "Last Name"){
                        editSelectedHours.push({
                            "Category" : key,
                            "Hours" : curRow[key]
                        });
                        console.log("Pushing");
                    }
                }
                this.editSelectedHours = editSelectedHours;
                console.log(this.editSelectedHours, this.selected);
                this.showHoursModal();
            },

            showHoursModal() {
                this.hoursModalVisible = true;
            },

            closeHoursModal() {
                this.hoursModalVisible = false;
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

            async saveHours() {
                let note = this.editHours;
                this.closeHoursModal();
                this.showLoadingModal("Saving hours..");
                let docID = this.selected[0]["Document ID"];
                console.log(this.editSelectedHours);

                let newTotalHours = 0;

                //will probably need to refactor this at some point
                var newHours = '{'
                for(let i = 0; i < this.editSelectedHours.length; i++){
                    let category = this.editSelectedHours[i]["Category"];
                    let hours = this.editSelectedHours[i]["Hours"];
                    newTotalHours += parseFloat(hours);
                    if(i == this.editSelectedHours.length - 1){
                        newHours += '"' + category + '": ' + hours
                    }else{
                        newHours += '"' + category + '": ' + hours + ','
                    }
                }
                newHours += '}';
                console.log("New hours: " + newHours);

                let status = await db.collection("GlobalPendingHours").doc(docID).update(JSON.parse(newHours));
                if (status) {
                    window.alert("Err: " +  err);
                    this.editSelectedHours = {};
                    return null;
                }

                //TODO: Update user's pending hours
                let profile = await db.collection("GlobalYouthProfile").doc(this.selected[0]["Youth ID"]).get();
                if (profile.data() == null) {
                    window.alert("Error, Youth ID does not exists: " + this.selected[0]["YouthID"])
                }
                //find amount to change for pending hours
                var originalAmount = 0;
                for(var key in this.selected[0]){
                    if(key != "Check In" && key != "Period" && key != "Youth ID" && key != "First Name" && key != "Notes" && key != "Document ID" && key != "Check Out" && key != "Last Name"){
                        let addAmount = parseFloat(this.selected[0][key]);
                        if(!isNaN(addAmount)){
                            originalAmount += addAmount;
                        }
                    }
                }

                let netChange = newTotalHours - originalAmount;
                let newPendingHours = Math.round((parseFloat(profile.data()["Pending Hours"]) + netChange)*100)/100
                let status2 = await db.collection("GlobalYouthProfile").doc(this.selected[0]["Youth ID"]).update({
                    "Pending Hours": newPendingHours
                })

                if (status2) {
                    window.alert("Error on updating Youth Profile's Pending Hours, ID: " + this.selected[0]["Youth ID"])
                }


                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === docID) {
                        console.log(this.editSelectedHours);
                        for(var index in this.editSelectedHours){
                            console.log(this.editSelectedHours[index]);
                            this.items[i][this.editSelectedHours[index].Category] = this.editSelectedHours[index].Hours;
                        }
                        break;
                    }
                }
                this.closeLoadingModal();
                this.showModal("Success!", "Your hours have been saved")
                this.editSelectedHours = {};
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
.toolbar_wrapper {
margin-bottom: 1rem;
position: sticky;
}
.title {
margin-bottom: 1rem;
padding: 0 1rem;
}

</style>
