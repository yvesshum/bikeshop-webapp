// TODO: Field names must not have symbols
//TODO:  Adding and deleting not working well
//TODO: Initial value must have something in it, cannot be undefined 

<template>
<div>
    <b-button-group style="margin-bottom:10px">
        <b-button variant="warning" @click="resetOrdering">Reset Ordering</b-button>
        <b-button variant="success" @click="saveOrdering">Save Ordering</b-button>
    </b-button-group>

    <draggable v-model="field_data" @start="drag=true" @end="drag=false">
        <FieldCard
            v-for="item in field_data"
            :key="Object.keys(item.data)[0]"
            :field="Object.keys(item.data)[0]"
            :type="Object.values(item.data)[0]"
            :isProtected="item.isProtected"
            v-on:editClicked="editButtonClicked"
            v-on:deleteClicked="deleteButtonClicked"
        />
    </draggable>
    <p v-if="field_data.length === 0">No Fields Found </p>
    <br>
    <b-button-group>
        <b-button variant="info" @click="addButtonClicked">
            Add a Class <font-awesome-icon icon="plus" class ="icon alt"/>
        </b-button>
    </b-button-group>
    
    

    <!-- Modals -->
    <!-- Msg -->
    <b-modal v-model = "modal.msg.visible" hide-footer lazy>
        <template slot="modal-title">
            {{modal.msg.title}}
        </template>
        <div class="d-block text-center">
            <h3>{{modal.msg.text}}</h3>
        </div>
        <b-button class="mt-3" block @click="closeMsgModal" variant = "primary">ok!</b-button>
    </b-modal>

    <!-- Loading -->
    <b-modal v-model = "modal.loading.visible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
        <template slot="modal-title">
            {{modal.loading.title}}
        </template>
        <div class="d-block text-center">
            <div slot="table-busy" class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong> Loading...</strong>
            </div>
        </div>
    </b-modal>

    <!-- Editing -->
    <b-modal v-model = "modal.edit.visible" hide-footer lazy>
        <template slot = "modal-title">
            Editing Field
        </template>
        <p>Class Name:</p>
        <b-form-textarea
                id="textarea"
                v-model="modal.edit.field_name"
                placeholder="Edit here.."
                rows="1"
                max-rows="1"
        ></b-form-textarea>
        <br>
        <p>Age group the class is suitable for:</p>
        <b-form-textarea
                id="textarea"
                v-model="modal.edit.field_type"
                placeholder="Edit here.."
                rows="1"
                max-rows="1"
        ></b-form-textarea>
        <br>
        <br>
        <strong style="color: red">Please check if you have a duplicate class name before saving so bad things won't happen.</strong>
        <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" variant = "warning">Save and change all existing uses of the class</b-button>
        <b-button class="mt-3" block @click="edit_closeModal()" variant="success">Cancel</b-button>
    </b-modal>

    <!-- Deleting -->
    <b-modal v-model = "modal.delete.visible" hide-footer lazy>
        <template slot = "modal-title">
            Deleting Field
        </template>
        <div class="d-block text-center">
            <h3>Are you sure you want to delete {{modal.delete.field_name}}?</h3>
        </div>
        <b-button class="mt-3" block @click="deleteField(); delete_closeModal()" variant = "danger">Permanently delete this class</b-button>
        <b-button class="mt-3" block @click="delete_closeModal()" variant="success">Cancel</b-button>
    </b-modal>

    <!-- Adding -->
    <b-modal v-model = "modal.add.visible" hide-footer lazy>
        <template slot = "modal-title">
            Adding A Class
        </template>
        <p style="margin-bottom: 0">Class Name</p>
        <b-form-textarea
            id="textarea"
            v-model="modal.add.field_name"
            placeholder="This cannot be empty and must not already exist!"
            :state="isValidNewFieldName"
            size="sm"
            rows="1"
            max-rows="1"
        ></b-form-textarea>
        <p style="margin-bottom: 0">Age group the class is suitable for:</p>
        <b-form-textarea
            id="textarea"
            v-model="modal.add.field_type"
            :options="modal.edit.options"
            placeholder="Edit here.."
            rows="1"
            max-rows="3"
        ></b-form-textarea>

        <b-button class="mt-3" block @click="addField(); add_closeModal()" variant = "warning" :disabled="!isValidNewFieldName && modal.add.initial_value == null">Add a new class</b-button>
        <b-button class="mt-3" block @click="add_closeModal()" variant="success">Cancel</b-button>

    </b-modal>


