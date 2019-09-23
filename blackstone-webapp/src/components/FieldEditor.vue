<template><div>
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
    <!-- <b-button-group>
        <b-button variant="info" @click="addButtonClicked">
            Add a field <font-awesome-icon icon="plus" class ="icon alt"/>
        </b-button>
    </b-button-group> -->
    
    

    <!-- Modals -->
    <b-modal v-model = "modal.msg.visible" hide-footer lazy>
        <template slot="modal-title">
            {{modal.msg.title}}
        </template>
        <div class="d-block text-center">
            <h3>{{modal.msg.text}}</h3>
        </div>
        <b-button class="mt-3" block @click="closeMsgModal" variant = "primary">ok!</b-button>
    </b-modal>

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

    <b-modal v-model = "modal.edit.visible" hide-footer lazy>
        <template slot = "modal-title">
            Editing Field
        </template>
        <p>Field Name:</p>
        <b-form-textarea
                id="textarea"
                v-model="modal.edit.field_name"
                placeholder="Edit here.."
                rows="1"
                max-rows="3"
        ></b-form-textarea>
        <br>
        <p>Field Type:</p>
        <b-form-select
                id="textarea"
                v-model="modal.edit.field_type"
                :options="modal.edit.options"
                placeholder="Edit here.."
                rows="1"
                max-rows="3"
        ></b-form-select>
        <br>
        <br>
        <strong style="color: red">Please check if you have a duplicate field name before saving so bad things won't happen.</strong>
        <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" variant = "warning">Save and change all existing uses of the field</b-button>
        <b-button class="mt-3" block @click="edit_closeModal()" variant="success">Cancel</b-button>
    </b-modal>


</div></template>

<script>
import draggable from 'vuedraggable'
import FieldCard from '../components/FieldCard.vue'
import {db} from '@/firebase.js'

export default {
    name: 'fieldEditor',
    components: {
        FieldCard,
        draggable
    },
    props: {
        sourceFieldName: String, //required, optional, hidden
        sourceDocument: String, //name of doc of where the fields are from 
        elements: Array, //Actual data of the fields
        collectionsToEdit: Array, //name of collection of where the fields are from
        subcollectionsToEdit: Array
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
                }
            }
        }
    },
    mounted() {
        this.field_data = this.elements;
        this.field_data_initial_copy = this.parse(this.field_data);

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
            // TODO
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
        async save_edit() {
            this.edit_closeModal();
            this.showLoadingModal("Saving..");
            let newFieldName = this.modal.edit.field_name;
            let newFieldType = this.modal.edit.field_type;
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
                            let data = this.parse(doc.data());
                            data[newFieldName] = data[this.modal.edit.original_field_name]
                            delete data[this.modal.edit.original_field_name];
                            await db.collection(this.collectionsToEdit[j]).doc(id).set(data);
                        })
                    }
                    for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                        let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                        query.forEach(async doc => {
                            let id = doc.id;
                            let path = doc.ref.path
                            let data = this.parse(doc.data());
                            data[newFieldName] = data[this.modal.edit.original_field_name]
                            delete data[this.modal.edit.original_field_name];
                            await db.doc(path).set(data);
                        })
                    }

                    //TODO: Update Locally







                    break;
                }
            }
        }

    }
}
</script>

<style>

</style>