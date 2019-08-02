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
        <h3>Click on these current fields to edit:</h3>

        <draggable v-model="requiredFields" @start="drag=true" @end="drag=false">
            <div v-for="element in requiredFields" :key="element.id">{{element.name}}</div>
        </draggable>

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
export default {
    name: 'YouthOrderSettings',
    components: {
        SettingsBottomNote,
        draggable
    },
    data() {
        return {
            requiredFields: [],
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
                for (let i = 0; i < fields["required"].length; i++) { 
                    this.requiredFields.push({
                        "name": fields["required"][i]
                    });
                }
                this.optionalFields = fields["optional"];
                this.hiddenFields = fields["hidden"];
            }
        },
        closeModal() {
            this.modalVisible = false;
        }
        
    },
    async mounted() {
        await this.getFields();
        // await this.getPlaceholders();
    }
    
}
</script>

<style>
</style>