</div>
</template>

<script>
import draggable from 'vuedraggable'
import FieldCard from '../components/FieldCard.vue'
import {db} from '@/firebase.js'
import { Timestamp } from '../firebase'

export default {
    name: 'ClassEditor',
    components: {
        FieldCard,
        draggable,
    },
    props: {
        sourceFieldName: String, //required, optional, hidden
        sourceDocument: String, //name of doc of where the fields are from 
        elements: Array, //Actual data of the fields
        collectionsToEdit: Array, //name of collection of where the fields are from
        subcollectionsToEdit: Array
    },
    computed: {
        isValidNewFieldName: function() {
            return !this.field_data.some(f => {return Object.keys(f.data).indexOf(this.modal.add.field_name) > -1}) && this.modal.add.field_name.length > 0
        }
    },
    data() {
        return {
            field_data: [],
            field_data_initial_copy: [],
            modal: {
                msg: {
                    visible: false,
                    title: "",
                    text: ""
                },
                loading: {
                    visible: false,
                    title: ""
                },
                edit: {
                    visible: false,
                    field_name: "",
                    original_field_name: "",
                    field_type: "",
                    original_field_type: "",
                    options: [],
                },
                delete: {
                    visible: false,
                    field_name: ""
                },
                add: {
                    visible: false,
                    field_name: "",
                    field_type: "String",
                    initial_value: ""
                }
            }
        }
    },
    mounted() {
        this.field_data = this.elements;
        this.field_data_initial_copy = this.field_data;

        // Grab input types
        db.collection("GlobalVariables").doc("SpecialInput").get().then(query => {
            this.modal.edit.options = query.data().types
        })
    },
    methods: {
        parse(item) {
            return JSON.parse(JSON.stringify(item));
        },

        editButtonClicked(data) {
            this.modal.edit.field_name = Object.keys(data)[0];
            this.modal.edit.original_field_name = Object.keys(data)[0];
            this.modal.edit.field_type = Object.values(data)[0];
            this.modal.edit.original_field_type = Object.values(data)[0];
            
            this.modal.edit.visible = true;
        },

        deleteButtonClicked(field) {
            this.modal.delete.field_name = Object.keys(field)[0];
            this.modal.delete.visible = true;  
        },
        
        addButtonClicked() {
            this.modal.add.field_name = "";
            this.modal.add.field_type = "";
            this.modal.add.initial_value = "";
            this.modal.add.visible = true;

        },
        

        resetOrdering() {
            this.field_data = this.field_data_initial_copy;
        },

        async saveOrdering() {
            this.showLoadingModal("One second...");
            let fields = [];
            this.field_data.forEach(field => {
                fields.push(field.data);
            });
            // console.log(fields);
            let updateVal = {};
            updateVal[this.sourceFieldName] = fields;
            // console.log(updateVal);
            let updateStatus = await db.collection("GlobalPeriods").doc("metadata").update(updateVal);

            if (updateStatus) {
                window.alert("Error on updating GlobalPeriods doc: " + this.sourceDocument);
                return null;
            }
            this.field_data_initial_copy = this.field_data;
            this.closeLoadingModal();
            this.showMsgModal("Success", "The ordering has been saved.");
        },

        //Modal Methods
        showMsgModal(title, text) {
            this.modal.msg.visible = true;
            this.modal.msg.title = title;
            this.modal.msg.text = text;
        },
        closeMsgModal() {
            this.modal.msg.visible = false;
        },
        showLoadingModal(title) {
            this.modal.loading.visible = true;
            this.modal.loading.title = title;
        },
        closeLoadingModal() {
            this.modal.loading.visible = false;
        },
        edit_closeModal() {
            this.modal.edit.visible = false;
        },
        delete_closeModal() {
            this.modal.delete.visible = false;
        },
        add_closeModal() {
            this.modal.add.visible = false;
        },
        checkDateTime(type,value){
          if(type!=="Datetime") return value;
          else return Timestamp.fromDate(new Date(value))
        },
        async save_edit() {

            this.edit_closeModal();
            this.showLoadingModal("Saving..");
            let newFieldName = this.modal.edit.field_name;
            let newFieldType = this.modal.edit.field_type;
            // console.log(this.modal.edit.original_field_name);
            for (let i = 0; i < this.field_data.length; i++) {
                if (Object.keys(this.field_data[i].data)[0] === this.modal.edit.original_field_name) {
                    //Update GlobalFieldsCollection
                    //reshape
                    let updatedFieldNames = this.field_data.map(element => {
                        return element.data
                    })
                    delete updatedFieldNames[i][this.modal.edit.original_field_name];
                    updatedFieldNames[i][newFieldName] = newFieldType;
                    let updateObject = {};
                    updateObject["Classes"] = updatedFieldNames;

                    let updateStatus = await db.collection("GlobalPeriods").doc("metadata").update(updateObject);
                    if (updateStatus) {
                        window.alert("Error on updating GlobalPeriods on firebase. " + updateStatus);
                        return null;
                    }

                    // Update entries in GlobalPeriods
                    let globalPeriodsSnapshot = await db.collection("GlobalPeriods").get()
                    for (let doc of globalPeriodsSnapshot.docs) {
                        if (doc.id != 'metadata') {
                            let docData = doc.data()
                            // Loop through each season key in docData, check if class matches original field name 
                            let updatedDoc = {}
                            for (let season in docData) {
                                updatedDoc[season] = []
                                for (let entry of docData[season]) {
                                    if (entry.Class === this.modal.edit.original_field_name) {
                                        updatedDoc[season].push({
                                            ...entry,
                                            Class: newFieldName
                                        })
                                    } else {
                                        updatedDoc[season].push({...entry})
                                    }
                                }
                            }
                            await db.collection("GlobalPeriods").doc(doc.id).update(updatedDoc)
                        }
                    }

                    // Update entries in GlobalPendingRegistrations
                    let registrationSnapshot = await db.collection("GlobalPeriods").where("Class", "==", this.modal.edit.original_field_name).get()
                    for (let registration of registrationSnapshot.docs) {
                        await db.collection("GlobalPeriods").doc(registration.id).update({Class: newFieldName})
                    }

                    // Update entries in GlobalYouthProfile
                    let youthProfileSnapshot = await db.collection("GlobalYouthProfile").where("Class", "==", this.modal.edit.original_field_name).get()
                    for (let youthProfile of youthProfileSnapshot.docs) {
                        await db.collection("GlobalYouthProfile").doc(youthProfile.id).update({Class: newFieldName})
                    }


                    // Update Essay questions field name
                    let essays = await db.collection("GlobalVariables").doc("EssayQuestions").get();
                    var dat = essays.data();
                    for(var key in dat){
                        if (key === this.modal.edit.original_field_name){
                            dat[newFieldName] = dat[key];
                            delete dat[key];
                        }
                    }
                    db.collection("GlobalVariables").doc("EssayQuestions").set(dat);
                    // query.forEach(async doc => {
                    //     let id = doc.id;
                    //     let data = doc.data();
                    //     if(data.)
                    //     data[newFieldName] = data[this.modal.edit.original_field_name]
                    //     delete data[this.modal.edit.original_field_name];
                    //     await db.collection(this.collectionsToEdit[j]).doc(id).set(data);
                    // })
                  

                    //Local Update
                    let newVal = {};
                    newVal[newFieldName] = newFieldType;
                    this.field_data[i].data = newVal;

                    //Updating the copied version. Since ordering may have changed, we'll need to search through this.
                    for (let j = 0; j < this.field_data_initial_copy.length; j++) {
                        if (Object.keys(this.field_data_initial_copy[j].data)[0] === this.modal.edit.original_field_name) {
                            delete this.field_data_initial_copy[j][this.modal.edit.original_field_name]
                            this.field_data_initial_copy[j][newFieldName] = newFieldType;
                        }
                    }

                    this.closeLoadingModal();
                    this.showMsgModal("Success!", "Successfully updated firebase GlobalPeriods")
                    break;
                }
            }
        },
        async deleteField() {
            this.delete_closeModal();
            this.showLoadingModal();

            let updatedFields = this.field_data.map(element => {return element.data});
            for (let i = 0; i < updatedFields.length; i ++) {
                if (Object.keys(updatedFields[i])[0] === this.modal.delete.field_name) {
                    // Delete from global fields collection
                    updatedFields.splice(i, 1);
                    let updateValue = {};
                    updateValue["Classes"] = updatedFields;
                    let deleteStatus = await db.collection("GlobalPeriods").doc('metadata').update(updateValue);
                    if (deleteStatus) {
                        window.alert("Error on removing a class from GlobalPeriods. Class: " + this.modal.delete.field_name + ", doc: " + this.sourceDocument);
                        return null;
                    }

                    // Delete from collections
                    // ^ We agreed to not do this cuz of display issues in youth profile
                    // for (let j = 0; j < this.collectionsToEdit.length; j++) {
                    //     let query = await db.collection(this.collectionsToEdit[j]).get();
                    //     query.forEach(async doc => {
                    //         let id = doc.id;
                    //         let data = doc.data();
                    //         delete data[this.modal.delete.field_name]
                    //         await db.collection(this.collectionsToEdit[j]).doc(id).set(data);
                    //     })
                    // }
                    // for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                    //     let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                    //     query.forEach(async doc => {
                    //         let id = doc.id;
                    //         let path = doc.ref.path
                    //         let data = doc.data();
                    //         delete data[this.modal.delete.field_name]
                    //         await db.doc(path).set(data);
                    //     })
                    // }

                    // Delete locally 
                    this.field_data.splice(i, 1);
                    
                    for (let j = 0; j < this.field_data_initial_copy.length; j ++) {
                        if (Object.keys(this.field_data_initial_copy[j].data)[0]) {
                            this.field_data_initial_copy.splice(j, 1);
                            break;
                        }
                    }

                    this.modal.delete.field_name = "";

                    this.closeLoadingModal();
                    this.showMsgModal("Success!", "Successfully deleted class in GlobalPeriods");

                    break;
                }
            }
        },
        async addField() {
            this.modal.add.visible = false;
            this.showLoadingModal();

            // Update GlobalFieldsCollection
            let updatedFields = this.field_data.map(element => {return element.data})
            let fieldObject = {}
            fieldObject[this.modal.add.field_name] = this.modal.add.field_type;
            updatedFields.push(fieldObject);
            let updateObject = {};
            updateObject["Classes"] = updatedFields;
            let updateStatus = await db.collection("GlobalPeriods").doc('metadata').update(updateObject);
            if (updateStatus) {
                window.alert("Error on updating Classes on firebase. " + updateStatus);
                return null;
            }

            //Updating Locally 
            let localUpdateObject = {
                data: {},
                isProtected: false
            }
            localUpdateObject.data[this.modal.add.field_name] = this.modal.add.field_type;
            this.field_data.push(localUpdateObject);
            // this.field_data_initial_copy.push(localUpdateObject);

            // Reset
            this.modal.add.field_name = "";
            this.modal.add.field_type = "String",
            this.modal.add.initial_value = "";

            this.closeLoadingModal();
            this.showMsgModal("Success!", "Added a new class!");
        }

    }
}
</script>

<style>

</style>