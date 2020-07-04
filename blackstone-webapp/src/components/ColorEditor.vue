<template>
<div>
    <b-button-group style="margin-bottom:10px">
        <b-button variant="warning" @click="resetOrdering">Reset Ordering</b-button>
        <b-button variant="success" @click="saveOrdering">Save Ordering</b-button>
    </b-button-group>

    <draggable v-model="field_data" @start="drag=true" @end="drag=false">
        <ColorEditorCard
            v-for="item in field_data"
            :key="item.name"
            :field="item.name"
            :color="item.color"
            :isProtected="item.isProtected"
            v-on:editClicked="editButtonClicked"
            v-on:deleteClicked="deleteButtonClicked"
        />
    </draggable>
    <p v-if="field_data.length === 0">No Fields Found </p>
    <br>
    <b-button-group>
        <b-button variant="info" @click="addButtonClicked">
            Add an Apron Color <font-awesome-icon icon="plus" class ="icon alt"/>
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
            Editing Field Name
        </template>
        <p>Note: If you wish to edit the Apron Color, delete this entry and create new one</p>
        <br>
        <p>Original Apron Color Name: {{this.modal.edit.original_field_name}}</p>
        <p>New Apron Color name:</p>
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
        <strong style="color: black">Note: Apron color must be unique!</strong>
        <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" :disabled="!isValidEditFieldName" variant = "warning">Save and rename all existing uses of the apron color</b-button>
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
        <b-button class="mt-3" block @click="deleteField(); delete_closeModal()" variant = "danger">Permanently delete this apron color (Affected youth will need to be reassigned aprons)</b-button>
        <b-button class="mt-3" block @click="delete_closeModal()" variant="success">Cancel</b-button>
    </b-modal>

    <!-- Adding -->
    <b-modal v-model = "modal.add.visible" hide-footer lazy>
        <template slot = "modal-title">
            Adding an Apron Color
        </template>
        <p style="margin-bottom: 0">Color Name</p>
        <b-form-textarea
            id="textarea"
            v-model="modal.add.field_name"
            placeholder="This cannot be empty and must not already exist, no symbols too!"
            :state="isValidNewFieldName"
            size="sm"
            rows="1"
            max-rows="3"
        ></b-form-textarea>
        <br>
        <SpecialInput inputType="Color" ref="addInput" v-model="modal.add.initial_value"/>
        <br>
        <p>Check that this color name does not already exist</p>
        <b-button class="mt-3" block @click="addField(); add_closeModal()" variant = "warning" :disabled="!isValidNewFieldName">Add new apron color</b-button>
        <b-button class="mt-3" block @click="add_closeModal()" variant="success">Cancel</b-button>
    </b-modal>


</div>
</template>

<script>
import draggable from 'vuedraggable'
import ColorEditorCard from '../components/ColorEditorCard.vue'
import {db} from '@/firebase.js'
import SpecialInput from '../components/SpecialInput.vue'
import { Timestamp } from '../firebase'
import { initSpecialInputVal } from '../scripts/SpecialInit';	

