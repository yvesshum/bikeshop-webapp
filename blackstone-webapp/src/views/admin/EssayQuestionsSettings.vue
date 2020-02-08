<template>
    <div class = EssayQuestionsSettings>
        <top-bar/>
        <h1>Essay Question Settings</h1>
        <div class="toolbar_wrapper">
            <b-button-toolbar justify>

                <b-button-group>
                    <b-button variant="success" @click="showAddModal">Add Question</b-button>
                </b-button-group>
                
                <b-button-group>
                    <b-button variant="info" @click="editFields">Edit Question</b-button>
                </b-button-group>
                
                <b-button-group>
                    <b-button variant="danger" @click="reject">Delete Question</b-button>
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

        <b-modal v-model = "addModalVisible" hide-footer lazy >
            <template slot="modal-title">Add new essay question</template>
            Select the class this question goes to
            <SpecialInput v-model="newClass" inputType="Class" :args="arguments"></SpecialInput>
            What's your new question?
            <SpecialInput v-model="newQuestion" inputType="Essay" :args="arguments"></SpecialInput>
            <b-button class="mt-3" block @click="confirmAdd(); closeAddModal();" variant = "primary">Add question</b-button>
            <b-button class="mt-3" block @click="closeAddModal()" variant="warning">Cancel</b-button>
        </b-modal>

        <b-modal v-model = "rejectModalVisible" hide-footer lazy >
          
        </b-modal>

        <b-modal v-model = "editModalVisible" hide-footer lazy>
            
        </b-modal>
        
        <b-modal v-model = "editModalVisible" hide-footer lazy>
            
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
    import SpecialInput from '@/components/SpecialInput';
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import moment from 'moment'
    import { forKeyVal } from '@/scripts/ParseDB.js';
    let questionsRef = db.collection("GlobalVariables").doc("EssayQuestions");
    let classesRef = db.collection("GlobalPeriods").doc("metadata");
    
    export default {
        name: 'EssayQuestionsSettings',
        components: {
          SpecialInput
        },
        data() {
            return {
                sortBy: 'Check In',
                sortDesc: false,
                headers: [],
                items: [],
                selected: [],
                newClass: "",
                newQuestion: "",
                modalHeader: "",
                modalMsg: "",
                modalVisible: false,
                addModalVisible: false,
                rejectModalVisible: false,
                rejectModalHeader: "",
                rejectModalMsg: "",
                rejectingClass: "",
                rejectingQuestion: "",
                rejectingID: "",
                editModalVisible: false,
                editMsg: "",
                isBusy: true,
                loadingModalVisible: false,
                loadingModalHeader: "",
                editModalVisible: false,
                editSelected: {}
            };

        },
        methods: {
            
            rowSelected(items){
                this.selected = items;
            },

            async getHeaders() {
                let headers = [];
                headers.push({key: "Question", sortable: true});
                headers.push({key: "Class", sortable: true});
                this.headers = headers;
            },

            async getTData() {
                let qs = await questionsRef.get();
                let data = qs.data();
                var class_opt;
                let ret = [];
                var single_question;
                for(class_opt in data){
                    for(var i = 0; i < data[class_opt].length; i++){
                        single_question = {};
                        single_question["Question"] = data[class_opt][i];
                        single_question["Class"] = class_opt;
                        ret.push(single_question);
                    }
                }
                this.items = ret;
            },

            showModal(header, msg) {
                this.modalHeader = header;
                this.modalMsg = msg;
                this.modalVisible = true;
            },
            
            showAddModal() {
                this.addModalVisible = true;
            },

            showRejectModal(header, msg) {
                this.rejectModalHeader = header;
                this.rejectModalMsg = msg;
                this.rejectModalVisible = true;
            },


            async confirmAdd() {
                this.showLoadingModal("Doing some work in the background...");
                let qs = await questionsRef.get();
                let data = qs.data();
                console.log("New class: " + this.newClass);
                console.log("Data: " + data);
                if(this.newClass == undefined || this.newClass=="" || this.newQuestion == undefined || this.newQuestion == ""){
                    window.alert("You must select a class and enter a question");
                } else {
                    if(!(this.newClass in data)){
                        data[this.newClass] = [];
                    }
                    data[this.newClass].push(this.newQuestion);
                    let status = await questionsRef.update(data);
                    if (status) {
                        window.alert("Err could not add question");
                        return null;
                    }
                    console.log("What now?")
                    var single_question = {};
                    single_question["Question"] = this.newQuestion;
                    single_question["Class"] = this.newClass;
                    this.items.push(single_question);
                    console.log("Aboit to close loading?")
                }
                this.closeLoadingModal();
                this.showModal("Success", "Successfully added a question")
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
            
            closeAddModal() {
                this.addModalVisible = false;
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
                this.rejectingClass = curRow["Class"];
                this.rejectingQuestion = curRow["Question"];
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
            
            async editFields() {
                
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
