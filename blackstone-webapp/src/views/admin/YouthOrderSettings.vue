// Show currently used fields, with feature to edit them
// features: 
// #Change a field name (updates all Profiles' order logs with the new name, as well as GlobalPendingOrders)
// Remove a field (removes corresponding field in all profiles and GlobalPendingOrders)
// Add a field name (Updates all profiles and pending orders with the new field and a given initialization value)
// Edit placeholder texts for Youth Orders 
<template>
    <div v-if="dataLoaded">
        <top-bar/>
        <br>

        <h1 >Youth Order Form Settings</h1>    
        <hr class="title">

        <h2 v-b-tooltip.hover title="Drag fields around to reorder them">Field editor</h2>  
        <hr class="subheading">  

        <h3 v-b-tooltip.hover title="These are fields that users must enter">Required Fields:</h3>
        <fieldEditor v-if="dataLoaded" ftype="required" :elements="fields.required" doc="Youth Order Form" collection="GlobalPendingOrders"/>
        <hr class="divider">

        <h3 v-b-tooltip.hover title="These are fields that users may enter" right>Optional Fields:</h3>
        <fieldEditor v-if="dataLoaded" ftype="optional" :elements="fields.optional" doc="Youth Order Form" collection="GlobalPendingOrders"/>
        <hr class="divider">

        <h3 v-b-tooltip.hover title="These are fields that users do not enter but are included for functionality and/or display" right>Hidden Fields:</h3>
        <fieldEditor v-if="dataLoaded" ftype="hidden" :elements="fields.hidden" doc="Youth Order Form" collection="GlobalPendingOrders"/>
        <hr class="divider">
        
        <h2 v-b-tooltip.hover title="">Placeholder editor</h2>  
        <hr class="subheading">  
        <PlaceholderEditor v-if="dataLoaded" placeholderRef="Submit Orders Placeholders" doc="Youth Order Form"/>

        <hr class="divider">  
        
        <h2 v-b-tooltip.hover title="Change the initial value for hidden fields. This value will be stored when a new order is placed">Initializer editor</h2>  
        <hr class="subheading"> 
        <InitializerEditor v-if="dataLoaded" initializerRef="Submit Orders Initializers" doc="Youth Order Form"/>

        <SettingsBottomNote/>

    </div>
    
</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import fieldEditor from '../../components/FieldEditor.vue'
import PlaceholderEditor from '../../components/PlaceholderEditor.vue'
import InitializerEditor from '../../components/InitializerEditor.vue'


export default {
    name: 'YouthOrderSettings',
    components: {
        SettingsBottomNote,
        fieldEditor,
        PlaceholderEditor,
        InitializerEditor

    },
    data() {
        return {
            fields: {   
                required: [], 
                optional: [], 
                hidden: []
            },
            dataLoaded: false,
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

       

        
    },
    async mounted() {
        await this.getFields();
        this.dataLoaded = true;
    }
    
}
</script>

<style>
hr.title {
    width: 80%
}

hr.subheading {
    width: 70%
}

hr.divider {
    width: 50%
}

</style>