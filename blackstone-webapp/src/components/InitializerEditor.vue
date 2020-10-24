//  Usage <InitializerEditor v-if="dataLoaded" initializerRef="Youth Profile Initializers" doc="Youth Profile"/>
<template>
    <div >
        <p v-b-tooltip.hover title="Field Name, Initializer Value, Status, Edit, Delete" v-if="data.length !== 0">Hint?</p>
        <div  v-if="dataLoaded">
            <InitializerCard 
                v-for="element in data"
                :key="element.field"
                :field="element.field"
                :initializer="element.initializer"
                :existingFieldNames="existingFieldNames"
                :rbRef="initializerRef"
            />
        </div>
        <p v-if="data.length === 0">No user-defined initializers found</p>
        <br>


        <b-button-group>
            <b-button variant="info" @click="addButtonClicked">
                Add an initializer <font-awesome-icon icon="plus" class ="icon alt"/>
            </b-button>
        <br>
        </b-button-group>


        <!-- Modals -->
        <b-modal v-model = "new_modalVisible" hide-footer lazy>
            <template slot = "modal-title">
                New Initializer
            </template>
            <p style="margin-bottom: 0">Field Name</p>
            <b-form-textarea
                    id="textarea"
                    v-model="newFieldName"
                    placeholder="This must match one of the current hidden fields, but not one that already has a initializer or is protected"
                    :state="isValidFieldName"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <p style="margin-bottom: 0">Initializer Value</p>

            <SpecialInput :inputType="input_field_type" ref="addInput" v-model="newInitializerText"/>

            <b-button class="mt-3" block @click="save_new(); new_closeModal()" variant = "warning" :disabled="!(isValidFieldName && isValidInitializer)">Save</b-button>
            <b-button class="mt-3" block @click="new_closeModal()" variant="success">Cancel</b-button>
        </b-modal>

        <b-modal v-model = "msg_modalVisible" hide-footer lazy>
            <template slot="modal-title">
                {{msg_modal_title}}
            </template>
            <div class="d-block text-center">
                <h3>{{msg_modal_text}}</h3>
            </div>
            <b-button class="mt-3" block @click="msg_closeModal" variant = "primary">ok!</b-button>

        </b-modal>
    </div>
</template>

<script>
import {rb} from '@/firebase.js';
import {db} from '@/firebase.js';
import InitializerCard from './InitializerCard.vue';
import SpecialInput from '../components/SpecialInput.vue'
import { initSpecialInputVal } from '../scripts/SpecialInit';	


export default {
    name: 'InitializerEditor',
    props: {
        initializerRef: String,
        doc: String
    },
    components: {
        InitializerCard,
        SpecialInput
    },
    computed: {
        isValidFieldName: function() {
            // console.warn('isValidFieldName called', this.existingFieldNames, this.newFieldName)
            return this.existingFieldNames.filter(f => {return Object.keys(f)[0] === this.newFieldName}).length > 0 && !this.data.some(f => {return Object.values(f).indexOf(this.newFieldName) > -1})
        },

        isValidInitializer: function() {
            return this.newInitializerText != null
        }
    },
    watch: {
        newFieldName: function() {
            if (this.isValidFieldName) {
                let type = this.existingFieldNames.filter(f => {return Object.keys(f)[0] === this.newFieldName})[0][this.newFieldName]
                let newVal = initSpecialInputVal(type);
                this.input_field_type = type
                this.$refs.addInput.updateInputType(type);	
                this.newInitializerText = newVal
            }
        }
    },

    data() {
        return {
            data: [],
            existingFieldNames: [],
            dataLoaded: false,
            newFieldName: "",
            new_modalVisible: false,
            msg_modalVisible: false,
            msg_modal_title: "",
            msg_modal_text: "",
            detachSnapshot: "",
            listenerRef: "",

            input_field_type: "string",
            newInitializerText: "",
        }
    },
    methods: {
        formatData(snapshot) {
            if (snapshot == null) return [];
            let ret = [];
            let keys = Object.keys(snapshot);
            for (let i = 0; i < keys.length; i ++) {
                let res = {
                    "field": keys[i],
                    "initializer": snapshot[keys[i]]
                }
                ret.push(res)
            }
            return ret;
        },

        formatNames(obj) {
            let ret = [];
            let keys = Object.keys(obj)
            for (let i = 0; i < keys.length; i++) {
                //only take hidden fields
                if (keys[i] !== "hidden") continue;
                for (let j = 0; j < obj[keys[i]].length; j++) {
                    ret.push(obj[keys[i]][j])
                }
            }
            return ret;
        },

        forceUpdate() {
            this.$forceUpdate();
        },

        addButtonClicked() {
            this.newFieldName = "";
            this.newInitializerText = ""
            this.new_modalVisible = true;
            
        },

        save_new() {
            this.new_closeModal();
            let val = {}
            val[this.newFieldName] = this.newInitializerText;
            rb.ref(this.initializerRef + '/Unprotected').update(val).then(err => {
                if (err) window.alert("Error on saving new initializer in realtime database, ref: " + this.doc)
                else this.msg_showModal("Success!", "Added a new initializer")
            })

        },

        new_closeModal() {
            this.new_modalVisible = false;
        },

        msg_closeModal() {
            this.msg_modalVisible = false;
        },
        msg_showModal(title, msg) { 
            this.msg_modal_title = title;
            this.msg_modal_text = msg;
            this.msg_modalVisible = true;
        }

    },
    async mounted() {
        this.detachSnapshot = db.collection("GlobalFieldsCollection").doc(this.doc).onSnapshot(doc => {
            this.existingFieldNames = this.formatNames(doc.data());
            // console.warn(this.existingFieldNames)

            this.dataLoaded = true;
        });

        this.listenerRef = rb.ref(this.initializerRef+'/Unprotected').on('value', snapshot => {
            this.data = this.formatData(snapshot.val());
            this.forceUpdate();
        });
    },

    beforeDestroy() {
        this.detachSnapshot();
        rb.ref(this.initializerRef).off("value", this.listenerRef);
    }

}
</script>

<style>
</style>
