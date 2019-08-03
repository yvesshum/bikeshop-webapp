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
        <h3 v-b-tooltip.hover title="Drag fields around to reorder them on a form" right>Current Required Fields:</h3>
        <b-button-group style="margin-bottom:10px">
                <b-button variant="warning" @click="resetOrdering">Reset</b-button>
                <b-button variant="success">Save</b-button>
        </b-button-group>
        <div class="draggableSelector">
            <draggable v-model="requiredFields" @start="drag=true" @end="drag=false">
                <FieldCard v-for="element in requiredFields" :key="element.name" :field="element.name" :isProtected="element.isProtected"/>
            </draggable>
        </div>

        <SettingsBottomNote/>

        <b-modal v-model = "modalVisible" hide-footer lazy>
            <template slot="modal-title">
                {{modal_title}}
            </template>
            <div class="d-block text-center">
                <h3>{{modal_text}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">Thanks!</b-button>

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
            modal_title: "",
            modal_text: "",
            modalVisible: false,
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
                let protectedFields = ["Youth ID", "Item Total Cost"]
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
        closeModal() {
            this.modalVisible = false;
        },

        resetOrdering() {
            this.requiredFields = this.requiredFieldsInitial;
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