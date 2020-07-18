<template>
    <div v-if="ready">
        <b-button-group>
            <div class="field">
                <b-button squared disabled block variant="light">{{fieldText}}</b-button>
            </div>
            <div class="initial">
                <b-button 
                    disabled 
                    squared 
                    block 
                    variant="light"  
                >
                    {{initialText}}
                </b-button>
            </div>
            <div class="button">
                <b-button
                    squared 
                    block 
                    :variant="status"
                    v-b-tooltip.hover 
                    :title="statusMsg"
                    :disabled="isDisabled"
                >
                    <font-awesome-icon :icon="statusIcon" class ="icon alt"/>
                </b-button>
            </div>
            <div class="button">
                <b-button
                    squared 
                    block 
                    variant="info"
                    @click="onEditClicked"
                >
                    <font-awesome-icon icon="edit" class ="icon alt"/>
                </b-button>
            </div>
            <div class="button">
                <b-button
                    squared 
                    block 
                    variant="danger"
                    @click="onDeleteClicked"
                >
                    <font-awesome-icon icon="times" class ="icon alt"/>
                </b-button>
            </div>
            <!-- <b-button variant="info" @click="onEditClicked" squared><font-awesome-icon icon="edit" class ="icon alt"/></b-button>
            <b-button variant="danger" @click="onDeleteClicked" squared><font-awesome-icon icon="times" class="icon alt"/></b-button> -->
        </b-button-group>


        <!-- Modals -->
        <b-modal v-model = "edit_modalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Editing Field Name
            </template>
            <p style="margin-bottom: 0">Field Name</p>
            <b-form-textarea
                    id="textarea"
                    v-model="editFieldName"
                    placeholder="This must match one of the current fields"
                    :state="isValidFieldName"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <p style="margin-bottom: 0">Initial Value</p>
            <SpecialInput :inputType="input_field_type" ref="addInput" v-model="editInitialText"/>

            <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" variant = "warning" :disabled="!isValidFieldName">Save</b-button>
            <b-button class="mt-3" block @click="edit_closeModal()" variant="success">Cancel</b-button>
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
    </div>

    
</template>

<script>
import {rb} from '@/firebase.js'
import SpecialInput from '../components/SpecialInput.vue'
import { initSpecialInputVal } from '../scripts/SpecialInit';	

export default {
    name: 'InitializerCard',
    props: {
        field: String,
        initializer: String | Number,
        existingFieldNames: Array ,
        rbRef: String
    },
    data() { 
        return {
            fieldText: "",
            initialText: "",
            status: "",
            statusIcon: "",
            statusMsg: "",
            ready: false,
            edit_modalVisible: false,
            editFieldName: "",
            editInitialText: "",
            loading_modalVisible: false,
            loading_modalHeader: "",
            input_field_type: null,

        }
    },
    computed: {
        isDisabled: function() {
            return this.status === "success"
        },

        isValidFieldName: function() {  
            let doesExist = this.existingFieldNames.some(f => {return Object.keys(f)[0] === this.editFieldName})
            let protectedFields = ["Hours Spent", "Pending Hours", "Work Log", "Order Log", "Hours Earned", "Transfer Log", "ActivePeriods", "Apron Color"]
            let notProtected = !protectedFields.some(f => f === this.editFieldName)
            return doesExist && notProtected
        }
    },
    watch: {
        editFieldName: function() {
            if (this.isValidFieldName) {
                let type = this.existingFieldNames.filter(f => {return Object.keys(f)[0] === this.editFieldName})[0][this.editFieldName]
                let newVal = initSpecialInputVal(type);
                try {
                    this.$refs.addInput.updateInputType(type);
                } catch (err) {
                    console.warn(err)
                }
                this.editInitialText = newVal
                this.input_field_type = type
            }
        }
    },
    methods: {
        async onDeleteClicked() {
            //TODO: Test this
            this.showLoadingModal();
            let status2 = await rb.ref(this.rbRef + '/Unprotected').child(this.fieldText).remove()
            if (status2){
                window.alert("Error on deleting firebase, realtime database on child: " + this.fieldText);
                return null;
            }
            this.loading_closeModal();
        },

        onEditClicked() {
            this.edit_modalVisible = true;
            this.editFieldName = this.field;
            this.editInitialText = this.initialText;
        },

        async save_edit() {
            this.edit_closeModal();
            this.showLoadingModal();
            let val = {}
            val[this.editFieldName] = this.editInitialText;
            let status2 = await rb.ref(this.rbRef + '/Unprotected').child(this.fieldText).remove()
            if (status2){
                window.alert("Error on deleting firebase, realtime database on child: " + this.fieldText);
                return null;
            }

            let status = await rb.ref(this.rbRef + '/Unprotected').update(val);
            if (status) { 
                window.alert("Error on updating firebase, realtime database on child: " + this.rbRef + '/Unprotected');
                return null;
            }
            
            this.loading_closeModal();
        },

        edit_closeModal() {
            this.edit_modalVisible = false;
        },

        loading_closeModal() {
            this.loading_modalVisible = false;
        },

        showLoadingModal(title) { 
            this.loading_modalHeader = title;
            this.loading_modalVisible = true;
        }


    },
    mounted() {
        //check status by seeing if the field name exists in an array of hidden fields
        if (this.existingFieldNames.filter(f => {return Object.keys(f)[0] === this.field}).length) {
            this.status = "success";
            this.statusIcon = "check-circle",
            this.statusMsg = ""
        }
        else { 
            this.status = "danger"
            this.statusIcon = "exclamation-triangle"
            this.statusMsg = "Unable to find a corresponding hidden field! Please check the field name again!"
        }
        this.fieldText = this.field;
        this.initialText = this.initializer;
        this.editFieldName = this.field

        if (this.existingFieldNames.some(f => {return Object.keys(f)[0] === this.editFieldName})) {
            let type = this.existingFieldNames.filter(f => {return Object.keys(f)[0] === this.editFieldName})[0][this.editFieldName]
            let newVal = initSpecialInputVal(type);
            this.editInitialText = newVal
            this.input_field_type = type
        }

        this.ready = true;

    },

    components: {
        SpecialInput
    }

}
</script>

<style>
.field{
    width: 10rem;
}
.initial{
    width: 20rem;
} 

</style>
