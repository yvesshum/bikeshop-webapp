<template>
    <div class = ApproveNewYouth>
        <top-bar/>
        <h1>Approve New Youth Dashboard</h1>
        <div class="toolbarwrapper">
                    <b-button variant="success" @click="accept" style="margin: 1%;">Approve</b-button>
                    <b-button variant="info" @click="editFields" style="margin: 1%;">Inspect Youth</b-button>
                    <b-button variant="danger" @click="reject" style="margin: 1%;">Reject/Cancel</b-button>
                    <b-button variant="info" @click="getNewData" style="margin: 1%;">Refresh Table</b-button>
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

        <b-modal v-model = "editModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Editing Registration
            </template>
            <!-- <div class="d-block text-center">
                <h3>Edit the following message:</h3>
            </div> -->
            <div v-for="(category, index) in editSelected" :key="index">
                Category: <b>{{category.Category}}</b> -
                <span v-if="category.Value != ''">Currently set to {{category.Value}}</span>
                <span v-if="category.Value == ''">Currently not set</span>
                <br>
                <SpecialInput v-model="category.NewValue" :inputType="category.Type" :args="arguments">
                </SpecialInput>
                <hr>
            </div>

            <b-button class="mt-3" block @click="saveEdits(); closeEditModal()" variant = "success">Save</b-button>
            <b-button class="mt-3" block @click="closeEditModal(); this.editSelected = {};" variant="warning">Cancel</b-button>

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
    import { VueTelInput } from 'vue-tel-input'
    import RadioGroupOther from '../../components/RadioGroupOther';
    import SpecialInput from '@/components/SpecialInput';
    import { initSpecialInputVal } from '../../scripts/SpecialInit';
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import moment from 'moment'
    import { forKeyVal } from '@/scripts/ParseDB.js';
    let fieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Profile");
    let optionsRef = db.collection("GlobalVariables").doc("Profile Options");
    let essayRef = db.collection("GlobalVariables").doc("EssayQuestions");

    let periodRef = db.collection("GlobalPeriods").doc("metadata");

    export default {
        name: 'ApproveNewYouth',
        components: {
          RadioGroupOther,
          VueTelInput,
          SpecialInput
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
                editModalVisible: false,
                editSelected: {},
                currentSeason: null,
                essayQuestions: {},
            };

        },
        methods: {
            async getEditFields() {
                let f = await fieldsRef.get();
                return f.data();
            },
            
            async getEssays() {
                let f = await essayRef.get();
                return f.data();
            },

            async getEditOptions() {
                let o = await optionsRef.get();
                return o.data();
            },

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
                fields.push({key: "Timestamp", sortable: true});
                fields.push({key: "New or Returning", sortable: true});
                forKeyVal(headers, function(name, val, n) {
                    if(name != "DOB"){
                        fields.push({key: name, sortable: true});
                    } else {
                        fields.push({key: "Birthdate", sortable: true});
                    }
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
                    data["Timestamp"] = moment(data["Timestamp"].toDate()).format("YYYY-MM-DD hh:mm a");
                    data["Birthdate"] = moment(data["DOB"].toDate()).format("YYYY-MM-DD");
                    if(data["New or Returning"] == "Returning Youth"){
                        data["New or Returning"] = "Returning Youth - ID: " + data["ReturningID"];
                    }
                    ret.push(data);
                });
                return ret;
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

                if(row["New or Returning"].split(" ")[0] == "Returning"){

                    let submitRef = db.collection("GlobalYouthProfile").doc(row["ReturningID"]);

                    let input = {};
                    Object.assign(input, row);
                    delete input["Document ID"];
                    delete input["Birthdate"];
                    input["ActivePeriods"][this.currentSeason] = input["Class"];
                    console.log(input)

                    let currentYear = this.currentSeason.split(" ")[1];
                    let s = await db.collection("GlobalPeriods").doc(currentYear).get();
                    var current = s.data();
                    current[this.currentSeason].push({
                      "Class" : row["Class"],
                      "First Name" : row["First Name"],
                      "ID" : row["ReturningID"],
                      "Last Name" : row["Last Name"]
                    });
                    let periodStatus = await db.collection("GlobalPeriods").doc(currentYear).update(current);
                    if (periodStatus) {
                        window.alert("Err: Could not add to period collection");
                        this.editSelected = {};
                        return null;
                    }

                    let logStatus = await submitRef.update(input);

                    if (logStatus) {
                        window.alert("Error on updating Global Youth Profile: " + row["ReturningID"]);
                        return null;
                    }
                } else {
                    await rb.ref('Youth ID Number').once("value", snapshot => {
                        console.log("Snapshot value: ")
                        console.log(snapshot.val())
                        newIDs.push(snapshot.val()["value"]);
                    })

                    console.log(newIDs[0])

                    let submitRef = db.collection("GlobalYouthProfile").doc(newIDs[0].toString());

                    let input = {};
                    Object.assign(input, row);
                    delete input["Document ID"];
                    delete input["Birthdate"];

                    input["ActivePeriods"] = {};
                    input["ActivePeriods"][this.currentSeason] = input["Class"];

                    console.log(input)

                    let currentYear = this.currentSeason.split(" ")[1];
                    console.log("Current year: " + currentYear);
                    let s = await db.collection("GlobalPeriods").doc(currentYear).get();
                    var current = s.data();
                    if(current[this.currentSeason] == undefined){
                        current[this.currentSeason] = [];
                        console.log("New Season");
                    }
                    current[this.currentSeason].push({
                      "Class" : row["Class"],
                      "First Name" : row["First Name"],
                      "ID" : newIDs[0].toString(),
                      "Last Name" : row["Last Name"]
                    });
                    console.log("Current season: " + this.currentSeason);
                    console.log("Current: " + current[this.currentSeason]);
                    let periodStatus = await db.collection("GlobalPeriods").doc(currentYear).update(current);
                    if (periodStatus) {
                        window.alert("Err: Could not add to period collection");
                        this.editSelected = {};
                        return null;
                    }

                    let logStatus = await submitRef.set(input);
                    console.log("Has set input")

                    if (logStatus) {
                        window.alert("Error on creating Global Youth Profile: " + row["Youth ID"]);
                        return null;
                    }
                }

                console.log("About to delete registration")
                let status = await db.collection("GlobalPendingRegistrations").doc(row["Document ID"]).delete();

                if (status) {
                    window.alert("Error on deleting youth registration: " + row["Document ID"]);
                    return null;
                }

                this.removeLocally(row["Document ID"]);

                this.closeLoadingModal();

                if(row["New or Returning"].split(" ")[0] != "Returning"){
                    newIDs[0] += 1;
                    await rb.ref('Youth ID Number').set({"value": newIDs[0]});
                    // await rb.ref('Youth ID Number').off("value", listener);

                    this.showModal("Success", "Successfully approved " + row["First Name"] + " " + row["Last Name"] + "'s registration")
                }
            },

            removeLocally(ID) {
                for (let i =0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === ID) {
                        this.items.splice(i, 1);
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

            async editFields() {
                let curRow = this.selected[0];
                if (curRow == null) {
                    return null;
                }
                var editSelectedLocal = [];

                let fields = await this.getEditFields();
                let options = await this.getEditOptions();

                var req_keys = [];
                var req_vals = [];
                forKeyVal(fields["required"], function(name, val, n) {
                    req_keys.push(name);
                    req_vals.push(val);
                });
                var currentClass = "";
                console.log("Hello?")
                for (let i = 0; i < req_keys.length; i ++) {
                    editSelectedLocal.push({
                        Category: req_keys[i],
                        Value: curRow[req_keys[i]],
                        NewValue: curRow[req_keys[i]],
                        Type: req_vals[i]
                    });
                    if(req_keys[i] == "Class"){
                        currentClass = curRow[req_keys[i]]
                    }
                }
                console.log(currentClass)
                var opt_keys = [];
                var opt_vals = [];
                forKeyVal(fields["optional"], function(name, val, n) {
                    opt_keys.push(name);
                    opt_vals.push(val);
                });
                for (let i = 0; i < opt_keys.length; i ++) {
                    editSelectedLocal.push({
                        Category: opt_keys[i],
                        Value: curRow[opt_keys[i]],
                        NewValue: curRow[opt_keys[i]],
                        Type: opt_vals[i]
                    });
                }
                var questions = this.essayQuestions[currentClass];
                console.log(questions);
                for (let i = 0; i < questions.length; i ++){
                    editSelectedLocal.push({
                        Category: questions[i],
                        Value: curRow["Essay"][questions[i]],
                        NewValue: curRow["Essay"][questions[i]],
                        Type: "Essay"
                    });
                }
                this.editSelected = editSelectedLocal;
                console.log(this.editSelected, this.selected);
                this.showEditModal();
            },

            showEditModal() {
                this.editModalVisible = true;
            },

            closeEditModal() {
                this.editModalVisible = false;
            },

            showEditModal() {
                this.editModalVisible = true;
            },

            closeEditModal() {
                this.editMsg = "";
                this.editModalVisible = false;
            },

            async saveEdits() {
                let note = this.editFields;
                this.closeEditModal();
                this.showLoadingModal("Saving changes..");
                let docID = this.selected[0]["Document ID"];
                // console.log(this.editSelected);

                var newValues = {}
                newValues["Essay"] = this.selected[0]["Essay"];
                console.log("Old Essays")
                console.log(newValues["Essay"])
                for(let i = 0; i < this.editSelected.length; i++){
                      let category = this.editSelected[i]["Category"];
                      var value = this.editSelected[i]["Value"];
                      if(this.editSelected[i]["NewValue"] != undefined){
                          value = this.editSelected[i]["NewValue"];
                      }
                      if(this.editSelected[i]["Type"] == "Essay"){
                          newValues["Essay"][category] = value;
                      } else{
                          newValues[category] = value;
                      }
                }
                console.log("New values: " + JSON.stringify(newValues));

                let status = await db.collection("GlobalPendingRegistrations").doc(docID).update(newValues);
                if (status) {
                    window.alert("Err: " +  err);
                    this.editSelected = {};
                    return null;
                }


                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === docID) {
                        console.log(this.editSelected);
                        for(var index in this.editSelected){
                            console.log(this.editSelected[index]);
                            if(this.editSelected[index].NewValue != undefined){
                                if(this.editSelected[index].Type != "Essay"){
                                    if(this.editSelected[index].Category == "DOB"){
                                        this.items[i][this.editSelected[index].Category] = this.editSelected[index].NewValue;
                                        this.items[i]["Birthdate"] = moment(this.editSelected[index].NewValue.toDate()).format("YYYY-MM-DD");
                                    } else {
                                        this.items[i][this.editSelected[index].Category] = this.editSelected[index].NewValue;
                                    }
                                } else {
                                    this.items[i]["Essay"][this.editSelected[index].Category] = this.editSelected[index].NewValue;
                                }
                            }
                        }
                        break;
                    }
                }
                this.closeLoadingModal();
                this.showModal("Success!", "Your registration has been saved")
                this.editSelected = {};
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
            let s = await periodRef.get();
            this.currentSeason = s.data()["CurrentRegistrationPeriod"];
            this.toggleBusy();
            this.essayQuestions = await this.getEssays();
        },
    }
</script>

<style>
.toolbarwrapper {
margin-bottom: 1rem;
}

</style>
