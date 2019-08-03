// Usage: 
// <fieldEditor :ftype="variable name of field array e.g. hidden" :elements="an array of objects with 'name' and 'isProtected' keys e.g. [{name: 'Youth ID', isProtected: true}]"/>
// TODO: create delete button
// TODO: create new field button

<template> 
    <div>
        <!-- Content -->
        <b-button-group style="margin-bottom:10px">
            <b-button variant="warning" @click="resetOrdering">Reset Ordering</b-button>
            <b-button variant="success" @click="saveOrdering">Save Ordering</b-button>
        </b-button-group>

        <draggable v-model="fields" @start="drag=true" @end="drag=false">
            <FieldCard 
                v-for="element in fields" 
                :key="element.name" 
                :field="element.name" 
                :isProtected="element.isProtected"
                v-on:editClicked="editButtonClicked"
                v-on:deleteClicked="deleteButtonClicked"
                />
        </draggable>
        <br>
        <b-button-group>
            <b-button variant="info" @click="addButtonClicked">
                Add a field <font-awesome-icon icon="plus" class ="icon alt"/>
            </b-button>
        </b-button-group>

        <!-- Modals -->
        <b-modal v-model = "msg_modalVisible" hide-footer lazy>
            <template slot="modal-title">
                {{msg_modal_title}}
            </template>
            <div class="d-block text-center">
                <h3>{{msg_modal_text}}</h3>
            </div>
            <b-button class="mt-3" block @click="msg_closeModal" variant = "primary">ok!</b-button>

        </b-modal>

        <b-modal v-model = "loading_modalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                {{loading_modalHeader}}
            </template>
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong> Loading...</strong>
                </div>
            </div>
        </b-modal>

        <b-modal v-model = "edit_modalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Editing Field Name
            </template>
            <b-form-textarea
                    id="textarea"
                    v-model="editMsg"
                    placeholder="Enter a new name here.."
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" variant = "warning">Save and change all existing uses of the field</b-button>
            <b-button class="mt-3" block @click="edit_closeModal()" variant="success">Cancel</b-button>
        </b-modal>

        <b-modal v-model = "delete_modalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Deleting Field
            </template>
            <div class="d-block text-center">
                <h3>Are you sure you want to delete {{deletingField}}</h3>
            </div>
            <b-button class="mt-3" block @click="deleteField(); delete_closeModal()" variant = "danger">Permanently delete this field and remove all existing uses of this field</b-button>
            <b-button class="mt-3" block @click="delete_closeModal()" variant="success">Cancel</b-button>
        </b-modal>

        <b-modal v-model = "add_modalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Adding A Field
            </template>
            <p style="margin-bottom: 0">Field Name</p>
            <b-form-textarea
                    id="textarea"
                    v-model="addFieldName"
                    placeholder="This cannot be empty!"
                    :state="addFieldName.length >= 1"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <p style="margin-bottom: 0">Initial value</p>
            <b-form-textarea
                    id="textarea"
                    v-model="addFieldInitializer"
                    placeholder="Enter a value or leave empty"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <b-button class="mt-3" block @click="addField(); add_closeModal()" variant = "warning">Add a new field and change all existing documents to have this field</b-button>
            <b-button class="mt-3" block @click="add_closeModal()" variant="success">Cancel</b-button>
        </b-modal>
    </div>
