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
                    <b-button variant="info" @click="editFields">Inspect Youth</b-button>
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
                <b-form-input v-if="category.Type != 'radioOther' && category.Type != 'tel' && category.Type != 'radio'"
                :id="category.Type"
                :type="category.Type"
                v-model="editSelected[index].Value"
                :placeholder="category.Value"
                ></b-form-input>
                <div v-if="category.Type == 'radioOther'">
                    <RadioGroupOther v-model="category.Value" :options="category.id" nullOption>
                    </RadioGroupOther>
                </div>
                <div v-if="category.Type == 'tel'">
                    <vue-tel-input v-model="category.Value" v-bind:maxLen="14" v-bind:validCharactersOnly="true"></vue-tel-input>
                </div>
                <div v-if="category.Type == 'radio'">
                    <RadioGroupOther v-model="category.Value" :options="category.id" omitOtherOption>
                    </RadioGroupOther>
                </div>
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
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import moment from 'moment'
    import { forKeyVal } from '../../components/ParseDB.js';
    let fieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Profile");
    let optionsRef = db.collection("GlobalVariables").doc("Profile Options");
    let periodRef = db.collection("GlobalVariables").doc("ActivePeriods");

    export default {
        name: 'ApproveNewYouth',
        components: {
          RadioGroupOther,
          VueTelInput,
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
                activePeriods: []
            };

        },
        methods: {
            async getEditFields() {
                let f = await fieldsRef.get();
                return f.data();
            },

            async getSeasons() {
                let seasons = this.activePeriods["Seasons"]
                var current = this.activePeriods["CurrentPeriod"]
                let curSeason = current.split(" ")[0];
                var curYear = current.split(" ")[1];
                var new_seasons = [];
                var i = seasons.indexOf(curSeason);
                while(new_seasons.length < seasons.length){
                    new_seasons.push(seasons[i] + " " + curYear);
                    if(seasons[i] == "Fall"){
                        curYear = (parseInt(curYear) + 1).toString();
                    }
                    i += 1;
                    if(i >= seasons.length){
                        i = 0
                    }
                }
                new_seasons.push("None");
                return new_seasons;
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
              if(this.selected[0] != null) {
                let row = this.selected[0];
              }
              else {
                window.alert("Error on accepting Youth");
                return null;
              }


                this.showLoadingModal("Doing some work in the background...");

                var newIDs = []

                await rb.ref('Youth ID Number').once("value", snapshot => {
                    console.log("Snapshot value: ")
                    console.log(snapshot.val())
                    newIDs.push(snapshot.val()["value"]);
                })

                console.log(newIDs[0])

                let submitRef = db.collection("GlobalYouthProfile").doc(newIDs[0].toString());

                let input = JSON.parse(JSON.stringify(row));
                delete input["Document ID"];

                console.log(input)

                let s = await periodRef.get();
                var current = s.data();

                if(input["Registration Period"] == "None") {
                    current["NeverActiveYouths"].push({
                        "First Name": input["First Name"],
                        "ID": newIDs[0].toString(),
                        "Last Name": input["Last Name"]
                    });
                } else if(input["Registration Period"] == this.activePeriods["CurrentPeriod"]) {
                    current["CurrentActiveYouths"].push({
                        "First Name": input["First Name"],
                        "ID": newIDs[0].toString(),
                        "Last Name": input["Last Name"]
                    });
                } else {
                    current["FutureActiveYouths"].push({
                        "First Name": input["First Name"],
                        "ID": newIDs[0].toString(),
                        "Last Name": input["Last Name"]
                    });
                }
                let periodStatus = await periodRef.update(current);
                if (periodStatus) {
                    window.alert("Err: Could not add to period collection");
                    this.editSelected = {};
                    return null;
                }

                //Get rid of Timestamp as it's an unncessary field for Youth Profile
                delete input.Timestamp

                let logStatus = await submitRef.set(input);

                if (logStatus) {
                    window.alert("Error on creating Global Youth Profile: " + row["Youth ID"]);
                    return null;
                }

                let status = await db.collection("GlobalPendingRegistrations").doc(row["Document ID"]).delete();

                if (status) {
                    window.alert("Error on deleting youth registration: " + row["Document ID"]);
                    return null;
                }

                this.removeLocally(row["Document ID"]);

                this.closeLoadingModal();

                newIDs[0] += 1;
                await rb.ref('Youth ID Number').set({"value": newIDs[0]});
                // await rb.ref('Youth ID Number').off("value", listener);

                this.showModal("Success", "Successfully approved " + row["First Name"] + " " + row["Last Name"] + "'s registration")

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
                var editSelected = [];

                let fields = await this.getEditFields();
                let seasons = await this.getSeasons();
                let options = await this.getEditOptions();
                var getType = function (val) {
                    var type = "";
                    console.log(val)
                    if (val == "String"){
                        type = "text";
                    } else if (val == "Boolean"){
                        type = "radio";
                    } else if (val == "Grade"){
                        type = "number";
                    } else if (val == "Date"){
                        type = "date";
                    } else if (val == "Gender"){
                        type = "radioOther";
                    } else if (val == "Phone"){
                        type = "tel";
                    } else if (val == "Race"){
                        type = "radioOther";
                    }else if (val == "Period"){
                        type = "radio";
                    }else {
                        type = null;
                    }
                    return type;
                };
                var getLabels = function (val, fields) {
                    var labels = null;
                    if (val == "Boolean"){
                        labels = ["Yes", "No"];
                    }
                    if (val == "Race"){
                        labels = options["Races"];
                    }
                    else if (val == "Gender"){
                        labels = options["Genders"];
                    }
                    if (val == "Period"){
                        labels = seasons;
                    }
                    return labels;
                };
                forKeyVal(fields["required"], function(name, val, n) {
                    console.log(getType(val));
                    if(getType(val) != null){
                        if(getLabels(val, fields) == null){
                            editSelected.push({
                                Category: name,
                                Value: curRow[name],
                                Type: getType(val)
                            });
                        } else {
                            editSelected.push({
                                Category: name,
                                Value: curRow[name],
                                id: getLabels(val, fields),
                                Type: getType(val)
                            });
                        }
                    }
                });
                forKeyVal(fields["optional"], function(name, val, n) {
                    console.log(getType(val));
                    if(getType(val) != null){
                        if(getLabels(val, fields) == null){
                            editSelected.push({
                                Category: name,
                                Value: curRow[name],
                                Type: getType(val)
                            });
                        } else {
                            editSelected.push({
                                Category: name,
                                Value: curRow[name],
                                id: getLabels(val, fields),
                                Type: getType(val)
                            });
                        }
                    }
                });
                this.editSelected = editSelected;
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
                console.log(this.editSelected);

                var newValues = {}
                for(let i = 0; i < this.editSelected.length; i++){
                      let category = this.editSelected[i]["Category"];
                      let value = this.editSelected[i]["Value"];
                      newValues[category] = value
                }
                console.log("New values: " + newValues);

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
                            this.items[i][this.editSelected[index].Category] = this.editSelected[index].Value;
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
            this.activePeriods = s.data()
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
