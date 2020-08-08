<template>
    <div v-if="ready">
        <b-button-group>
            <div class="field">
                <b-button squared disabled block variant="light">{{fieldText}}</b-button>
            </div>
            <div class="placeholder">
                <b-button 
                    disabled 
                    squared 
                    block 
                    variant="light"  
                >
                    {{placeholderText}}
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
                    :state="existingFieldNames.filter(f => {return Object.keys(f)[0] === this.editFieldName}).length > 0"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <p style="margin-bottom: 0">Placeholder Text</p>
            <b-form-textarea
                    id="textarea"
                    v-model="editPlaceholderText"
                    placeholder="Enter a value or leave empty for no value"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" variant = "warning">Save</b-button>
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

        <b-modal v-model = "delete_modalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Delete Hint
            </template>
            <p style="margin-bottom: 0">Are you sure you want to remove the hint value for {{this.field}}?</p>

            <b-button class="mt-3" block @click="deleteHint()" variant = "danger">Delete</b-button>
            <b-button class="mt-3" block @click="delete_closeModal()" variant="success">Cancel</b-button>
        </b-modal>
    </div>

    
</template>

<script>
import {rb} from '@/firebase.js'

export default {
    name: 'PlaceholderCard',
    props: {
        field: String,
        placeholder: String,
        existingFieldNames: Array ,
        rbRef: String
    },
    data() { 
        return {
            fieldText: "",
            placeholderText: "",
            status: "",
            statusIcon: "",
            statusMsg: "",
            ready: false,
            edit_modalVisible: false,
            editFieldName: "",
            editPlaceholderText: "",
            loading_modalVisible: false,
            loading_modalHeader: "",
            delete_modalVisible: false,
        }
        
    },
    watch: {
        placeholder: function(newVal, oldVal) {
            this.processProps()
        },
        field: function(newVal, oldVal) {
            this.processProps()
        },
        existingFieldNames: function(newVal, oldVal) {
            this.processProps()
        },
    },
    computed: {
        isDisabled: function() {
            return this.status === "success"
        }
    },
    methods: {
        onDeleteClicked() {
            this.delete_modalVisible = true
        },
        delete_closeModal() {
            this.delete_modalVisible = false
        },

        async deleteHint() {
            this.delete_closeModal()
            this.showLoadingModal();
            let status2 = await rb.ref(this.rbRef).child(this.fieldText).remove()
            if (status2){
                window.alert("Error on deleting firebase, realtime database on child: " + this.fieldText);
                return null;
            }
            this.loading_closeModal();
        },

        onEditClicked() {
            this.edit_modalVisible = true;
            this.editFieldName = this.field;
            this.editPlaceholderText = this.placeholderText;
        },

        async save_edit() {
            this.edit_closeModal();
            this.showLoadingModal();
            let val = {}
            val[this.editFieldName] = this.editPlaceholderText;
            let status2 = await rb.ref(this.rbRef).child(this.fieldText).remove()
            if (status2){
                window.alert("Error on deleting firebase, realtime database on child: " + this.fieldText);
                return null;
            }

            let status = await rb.ref(this.rbRef).update(val);
            if (status) { 
                window.alert("Error on updating firebase, realtime database on child: " + this.rbRef);
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
        },

        processProps() {
            //check status by seeing if the field name exists in the GlobalFieldsCollection document
            if (this.existingFieldNames.filter(f => {return Object.keys(f)[0] === this.field}).length) {
                this.status = "success";
                this.statusIcon = "check-circle",
                this.statusMsg = ""
                }
            else { 
                this.status = "danger"
                this.statusIcon = "exclamation-triangle"
                this.statusMsg = "Unable to find a corresponding field name! Please edit or remove this!"
            }
            this.fieldText = this.field;
            this.placeholderText = this.placeholder;
        }


    },
    mounted() {
        this.processProps()
        this.ready = true;

    }

}
</script>

<style>
.field{
    width: 10rem;
}
.placeholder{
    width: 20rem;
} 
.button{
    /* width: 3rem; */
}
</style>
