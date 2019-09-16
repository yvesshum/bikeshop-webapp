<template>
    <div class = ApproveNewYouth>
        <top-bar/>
        <h1>Approve New Youth Dashboard</h1>
        <div class="toolbar_wrapper">
            <b-button-toolbar justify>

                <b-button-group>
                    <b-button variant="success" @click="accept">Approve</b-button>
                </b-button-group>
                
                <b-button-group>
                    <b-button variant="info" @click="editHours">Inspect Youth</b-button>
                </b-button-group>
                
                <b-button-group>
                    <b-button variant="danger" @click="reject">Reject/Cancel</b-button>
                </b-button-group>

                <b-button-group>
                    <b-button variant="info" @click="getNewData">Refresh Table</b-button>
                </b-button-group>
            </b-button-toolbar>
        </div>

        <b-table
            striped
            hover
            selectable
            responsive
            select-mode="single"
            selectedVaraint = "success"
            :items="items"
            :fields="fields"
            @row-selected="rowSelected"
            sticky-header
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
        
        <b-modal v-model = "hoursModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Editing Registration
            </template>
            <!-- <div class="d-block text-center">
                <h3>Edit the following message:</h3>
            </div> -->
            <div v-for="(category, index) in editSelectedHours" :key="index">
                Category: <b>{{category.Category}}</b> - Currently set to {{category.Hours}} hour(s)
                <br>
                <b-form-input
                id="number"
                type="number"
                v-model="editSelectedHours[index].Hours"
                :placeholder="category.Hours"
                ></b-form-input>
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



</template>
<script>
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import moment from 'moment'
    import { forKeyVal } from '../../components/ParseDB.js';
    export default {
        name: 'ApproveNewYouth',
        components: {
        },
        data() {
            return {
                sortBy: 'Check In',
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
                deleteAmount: 0,
                hoursModalVisible: false,
                editSelectedHours: {}
            };

        },
        methods: {
            rowSelected(items){
                this.selected = items;
            },

            async getHeaders() {
                let headers = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();
                if (headers.data() == null) {
                    window.alert("Error, unable to get fields 'YouthProfile' from 'GlobalFieldsCollection'");
                    return null;
                }

                headers = headers.data()["required"];
                let fields = [];
                forKeyVal(headers, function(name, val, n) {
                    fields.push({key: name, sortable: true});
                });
                this.fields = fields;
            },

            async getTData() {
                let snapshot = await db.collection("GlobalPendingRegistrations").get();
                this.items = this.formatCollection(snapshot);
            },

            formatCollection(snapshot) {
                let ret = [];
                snapshot.forEach(doc => {
                    let data = doc.data();
                    data["Document ID"] = doc.id; //this is not shown, used for the sake of convenience in setting status later
                    // data["Check In"] = moment(data["Check In"]).format('MM/DD, hh:mm a')
                    // data["Check Out"] = moment(data["Check In"]).format('MM/DD, hh:mm a')
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

                this.showLoadingModal("Doing some work in the background...");
                
                var newIDs = []
                
                let listener = await rb.ref('Youth ID Number').on("value", snapshot => { 
                    console.log("Snapshot value: " + snapshot.val())
                    newIDs.push(snapshot.val());
                })
                
                console.log("New ID: " + newIDs[0])
                
                let submitRef = db.collection("GlobalYouthProfile").doc(newIDs[0].toString());
                
                let input = row
                
                let logStatus = await submitRef.set(input);

                if (logStatus) {
                    window.alert("Error on creating Global Youth Profile: " + row["Youth ID"]);
                    return null;
                }
                
                // let status = await db.collection("GlobalPendingRegistrations").doc(row["Document ID"]).delete();
                // 
                // if (status) {
                //     window.alert("Error on deleting youth registration: " + row["Document ID"]);
                //     return null;
                // }
                
                this.removeLocally(row["Document ID"]);
                
                this.closeLoadingModal();
                newIDs[0] += 1;
                // rb.ref('Youth ID Number').set({value: newIDs[0]});
                // var newPostKey = firebase.database().ref().child('posts').push().key;
                rb.ref('Youth ID Number').off("value", listener);
                this.showModal("Success", "Successfully approved " + row["First Name"] + " " + row["Last Name"] + "'s log")

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
                this.rejectingID = curRow["Youth ID"];
                this.showRejectModal("Are you sure?", "This cannot be undone! You are about to delete "
                    + curRow["First Name"] + " " + curRow["Last Name"] + "'s youth registration");
            },

            async confirmedDelete() {
                //adjust hours
                this.closeRejectModal();
                this.showLoadingModal("Deleting...");
                let curRow = this.selected[0];
                
                this.showLoadingModal("Doing some work in the background...");

                let status = db.collection("GlobalPendingRegistrations").doc(this.rejectingDocumentID).delete();
                if (status == null) {
                    window.alert("Err, unable to delete youth registration ID: " + this.rejectingDocumentID)
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
                this.showModal("Successfully deleted registration", "successfully deleted registration with ID of " + this.rejectingDocumentID);
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
                    if(key != "Check In" && key != "Youth ID" && key != "First Name" && key != "Notes" && key != "Document ID" && key != "Check Out" && key != "Last Name"){
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
                var newHours = '{'
                for(let i = 0; i < this.editSelectedHours.length; i++){
                    let category = this.editSelectedHours[i]["Category"];
                    let hours = this.editSelectedHours[i]["Hours"];
                    newTotalHours += parseFloat(hours);
                    if(i == this.editSelectedHours.length - 1){
                        newHours += '"' + category + '": "' + hours + '"'
                    }else{
                        newHours += '"' + category + '": "' + hours + '",'
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
                    if(key != "Check In" && key != "Youth ID" && key != "First Name" && key != "Notes" && key != "Document ID" && key != "Check Out" && key != "Last Name"){
                        let addAmount = parseFloat(this.selected[0][key]);
                        if(!isNaN(addAmount)){
                            originalAmount += addAmount;
                        }
                    }
                }

                let netChange = newTotalHours - originalAmount;
                let newPendingHours = Math.round((parseFloat(profile.data()["Pending Hours"]) + netChange)*100)/100
                let status2 = await db.collection("GlobalYouthProfile").doc(this.selected[0]["Youth ID"]).update({
                    "Pending Hours": newPendingHours.toString()
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
    .toolbar_wrapper{
        width: 60%;
        height: 40px;
        display: inline-block;
        margin: 0 auto 10px;
        border: 1px #42b983;
    }

</style>