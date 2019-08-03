// Show currently used fields, with feature to edit them
// features: 
// Change a field name (updates all Profiles' order logs with the new name, as well as GlobalPendingOrders)
// Remove a field (removes corresponding field in all profiles and GlobalPendingOrders)
// Add a field name (Updates all profiles and pending orders with the new field and a given initialization value)
// Edit placeholder texts for Youth Orders 

// TODO: Create a card component for a single field, where there's a delete button on the right side
// TODO: Replace draggable div with the component 

<template>
    <div>
        <top-bar/>
        <br>
        <h3 v-b-tooltip.hover title="Drag fields around to reorder them" right>Current Required Fields:</h3>
        <b-button-group style="margin-bottom:10px">
                <b-button variant="warning" @click="resetOrdering">Reset Ordering</b-button>
                <b-button variant="success" @click="saveOrdering">Save Ordering</b-button>
        </b-button-group>
        <div class="draggableSelector">
            <draggable v-model="requiredFields" @start="drag=true" @end="drag=false">
                <FieldCard 
                    v-for="element in requiredFields" 
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

        <!-- TODO: write methods for these, and add @click events to the edit buttons. Child emits edit event and the name of the field -->
        <!-- Saving should also check for duplicates -->
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

            <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" variant = "success">Save and change all existing uses of the field</b-button>
            <b-button class="mt-3" block @click="edit_closeModal()" variant="warning">Cancel</b-button>

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
            requiredFields: [],
            requiredFieldsInitial: [],
            optionalFields: [],
            hiddenFields: [],
            msg_modal_title: "",
            msg_modal_text: "",
            msg_modalVisible: false,
            loading_modalVisible: false,
            loading_modalHeader: "",
            edit_modalVisible: false,
            editMsg: "",

        }
    },
    methods: {
        parse(item) {
                return JSON.parse(JSON.stringify(item));
        },
        
        async getFields() {
            let fields = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").get();
            fields = fields.data();
            if (fields == null) { 
                window.alert("Unable to get Youth Order Form fields from Global Fields Collection");
            }
            else {
                let protectedFields = ["Youth ID", "Item Total Cost", "First Name", "Last Name"]
                for (let i = 0; i < fields["required"].length; i++) { 
                    let isProtected = false;
                    if (protectedFields.includes(fields["required"][i])) isProtected = true;
                    this.requiredFields.push({
                        "name": fields["required"][i],
                        "isProtected": isProtected
                    });
                }
                this.requiredFieldsInitial = this.requiredFields;
                this.optionalFields = fields["optional"];
                this.hiddenFields = fields["hidden"];
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

        resetOrdering() {
            this.requiredFields = this.requiredFieldsInitial;
        },

        async saveOrdering() {
            this.showLoadingModal("One second...")
            let res = [];
            this.requiredFields.forEach(element => {
                res.push(element["name"])
            });

            let updateStatus = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").update({
                "required": res
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
            this.editMsg = field;
            this.edit_modalVisible = true;
        },

        async save_edit() {
            // check if the field already exists
            let field = this.editMsg;
            
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
    margin:auto;
    display:flex;
    align-items:center;
    justify-content: center;
     
}

</style>