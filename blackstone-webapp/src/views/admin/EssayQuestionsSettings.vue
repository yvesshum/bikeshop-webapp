<template>
    <div class = EssayQuestionsSettings>
        <top-bar/>
        <h1>Essay Question Settings</h1>
        <div class="toolbarwrapper">
              <b-button-toolbar style="justify-content: center;">
                    <b-button variant="success" @click="showAddModal" style="margin: 1%;">Add Question</b-button>
                    <b-button variant="info" @click="showEditModal"style="margin: 1%;">Edit Question</b-button>
                    <b-button variant="danger" @click="reject" style="margin: 1%;">Delete Question</b-button>
                    <b-button variant="info" @click="getNewData" style="margin: 1%;">Refresh Table</b-button>
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
            sort-by="Class"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            id="transfer_table"
            :busy="isBusy"
            sticky-header="500px"
            style="border-top: 5px solid grey;"
            fixed
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
            <template slot="modal-title">Remove Question</template>
            <div class="d-block text-center">
                <h3>{{rejectModalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeRejectModal" variant = "secondary">cancel</b-button>
            <b-button class="mt-3" block @click="closeRejectModal(); confirmedDelete();" variant = "danger">proceed</b-button>
        </b-modal>

        <b-modal v-model = "editModalVisible" hide-footer lazy>
          <template slot="modal-title">Edit essay question</template>
          Select the class this question goes to
          <SpecialInput v-model="editNewClass" inputType="Class" :args="arguments"></SpecialInput>
          What's your question?
          <SpecialInput v-model="editNewQuestion" inputType="Essay" :args="arguments"></SpecialInput>
          <b-button class="mt-3" block @click="saveEdits(); closeEditModal();" variant = "primary">Confirm edit</b-button>
          <b-button class="mt-3" block @click="closeEditModal()" variant="warning">Cancel</b-button>
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
                editOldQuestion: "",
                editOldClass: "",
                editNewQuestion: "",
                editNewClass: "",
                isBusy: true,
                loadingModalVisible: false,
                loadingModalHeader: "",
                rejectingClass: "",
                rejectingQuestion: "",
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
                        single_question["Question"] = data[class_opt][i].split('\\n').join('\n');;
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
                    let newQuestionSubmit = this.newQuestion.split('\n').join('\\n');
                    data[this.newClass].push(newQuestionSubmit);
                    let status = await questionsRef.update(data);
                    if (status) {
                        window.alert("Err could not add question");
                        return null;
                    }
                    var single_question = {};
                    single_question["Question"] = this.newQuestion;
                    single_question["Class"] = this.newClass;
                    this.items.push(single_question);
                    console.log("About to close loading?")
                    this.newQuestion = "";
                    this.newClass = "";
                }
                this.closeLoadingModal();
                this.showModal("Success", "Successfully added a question")
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
                this.showRejectModal("Are you sure?", "This cannot be undone! You are about to delete the question \""
                    + curRow["Question"] + "\" for the class " + curRow["Class"]);
            },
            

            async confirmedDelete() {
                this.closeRejectModal();
                this.showLoadingModal("Deleting...");
                let curRow = this.selected[0];
                
                this.showLoadingModal("Doing some work in the background...");

                let qs = await questionsRef.get();
                let data = qs.data();
                let rejectingLocal = this.rejectingQuestion.split("\n").join("\\n");
                for(var i = 0; i < data[this.rejectingClass].length; i++){
                    if(data[this.rejectingClass][i] === rejectingLocal){
                        data[this.rejectingClass].splice(i, 1);
                    }
                }
                let status = await questionsRef.update(data);
                if (status) {
                    window.alert("Err could not delete question");
                    return null;
                }


                //remove locally
                for (let i =0; i < this.items.length; i++) {
                    if (this.items[i]["Class"] === this.rejectingClass && this.items[i]["Question"] === this.rejectingQuestion) {
                        this.items.splice(i, 1);
                        this.$root.$emit('bv::refresh::table', 'transfer-table');
                        break;
                    }
                }

                this.$root.$emit('bv::refresh::table', 'transfer-table');
                this.closeLoadingModal();
                this.showModal("Successfully deleted question", "successfully deleted the question");
                this.rejectingClass = "";
                this.rejectingQuestion = "";
            },
            
            showEditModal() {
                let curRow = this.selected[0];
                this.editOldClass = curRow["Class"];
                this.editOldQuestion = curRow["Question"];
                this.editNewClass = curRow["Class"];
                this.editNewQuestion = curRow["Question"];
                this.editModalVisible = true;
            },
            
            closeEditModal() {
                this.editModalVisible = false;
            },
            
            async saveEdits() {
                this.closeEditModal();
                this.showLoadingModal("Deleting...");
                let curRow = this.selected[0];
                
                this.showLoadingModal("Doing some work in the background...");
                
                let qs = await questionsRef.get();
                let data = qs.data();
                let editOldQuestionSubmit = this.editOldQuestion.split('\n').join('\\n');
                for(var i = 0; i < data[this.editOldClass].length; i++){
                    console.log("Old question: " + editOldQuestionSubmit);
                    console.log("Old all: " + data[this.editOldClass][i]);
                    if(data[this.editOldClass][i] === editOldQuestionSubmit){
                        data[this.editOldClass].splice(i, 1);
                    }
                }
                if(!(this.editNewClass in data)){
                    data[this.editNewClass] = [];
                }
                let editNewQuestionSubmit = this.editNewQuestion.split('\n').join('\\n');
                data[this.editNewClass].push(editNewQuestionSubmit);
                let status = await questionsRef.update(data);
                if (status) {
                    window.alert("Err could not edit question");
                    return null;
                }

                //remove and add locally
                for (let i =0; i < this.items.length; i++) {
                    if (this.items[i]["Class"] === this.editOldClass && this.items[i]["Question"] === this.editOldQuestion) {
                        this.items.splice(i, 1);
                        this.$root.$emit('bv::refresh::table', 'transfer-table');
                        break;
                    }
                }
                var single_question = {};
                single_question["Question"] = this.editNewQuestion;
                single_question["Class"] = this.editNewClass;
                this.items.push(single_question);

                this.$root.$emit('bv::refresh::table', 'transfer-table');
                this.closeLoadingModal();
                this.editOldClass = "";
                this.editOldQuestion = "";
                this.editNewClass = "";
                this.editNewQuestion = "";
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
.toolbarwrapper {
  margin-bottom: 1rem;
}

</style>
