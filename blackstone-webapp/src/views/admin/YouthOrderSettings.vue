// Show currently used fields, with feature to edit them
// features: 
// Change a field name (updates all Profiles' order logs with the new name, as well as GlobalPendingOrders)
// Remove a field (removes corresponding field in all profiles and GlobalPendingOrders)
// Add a field name (Updates all profiles and pending orders with the new field and a given initialization value)
// Edit placeholder texts for Youth Orders 

// TODO: Youth Order Log will be in a separate page 

<template>
    <div>
        <top-bar/>
        <br>
        <b-container>
            <b-row>
                <b-col>
                    <h3 v-b-tooltip.hover title="Drag fields around to reorder them" right>Required Fields:</h3>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <b-button-group style="margin-bottom:10px">
                        <b-button variant="warning" @click="resetOrdering('required')">Reset Ordering</b-button>
                        <b-button variant="success" @click="saveOrdering('required')">Save Ordering</b-button>
                    </b-button-group>
                </b-col>
            </b-row>

            <b-row>
                <b-col>
                    <div class="draggableSelector">
                        <draggable v-model="fields.required" @start="drag=true" @end="drag=false">
                            <FieldCard 
                                v-for="element in fields.required" 
                                :key="element.name" 
                                :field="element.name" 
                                :isProtected="element.isProtected"
                                v-on:editClicked="editButtonClicked"
                                />
                        </draggable>
                    </div>
                </b-col>

            </b-row>

        </b-container>
        
        
        

        <hr style="width: 50%">
        <h3 v-b-tooltip.hover title="Drag fields around to reorder them" right>Optional Fields:</h3>
        <b-button-group style="margin-bottom:10px">
                <b-button variant="warning" @click="resetOrdering('optional')">Reset Ordering</b-button>
                <b-button variant="success" @click="saveOrdering('optional')">Save Ordering</b-button>
        </b-button-group>
        <div class="draggableSelector">
            <draggable v-model="fields.optional" @start="drag=true" @end="drag=false">
                <FieldCard 
                    v-for="element in fields.optional" 
                    :key="element.name" 
                    :field="element.name" 
                    :isProtected="element.isProtected"
                    v-on:editClicked="editButtonClicked"
                    />
            </draggable>
        </div>

        <hr style="width: 50%">
        <h3 v-b-tooltip.hover title="Drag fields around to reorder them" right>Hidden Fields:</h3>
        <b-button-group style="margin-bottom:10px">
                <b-button variant="warning" @click="resetOrdering('hidden')">Reset Ordering</b-button>
                <b-button variant="success" @click="saveOrdering('hidden')">Save Ordering</b-button>
        </b-button-group>
        <div class="draggableSelector">
            <draggable v-model="fields.hidden" @start="drag=true" @end="drag=false">
                <FieldCard 
                    v-for="element in fields.hidden" 
                    :key="element.name" 
                    :field="element.name" 
                    :isProtected="element.isProtected"
                    v-on:editClicked="editButtonClicked"
                    />
            </draggable>
        </div>

        <SettingsBottomNote/>


        <!-- MODALS -->
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
                    placeholder="Enter a new message here.."
                    rows="2"
                    max-rows="5"
            ></b-form-textarea>
            <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" variant = "warning">Save and change all existing uses of the field</b-button>
            <b-button class="mt-3" block @click="edit_closeModal()" variant="success">Cancel</b-button>

        </b-modal>
    </div>
    
</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import {rb} from '../../firebase.js'
import draggable from 'vuedraggable'
import FieldCard from '../../components/FieldCard.vue'