</template>

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
        ftype: String,
        elements: Array,
    },
    data() {
        return {
            fields: [],
            initialFields: [],
            msg_modal_title: "",
            msg_modal_text: "",
            msg_modalVisible: false,
            loading_modalVisible: false,
            loading_modalHeader: "",
            editMsg: "",
            edit_modalVisible: false,
            oldFieldName: "",
            deletingField: "",
            delete_modalVisible: false,
            add_modalVisible: false,
            addFieldName: "",
            addFieldInitializer: ""
        }
    },
    mounted() { 
        this.fields = this.elements;
        this.initialFields = this.parse(this.fields);
    },
    methods: { 
        parse(item) { 
            return JSON.parse(JSON.stringify(item));
        },

        resetOrdering() { 
            this.fields = this.initialFields;
        },

        async saveOrdering() {
            this.showLoadingModal("One second...")
            let res = [];
            this.fields.forEach(element => {
                res.push(element["name"])
            });

            let updateVal = {};
            updateVal[this.ftype] = res;
        
            let updateStatus = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").update(updateVal)

            if(updateStatus) {
                window.alert("Error on updating Youth Order Form in GlobalFieldsCollection");
                return null;
            }

            else {
                this.closeLoadingModal();
                this.msg_showModal("Success!", "The ordering has been saved.")
            }
        },

        editButtonClicked(field) {
            this.oldFieldName = field;
            this.editMsg = field;
            this.edit_modalVisible = true;
        },

        names(obj) {
            let res = [];
            obj.forEach(f => { 
                res.push(f["name"])
            })
            return res;
        },

        alreadyExists(fieldName) { 
            return this.names(this.initialFields).map(i => { 
                return i.toLowerCase();
            }).includes(fieldName.toLowerCase());
        },

        async save_edit() {
            // check if the field already exists
            this.edit_closeModal();
            this.showLoadingModal("Saving")
            let newFieldName = this.editMsg;
            if (this.alreadyExists(newFieldName)) {
                this.closeLoadingModal();
                this.msg_showModal("Error", "Field already exists!")
            }
            else { 
                let fieldNames = this.names(this.initialFields);
                for (let i = 0; i < fieldNames.length ; i++) {
                    if (fieldNames[i] === this.oldFieldName) {
                        let arr = fieldNames;
                        arr[i] = newFieldName;
                        let updateValue = {};
                        updateValue[this.ftype] = arr;

                        let updateStatus = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").update(updateValue);
                        if (updateStatus) { 
                            window.alert("Error on updating Youth Order Form in Global Fields Collection. Field: " + ftype);
                            return null;
                        }

                        // update the records -> Global Pending Orders & Global Youth Profile
                        let query = await db.collection("GlobalPendingOrders").get();
                        let initialField = this.oldFieldName;
                        query.forEach(doc => { 
                            let id = doc.id;
                            let data = this.parse(doc.data());
                            data[newFieldName] = data[initialField];
                            delete data[initialField];
                            db.collection("GlobalPendingOrders").doc(id).set(data);
                        })

                        // update locally 
                        this.initialFields[i]["name"] = newFieldName;

                        //A user may have moved the fields, but editing a field name should not also save the ordering
                        //this.fields may be in a different order, so we would have to find the field
                        for (let j = 0; j < this.fields.length; j ++) { 
                            if (this.fields[j]["name"] === this.oldFieldName) {
                                this.fields[j]["name"] = newFieldName;
                            }
                        }

                        // once completed, reset (just to be safe)                            
                        this.oldFieldName = "";

                        this.closeLoadingModal()
                        this.msg_showModal("Success", "Successfully updated firebase Global Fields Collection and corresponding documents")

                        break;
                    }
                }
               
                
            }
        },

        async deleteButtonClicked(field) {
            this.deletingField = field;
            this.delete_modalVisible = true;
        },

        async deleteField() {
            this.delete_closeModal();
            this.showLoadingModal("Deleting..");

            let fieldNames = this.names(this.initialFields);
                for (let i = 0; i < fieldNames.length ; i++) {
                    if (fieldNames[i] === this.deletingField) {
                        let arr = fieldNames;
                        arr.splice(i, 1);

                        let updateValue = {};
                        updateValue[this.ftype] = arr;

                        let updateStatus = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").update(updateValue);
                        if (updateStatus) { 
                            window.alert("Error on removing a field in Youth Order Form in Global Fields Collection. Field: " + this.deletingField);
                            return null;
                        }

                        // update the records -> Global Pending Orders & Global Youth Profile
                        let query = await db.collection("GlobalPendingOrders").get();
                        let deletingFieldName = this.deletingField;
                        query.forEach(doc => { 
                            let id = doc.id;
                            let data = this.parse(doc.data());
                            delete data[deletingFieldName];
                            db.collection("GlobalPendingOrders").doc(id).set(data);
                        })

                        // update locally 
                        this.initialFields.splice(i, 1);

                        //A user may have moved the fields, but editing a field name should not also save the ordering
                        //this.fields may be in a different order, so we would have to find the field
                        for (let j = 0; j < this.fields.length; j ++) { 
                            if (this.fields[j]["name"] === this.deletingField) {
                                this.fields.splice(j, 1);
                            }
                        }

                        // once completed, reset (just to be safe)                            
                        this.deletingField = "";

                        this.closeLoadingModal();
                        this.msg_showModal("Success", "Successfully deleted field in firebase Global Fields Collection and corresponding documents")

                        break;
                    }
                }

        },

        async addButtonClicked() {
            this.addFieldName = "";
            this.addFieldInitializer = "";
            this.add_modalVisible = true;
        },

        async addField() {
            this.add_closeModal();
            this.showLoadingModal();

            let fieldNames = this.names(this.initialFields);
            let arr = fieldNames;
            arr.push(this.addFieldName);
            let updateValue = {};
            updateValue[this.ftype] = arr;

            let updateStatus = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").update(updateValue);
            if (updateStatus) { 
                window.alert("Error on removing a field in Youth Order Form in Global Fields Collection. Field: " + this.deletingField);
                return null;
            }

            // update the records -> Global Pending Orders & Global Youth Profile
            let query = await db.collection("GlobalPendingOrders").get();
            let newFieldName = this.addFieldName;
            query.forEach(doc => { 
                let id = doc.id;
                let data = this.parse(doc.data());
                data[newFieldName] = this.addFieldInitializer;
                console.log(data);
                db.collection("GlobalPendingOrders").doc(id).set(data);
            })

            // update locally 
            this.initialFields.push({
                "name": this.addFieldName,
                "isProtected": false
            })

            this.fields.push({
                "name": this.addFieldName,
                "isProtected": false
            })

            // once completed, reset (just to be safe)                            
            this.addFieldName = "";
            this.addFieldInitializer = "";

            this.closeLoadingModal();
            this.msg_showModal("Success", "Successfully added new field in firebase Global Fields Collection and corresponding documents")




        },


        // Modal methods
        msg_closeModal() {
            this.msg_modalVisible = false;
        },

        msg_showModal(header, msg){
            this.msg_modal_title = header;
            this.msg_modal_text = msg;
            this.msg_modalVisible = true;
        },

        showLoadingModal(msg) {
                this.loading_modalVisible = true;
                this.loading_modalHeader = msg;
        },

        closeLoadingModal() {
            this.loading_modalVisible = false;
        },

        edit_closeModal() {
            this.edit_modalVisible = false;
        },

        delete_closeModal() {
            this.delete_modalVisible = false;
        },

        add_closeModal() {
            this.add_modalVisible = false;
        },

    }
}
</script>

<style>

</style>