export default {
    name: 'ColorEditor',
    components: {
        ColorEditorCard,
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
            let check1 = !this.field_data.some(f => {return f.name == this.modal.add.field_name}) && this.modal.add.field_name.length > 0
            let check2 = !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(this.modal.add.field_name) // No symbols!
            return check1 && check2
        },

        isValidEditFieldName: function() {
            let check1 = !this.field_data.some(f => {return f.name == this.modal.edit.field_name}) && this.modal.edit.field_name.length > 0
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
                    initial_value: ""
                }
            }
        }
    },
    mounted() {
        this.field_data = this.elements;
        this.field_data_initial_copy = JSON.parse(JSON.stringify(this.field_data));
        // Grab input types
        db.collection("GlobalVariables").doc("SpecialInput").get().then(query => {
            this.modal.edit.options = query.data().types;
        })
        this.modal.add.initial_value = initSpecialInputVal("Color");

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
            this.modal.add.visible = true;
        },

        resetOrdering() {
            this.field_data = this.field_data_initial_copy;
        },

        async saveOrdering() {
            this.showLoadingModal("One second...");
            let fields = [];
            this.field_data.forEach(field => {
                fields.push({name: field.name, color: field.color}); // get rid of isProtected
            });

            let updateVal = {};
            updateVal[this.sourceFieldName] = fields;
            console.warn('uv', updateVal)

            let updateStatus = await db.collection("GlobalVariables")
                                .doc(this.sourceDocument).update(updateVal);
            
            if (updateStatus) {
                window.alert("Error on updating GlobalVariables, doc: " + this.sourceDocument);
                return null;
            }
            this.field_data_initial_copy = JSON.parse(JSON.stringify(this.field_data));
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
                if (this.field_data[i].name === this.modal.edit.original_field_name) {
                    //Update GlobalFieldsCollection
                    //reshape
                    let updatedFields = this.field_data.map(element => {
                        let ret = element; 
                        delete element.isProtected;
                        return ret
                    })

                    updatedFields[i].name = this.modal.edit.field_name
                    let updateObject = {};
                    updateObject[this.sourceFieldName] = updatedFields;

                    let updateStatus = await db.collection("GlobalVariables").doc(this.sourceDocument).update(updateObject);
                    if (updateStatus) {
                        window.alert("Error on updating GlobalVariables on firebase. " + err);
                        return null;
                    }

                    // Update Apron Skills, Youth Profile 
                     // For each category we modify the existing entry with the new name

                    let apronSkillsQuery = await db.collection("GlobalVariables").doc("Apron Skills").get(); 
                    let apronSkills = apronSkillsQuery.data()
                    for (let category in apronSkills) {
                        apronSkills[category][this.modal.edit.field_name] = JSON.parse(JSON.stringify(apronSkills[category][this.modal.edit.original_field_name]))
                        delete apronSkills[category][this.modal.edit.original_field_name]
                    }
                    await db.collection("GlobalVariables").doc("Apron Skills").update(apronSkills);

                    let youthProfilesSnapshot = await db.collection("GlobalYouthProfile").where("Apron Color", "==", this.modal.edit.original_field_name).get()
                    await Promise.all(
                        youthProfilesSnapshot.docs.map(async doc => {
                            let youthProfile = doc.data()
                            youthProfile['Apron Color'] = this.modal.edit.field_name;
                            await db.collection("GlobalYouthProfile").doc(doc.id).update(youthProfile)
                        })
                    )

                    //Local Update
                    let localUpdateObject = {
                        name: this.modal.edit.field_name,
                        color: this.field_data[i].color,
                        isProtected: false
                    }
                    this.field_data[i] = localUpdateObject;

                    //Updating the copied version. Since ordering may have changed, we'll need to search through this.
                    for (let j = 0; j < this.field_data_initial_copy.length; j++) {
                        if (this.field_data_initial_copy[j].name === this.modal.edit.original_field_name) {
                            this.field_data_initial_copy[j] = JSON.parse(JSON.stringify(localUpdateObject))
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
            let updatedFields = this.field_data.map(element => {
                let ret = element; 
                delete element.isProtected;
                return ret
            })

            for (let i = 0; i < updatedFields.length; i ++) {
                if (updatedFields[i].name === this.modal.delete.field_name) {
                    // Delete from global fields collection
                    updatedFields.splice(i, 1);
                    let updateValue = {};
                    updateValue[this.sourceFieldName] = updatedFields;

                    let deleteStatus = await db.collection("GlobalVariables").doc(this.sourceDocument).update(updateValue);
                    if (deleteStatus) {
                        window.alert("Error on removing a field in GlobalVariables. Field: " + this.modal.delete.field_name + ", doc: " + this.sourceDocument);
                        return null;
                    }

                    // TODO:
                    // Update Apron Skills, Youth Profile 
                    // For each Skill Category we delete the apron color key and its contents
                    let apronSkillsQuery = await db.collection("GlobalVariables").doc("Apron Skills").get(); 
                    let apronSkills = apronSkillsQuery.data()
                    for (let category in apronSkills) {
                        delete apronSkills[category][this.modal.delete.field_name]
                    }
                    await db.collection("GlobalVariables").doc("Apron Skills").update(apronSkills);

                    let youthProfilesSnapshot = await db.collection("GlobalYouthProfile").where("Apron Color", "==", this.modal.delete.field_name).get()
                    await Promise.all(
                        youthProfilesSnapshot.docs.map(async doc => {
                            let youthProfile = doc.data()
                            youthProfile['Apron Color'] = "";
                            await db.collection("GlobalYouthProfile").doc(doc.id).update(youthProfile)
                        })
                    )

                    // Delete locally 
                    this.field_data.splice(i, 1);
                    
                    for (let j = 0; j < this.field_data_initial_copy.length; j ++) {
                        if (this.field_data_initial_copy[j].name == this.modal.delete.field_name) {
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
            let updatedFields = this.field_data.map(element => {
                let ret = element; 
                delete element.isProtected;
                return ret
            })
            let fieldObject = {}
            fieldObject['name'] = this.modal.add.field_name;
            fieldObject['color'] = this.modal.add.initial_value.hex;
            updatedFields.push(fieldObject);
            let updateObject = {};
            updateObject[this.sourceFieldName] = updatedFields;


            let updateStatus = await db.collection("GlobalVariables").doc(this.sourceDocument).update(updateObject);
            if (updateStatus) {
                window.alert("Error on updating GlobalVariables on firebase. " + updateStatus);
                return null;
            }

            // Update for GlobalVariables -> Apron Skills 
            // For each category we create a new key (new apron color) with empty array
            let apronSkillsQuery = await db.collection("GlobalVariables").doc("Apron Skills").get(); 
            let apronSkills = apronSkillsQuery.data()
            for (let category in apronSkills) {
                apronSkills[category][this.modal.add.field_name] = []
            }
            await db.collection("GlobalVariables").doc("Apron Skills").update(apronSkills);

            //Updating Locally 
            let localUpdateObject = {
                name: this.modal.add.field_name,
                color: this.modal.add.initial_value.hex,
                isProtected: false
            }
            this.field_data.push(localUpdateObject);
            this.field_data_initial_copy.push(localUpdateObject);

            // Reset
            this.modal.add.field_name = "";
            this.modal.add.initial_value = "";

            this.closeLoadingModal();
            this.showMsgModal("Success!", "Added a new apron color!");
        }

    }
}
</script>

<style>

</style>