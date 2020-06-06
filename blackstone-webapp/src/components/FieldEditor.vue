// TODO: Field names must not have symbols
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
            Add a field <font-awesome-icon icon="plus" class ="icon alt"/>
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
    <!-- TODO: Add a note to say that if they want to change field type, they will need to delete the field along with all instances of its usage and create another one with an initial value-->
    <!-- TODO: Add text that says what the original name was on top -->
    <b-modal v-model = "modal.edit.visible" hide-footer lazy>
        <template slot = "modal-title">
            Editing Field Name
        </template>
        <p>Note: If you wish to edit the field type, delete the field and create new one</p>
        <br>
        <p>Original Field Name: {{this.modal.edit.original_field_name}}</p>
        <p>New Field Name:</p>
        <b-form-textarea
                id="textarea"
                v-model="modal.edit.field_name"
                placeholder="Edit here.."
                rows="1"
                max-rows="1"
                :state="isValidEditFieldName"
        ></b-form-textarea>
        <br>
        <br>
        <strong style="color: black">Note: Field name must not already exist under required, optional, or hidden.</strong>
        <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" :disabled="!isValidEditFieldName" variant = "warning">Save and change all existing uses of the field</b-button>
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
        <b-button class="mt-3" block @click="deleteField(); delete_closeModal()" variant = "danger">Permanently delete this field and remove all existing uses of this field</b-button>
        <b-button class="mt-3" block @click="delete_closeModal()" variant="success">Cancel</b-button>
    </b-modal>

    <!-- Adding -->
    <b-modal v-model = "modal.add.visible" hide-footer lazy>
        <template slot = "modal-title">
            Adding A Field
        </template>
        <p style="margin-bottom: 0">Field Name</p>
        <b-form-textarea
            id="textarea"
            v-model="modal.add.field_name"
            placeholder="This cannot be empty and must not already exist, no symbols too!"
            :state="isValidNewFieldName"
            size="sm"
            rows="1"
                max-rows="3"
        ></b-form-textarea>
        <p style="margin-bottom: 0">Field Type</p>
        <b-form-select
            id="textarea"
            v-model="modal.add.field_type"
            :options="modal.edit.options"
            placeholder="Edit here.."
            rows="1"
            max-rows="3"
            @change="handle_field_type_change"
        ></b-form-select>
        <p style="margin-bottom: 0">Initial Value</p>
        <SpecialInput :inputType="modal.add.field_type" ref="addInput" v-model="modal.add.initial_value"/>
        <p>Check that this field does not exist under required, optional, or hidden, or else bad things might happen</p>
        <b-button class="mt-3" block @click="addField(); add_closeModal()" variant = "warning" :disabled="!isValidNewFieldName && modal.add.initial_value == null">Add a new field and change all existing documents to have this field and value</b-button>
        <b-button class="mt-3" block @click="add_closeModal()" variant="success">Cancel</b-button>

    </b-modal>


</div>
</template>

<script>
import draggable from 'vuedraggable'
import FieldCard from '../components/FieldCard.vue'
import {db} from '@/firebase.js'
import SpecialInput from '../components/SpecialInput.vue'
import { Timestamp } from '../firebase'
import { initSpecialInputVal } from '../scripts/SpecialInit';	

