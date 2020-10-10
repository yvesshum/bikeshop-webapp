<template>
    <div v-if="dataLoaded">
        <div class="content">
        <top-bar/>
        <br>

        <h1 v-b-tooltip.hover title="These settings here correspond to the youth profile view and registering a new youth">Youth Profile Staff View Settings</h1>    
        <hr class="title">

        <h2 v-b-tooltip.hover title="Drag fields around to reorder them">Field editor</h2>  
        <hr class="subheading">  

        <b-button variant="info" onclick="location.href='special-input-demo'">Click here for a field type demo</b-button>
        <hr class="divider">

        <h3 v-b-tooltip.hover title="These are fields that users must enter">Required Fields:</h3>
        <fieldEditor v-if="dataLoaded" sourceFieldName="required" :elements="fields.required" sourceDocument="Youth Profile" :collectionsToEdit="['GlobalYouthProfile']" :subcollectionsToEdit="[]"/>
        <hr class="divider">

        <h3 v-b-tooltip.hover title="These are fields that users may enter" right>Optional Fields:</h3>
        <fieldEditor v-if="dataLoaded" sourceFieldName="optional" :elements="fields.optional" sourceDocument="Youth Profile" :collectionsToEdit="['GlobalYouthProfile']" :subcollectionsToEdit="[]"/>
        <hr class="divider">

        <h3 v-b-tooltip.hover title="These are fields that users do not enter but are included for functionality and/or display" right>Hidden Fields:</h3>
        <fieldEditor v-if="dataLoaded" sourceFieldName="hidden" :elements="fields.hidden" sourceDocument="Youth Profile" :collectionsToEdit="['GlobalYouthProfile']" :subcollectionsToEdit="[]"/>
        <hr class="divider">
        
        <h2 v-b-tooltip.hover title="This value will be shown as a hint when users fill out the Youth Registration Form">Form Hint editor</h2>  
        <hr class="subheading">  
        <PlaceholderEditor v-if="dataLoaded" placeholderRef="Youth Profile Placeholders" doc="Youth Profile"/>
        <hr class="divider">

        <h2 v-b-tooltip.hover title="Change the initial value for hidden fields. This value will be stored when a new youth has been registered">Initializer editor</h2>  
        <hr class="subheading"> 
        <InitializerEditor v-if="dataLoaded" initializerRef="Youth Profile Initializers" doc="Youth Profile"/>

        <SettingsBottomNote/>
        </div>
        <Footer/>
    </div>
    
</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import fieldEditor from '../../components/FieldEditor.vue'
import PlaceholderEditor from '../../components/PlaceholderEditor.vue'
import InitializerEditor from '../../components/InitializerEditor.vue'

export default {
    name: 'YouthProfileStaffSettings',
    components: {
        SettingsBottomNote,
        fieldEditor,
        PlaceholderEditor,
        InitializerEditor
    },
    data() {
        return {
            dataLoaded: false,
            fields: {
                required: [],
                hidden: [],
                optional: []
            }
        }
    },
    methods: {
        parse(item) {
                return JSON.parse(JSON.stringify(item));
        },

        parseFields(items, dest, protectedFields) {
            for (let i = 0; i < items.length; i ++) { 
                let isProtected = protectedFields.includes(Object.keys(items[i])[0])
                dest.push({
                    "data": items[i],
                    "isProtected": isProtected
                })
            }   
        },
        
        async getFields() {
            let fields = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();
            fields = fields.data();            
            if (fields == null) { 
                window.alert("Unable to get Youth Profile fields from Global Fields Collection");
            }
            else {
                let protectedFields = ["DOB", "Youth ID", "First Name", "Last Name", "Hours Spent", "Hours Earned", "Pending Hours", "Work Log", "Transfer Log", "ActivePeriods", "Order Log", "Class", "Primary Parent or Guardian Name", "Primary Parent or Guardian Phone", "Secondary Parent or Guardian Name", "Secondary Parent or Guardian Phone", "Apron Color", "Secondary Parent or Guardian Email", "Primary Parent or Guardian Email"]
                this.parseFields(fields["required"], this.fields.required, protectedFields);
                this.parseFields(fields["optional"], this.fields.optional, protectedFields);
                this.parseFields(fields["hidden"], this.fields.hidden, protectedFields);
            }
            // console.log('f', this.fields);
        },
    },
    async mounted() {
        await this.getFields();
        this.dataLoaded = true;
    }

    
}
</script>