export default {
    name: 'YouthOrderSettings',
    components: {
        SettingsBottomNote,
        draggable,
        FieldCard,
    },
    data() {
        return {
            fields: {   
                required: [], 
                optional: [], 
                hidden: []
            },
            initialFields: {},
            msg_modal_title: "",
            msg_modal_text: "",
            msg_modalVisible: false,
            loading_modalVisible: false,
            loading_modalHeader: "",
            edit_modalVisible: false,
            editMsg: "",
            editingFieldInitial :"",

        }
    },
    methods: {
        parse(item) {
                return JSON.parse(JSON.stringify(item));
        },

        parseFields(items, dest, protectedFields) {
            for (let i = 0; i < items.length; i ++) { 
                let isProtected = protectedFields.includes(items[i])
                dest.push({
                    "name": items[i],
                    "isProtected": isProtected
                })
            }   
        },
        
        async getFields() {
            let fields = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").get();
            fields = fields.data();
            if (fields == null) { 
                window.alert("Unable to get Youth Order Form fields from Global Fields Collection");
            }
            else {
                let protectedFields = ["Youth ID", "Item Total Cost", "First Name", "Last Name", "Status", "Order Date"]
                this.parseFields(fields["required"], this.fields.required, protectedFields);
                this.parseFields(fields["optional"], this.fields.optional, protectedFields);
                this.parseFields(fields["hidden"], this.fields.hidden, protectedFields);
                this.initialFields = this.parse(this.fields);
            }
        },

        msg_closeModal() {
            this.msg_modalVisible = false;
        },

        showModal(header, msg){
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

        resetOrdering(ftype) {
            this.fields[ftype] = this.initialFields[ftype];
        },

        async saveOrdering(ftype) {
            this.showLoadingModal("One second...")
            let res = [];
            this.fields[ftype].forEach(element => {
                res.push(element["name"])
            });

            let updateStatus = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").update({
                ftype: res
            })

            if(updateStatus) {
                window.alert("Error on updating Youth Order Form in GlobalFieldsCollection");
                return null;
            }

            else {
                this.closeLoadingModal();
                this.showModal("Success!", "The ordering has been saved.")
            }
        },

        editButtonClicked(field) {
            this.editingFieldInitial = field;
            this.editMsg = field;
            this.edit_modalVisible = true;
        },

        async save_edit() {
            // check if the field already exists
            this.showLoadingModal("Saving")
            let newFieldName = this.editMsg;
            if (this.alreadyExists(newFieldName)) {
                this.closeLoadingModal();
                this.showModal("Error", "Field already exists!")
            }
            else { 
                // change corresponding this.editingFieldInitial field to the new text, including initial field
                // change on firebase 
                

                // find which field it is
                for (let ftype in this.initialFields) { 
                    let found = false;
                    for (let i = 0; i < this.initialFields[ftype].length; i++) { 
                        if (this.initialFields[ftype][i]["name"] === this.editingFieldInitial) { 
                            found = true;
                            let arr = this.getNames(this.initialFields[ftype]);
                            arr[i] = newFieldName;
                            let updateValue = {};
                            updateValue[ftype] = arr;

                            
                            let updateStatus = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").update(updateValue)
                            if (updateStatus) { 
                                window.alert("Error on updating Youth Order Form in Global Fields Collection. Field: " + ftype);
                                return null;
                            }

                            // update the records -> Global Pending Orders & Global Youth Profile
                            let query = await db.collection("GlobalPendingOrders").get();
                            let initialField = this.editingFieldInitial;
                            query.forEach(doc => { 
                                let id = doc.id;
                                let data = this.parse(doc.data());
                                data[newFieldName] = data[initialField];
                                delete data[initialField];
                                db.collection("GlobalPendingOrders").doc(id).set(data);
                            })

                            // update locally 
                            this.initialFields[ftype][i]["name"] = newFieldName;

                            //A user may have moved the fields, but editing a field name should not also save the ordering
                            //this.fields may be in a different order, so we would have to find the field
                            for (let j = 0; j < this.fields[ftype].length; j ++) { 
                                if (this.fields[ftype][j]["name"] === this.editingFieldInitial) {
                                    this.fields[ftype][j]["name"] = newFieldName;
                                }
                            }

                            // once completed, reset (just to be safe)                            
                            this.editingFieldInitial = "";

                            this.closeLoadingModal()
                            this.showModal("Success", "Successfully updated firebase Global Fields Collection and corresponding documents")
                            break;
                        }
                    }
                    if (found) break;
                }
            }
        
        },

        alreadyExists(newName) { 
            const namesOf = this.getNames;
            let fields  = namesOf(this.fields.required)
                            .concat(namesOf(this.fields.optional))
                            .concat(namesOf(this.fields.hidden))
                            .map(f => {return f.toLowerCase()});
            return fields.includes(newName.toLowerCase());
        },

        getNames(fields) {
            let res = [];
            fields.forEach(f => { 
                res.push(f["name"])
            })
            return res;
        }
        
    },
    async mounted() {
        await this.getFields();
        // await this.getPlaceholders();
    }
    
}
</script>

<style>
.draggableSelector{
    /* margin-top: 5px;
    margin-bottom: 5px;
    margin-left:34.2%; */
    /* vertical-align: middle; */
    /* margin:auto;
    display:flex;
    align-items:center;
    justify-content: center; */
    /* width: 30%; */

     
}

</style>