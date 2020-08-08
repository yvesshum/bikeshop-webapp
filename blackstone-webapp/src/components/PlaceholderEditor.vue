//  Usage <PlaceholderEditor v-if="dataLoaded" placeholderRef="Submit Orders Placeholders" doc="Youth Order Form"/>
<template>
    <div >
        <p v-b-tooltip.hover title="Field Name, Placeholder Text, Status, Edit, Delete">Hint</p>
        <div  v-if="dataLoaded">
            <PlaceholderCard 
                v-for="element in data"
                :key="element.field"
                :field="element.field"
                :placeholder="element.placeholder"
                :existingFieldNames="existingFieldNames"
                :rbRef="placeholderRef"
            />
        </div>
        <p v-if="data.length === 0">No user-defined placeholders found</p>
        <br>
        <b-button-group>
            <b-button variant="info" @click="addButtonClicked">
                Add a placeholder <font-awesome-icon icon="plus" class ="icon alt"/>
            </b-button>
        <br>
        </b-button-group>




        <!-- Modals -->
        <b-modal v-model = "new_modalVisible" hide-footer lazy>
            <template slot = "modal-title">
                New Placeholder
            </template>
            <p style="margin-bottom: 0">Field Name</p>
            <b-form-textarea
                    id="textarea"
                    v-model="newFieldName"
                    placeholder="This must match one of the current fields, but not one that already has a placeholder"
                    :state="isValidField"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <p style="margin-bottom: 0">Placeholder Text</p>
            <b-form-textarea
                    id="textarea"
                    v-model="newPlaceholderText"
                    placeholder="Enter a value"
                    :state="isValidPlaceholder"
                    size="sm"
                    rows="1"
                    max-rows="3"
            ></b-form-textarea>
            <b-button class="mt-3" block @click="save_new(); new_closeModal()" variant = "warning" :disabled="!(isValidField && isValidPlaceholder)">Save</b-button>
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
import PlaceholderCard from './PlaceholderCard.vue';

export default {
    name: 'PlaceholderEditor',
    props: {
        placeholderRef: String,
        doc: String
    },
    components: {
        PlaceholderCard
    },
    computed: {
        isValidField: function() {
            return this.existingFieldNames.filter(f => {return Object.keys(f)[0] === this.newFieldName}).length > 0 && !this.data.some(f => {return Object.values(f).indexOf(this.newFieldName) > -1})
        },

        isValidPlaceholder: function() {
            return this.newPlaceholderText.length > 0
        }
    },
    data() {
        return {
            data: [],
            existingFieldNames: [],
            dataLoaded: false,
            newFieldName: "",
            newPlaceholderText: "",
            new_modalVisible: false,
            msg_modalVisible: false,
            msg_modal_title: "",
            msg_modal_text: "",
            listenerRef: ""
        }
    },
    methods: {
        formatData(snapshot) {
            // console.log(snapshot);
            let ret = [];
            let keys = Object.keys(snapshot);
            for (let i = 0; i < keys.length; i ++) {
                let res = {
                    "field": keys[i],
                    "placeholder": snapshot[keys[i]]
                }
                ret.push(res)
            }
            return ret;
        },

        formatNames(obj) {
            console.log(obj);
            let ret = [];
            let keys = Object.keys(obj)
            for (let i = 0; i < keys.length; i++) {
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
            this.newPlaceholderText = "";
            this.new_modalVisible = true;
            
        },

        save_new() {
            this.new_closeModal();
            let val = {}
            val[this.newFieldName] = this.newPlaceholderText;
            console.log(val);
            rb.ref(this.placeholderRef).update(val).then(err => {
                if (err) window.alert("Error on saving new placeholder in realtime database, ref: " + this.doc)
                else this.msg_showModal("Success!", "Added a new placeholder")
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
        db.collection("GlobalFieldsCollection").doc(this.doc).onSnapshot(doc => {
            this.existingFieldNames = this.formatNames(doc.data());
            this.dataLoaded = true;
        })
        this.listenerRef = rb.ref(this.placeholderRef).on('value', snapshot => {
            this.data = this.formatData(snapshot.val());
            this.forceUpdate();
        });
    },

    beforeDestroy() {
        rb.ref(this.placeholderRef).off("value", this.listenerRef);
    }

}
</script>

<style>
</style>