export default {
    name: 'fieldEditor',
    components: {
        FieldCard,
        draggable,
        SpecialInput
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
            let check1 = !this.field_data.some(f => {return Object.keys(f.data).indexOf(this.modal.add.field_name) > -1}) && this.modal.add.field_name.length > 0
            let check2 = !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(this.modal.add.field_name) // No symbols!
            return check1 && check2
        },

        isValidEditFieldName: function() {
            let check1 = !this.field_data.some(f => {return Object.keys(f.data).indexOf(this.modal.edit.field_name) > -1}) && this.modal.edit.field_name.length > 0
            let check2 = !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(this.modal.edit.field_name) // No symbols!
            return check1 && check2
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
                    initial_value: null
                }
            }
        }
    },
    mounted() {
        this.field_data = this.elements;
        this.field_data_initial_copy = JSON.parse(JSON.stringify(this.field_data));

        // Grab input types
        db.collection("GlobalVariables").doc("SpecialInput").get().then(query => {
            this.modal.edit.options = query.data().types
        })
    },
    methods: {
        handle_field_type_change(type) {	
            console.log('handle field type change called', type);	
            this.modal.add.initial_value = initSpecialInputVal(type);	
            console.log('set modal initial value to:', this.modal.add.initial_value, typeof(this.modal.add.initial_value));		
            this.$refs.addInput.updateInputType(type);	
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
            this.modal.add.field_type = "String";
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

            let updateVal = {};
            updateVal[this.sourceFieldName] = fields;

            let updateStatus = await db.collection("GlobalFieldsCollection")
                                .doc(this.sourceDocument).update(updateVal);
            
            if (updateStatus) {
                window.alert("Error on updating Global Fields Collection doc: " + this.sourceDocument);
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
          if (type!=="Datetime") return value;
          else return Timestamp.fromDate(new Date(value))
        },
        async save_edit() {
            this.edit_closeModal();
            this.showLoadingModal("Saving..");
            let newFieldName = this.modal.edit.field_name;
            let fieldType = this.modal.edit.field_type;
            for (let i = 0; i < this.field_data.length; i++) {
                if (Object.keys(this.field_data[i].data)[0] === this.modal.edit.original_field_name) {
                    //Update GlobalFieldsCollection
                    //reshape
                    let updatedFieldNames = this.field_data.map(element => {
                        return element.data
                    })
                    delete updatedFieldNames[i][this.modal.edit.original_field_name];
                    updatedFieldNames[i][newFieldName] = fieldType;
                    let updateObject = {};
                    updateObject[this.sourceFieldName] = updatedFieldNames;

                    let updateStatus = await db.collection("GlobalFieldsCollection").doc(this.sourceDocument).update(updateObject);
                    if (updateStatus) {
                        window.alert("Error on updating GlobalFieldsCollection on firebase. " + err);
                        return null;
                    }

                    // Updating all the collections that needs an update
                    for (let j = 0; j < this.collectionsToEdit.length; j++) {
                        let query = await db.collection(this.collectionsToEdit[j]).get();
                        query.forEach(async doc => {
                            let id = doc.id;
                            let data = doc.data();
                            data[newFieldName] = data[this.modal.edit.original_field_name]
                            delete data[this.modal.edit.original_field_name];
                            console.warn(this.collectionsToEdit[j], id, data)
                            await db.collection(this.collectionsToEdit[j]).doc(id).set(data);
                        })
                    }
                    for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                        let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                        query.forEach(async doc => {
                            let id = doc.id;
                            let path = doc.ref.path
                            let data = doc.data();
                            data[newFieldName] = data[this.modal.edit.original_field_name]
                            delete data[this.modal.edit.original_field_name];
                            console.warn(path, data)

                            await db.doc(path).set(data);
                        })
                    }

                    //Local Update
                    let newVal = {};
                    newVal[newFieldName] = fieldType;
                    this.field_data[i].data = newVal;

                    //Updating the copied version. Since ordering may have changed, we'll need to search through this.
                    for (let j = 0; j < this.field_data_initial_copy.length; j++) {
                        if (Object.keys(this.field_data_initial_copy[j].data)[0] === this.modal.edit.original_field_name) {
                            delete this.field_data_initial_copy[j][this.modal.edit.original_field_name]
                            this.field_data_initial_copy[j][newFieldName] = fieldType;
                        }
                    }

                    this.closeLoadingModal();
                    this.showMsgModal("Success!", "Successfully updated firebase Global Fields Collection and corresponding documents")
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
                    updateValue[this.sourceFieldName] = updatedFields;

                    let deleteStatus = await db.collection("GlobalFieldsCollection").doc(this.sourceDocument).update(updateValue);
                    if (deleteStatus) {
                        window.alert("Error on removing a field in GlobalFieldsCollection. Field: " + this.modal.delete.field_name + ", doc: " + this.sourceDocument);
                        return null;
                    }

                    // Delete from collections
                    for (let j = 0; j < this.collectionsToEdit.length; j++) {
                        let query = await db.collection(this.collectionsToEdit[j]).get();
                        query.forEach(async doc => {
                            let id = doc.id;
                            let data = doc.data();
                            delete data[this.modal.delete.field_name]
                            await db.collection(this.collectionsToEdit[j]).doc(id).set(data);
                        })
                    }
                    for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                        let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                        query.forEach(async doc => {
                            let id = doc.id;
                            let path = doc.ref.path
                            let data = doc.data();
                            delete data[this.modal.delete.field_name]
                            await db.doc(path).set(data);
                        })
                    }

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
                    this.showMsgModal("Success!", "Successfully deleted field in GlobalFieldsCollection and corresponding documents");

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
            updateObject[this.sourceFieldName] = updatedFields;
            let updateStatus = await db.collection("GlobalFieldsCollection").doc(this.sourceDocument).update(updateObject);
            if (updateStatus) {
                window.alert("Error on updating GlobalFieldsCollection on firebase. " + updateStatus);
                return null;
            }

            //Update Collections
            for (let j = 0; j < this.collectionsToEdit.length; j++) {
                let query = await db.collection(this.collectionsToEdit[j]).get();
                for (let q of query.docs) {
                    let id = q.id;
                    let data = q.data();

                    data[this.modal.add.field_name] = this.modal.add.initial_value;

                    await db.collection(this.collectionsToEdit[j]).doc(id).update(data);

                }
            }


            for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                for (let q of query.docs) {
                    // console.log('query', q)
                    let id = q.id;
                    let path = q.ref.path
                    let data = q.data();
                    data[this.modal.add.field_name] = this.modal.add.initial_value;

                    await db.doc(path).update(data);
                }
            }


            //Updating Locally 
            let localUpdateObject = {
                data: {},
                isProtected: false
            }
            localUpdateObject.data[this.modal.add.field_name] = this.modal.add.field_type;
            this.field_data.push(localUpdateObject);
            this.field_data_initial_copy.push(localUpdateObject);

            // Reset
            this.modal.add.field_name = "";
            this.modal.add.field_type = "String"
            // this.$refs.addInput.updateInputType("String"); // no need to do this turns out 

            this.modal.add.initial_value = "";

            this.closeLoadingModal();
            this.showMsgModal("Success!", "Added a new field in GlobalFieldsCollection and corresponding documents.");
        }

    }
}
</script>

<style>

</style>