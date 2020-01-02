// New submit orders 
<template>
<div>
    <div class="spinner" v-if="!allReady">
        <b-spinner label="Loading..."></b-spinner>
    </div>
    <div class="YouthSubmitOrders" v-show="allReady">
        <top-bar/>
        <h1 id="title">Submit Order Form</h1>
        <hr class="title">
        
        <div v-for="field in fields.required" :key="field.name">
            <div v-if="field.name !== 'Youth ID'" class="specialInputFields">
                <span class="inline">{{field.name}}</span>
                <span style="color: red">*</span>
                <SpecialInput :inputType="field.type" v-model="field.value" :arguments="args.specialInput"></SpecialInput>
            </div>
            <div v-else>
                <div class="idInput">
                    <h4>Enter your ID</h4>
                    <YouthIDSelector @selected="selectedID" periods="current" ref="selector" @ready="selectorReady"/>
                    <p class="separator">Or enter manually if not found</p>
                    <div style="width: 80%; margin: 0 auto">
                        <SpecialInput inputType="String" v-model="fields.required[youthIDFieldIndex].value" v-if="allReady" :arguments="args.specialInput"></SpecialInput>
                    </div>
                    
                </div>
            </div>
        </div>

        <div v-for="field in fields.optional" :key="field.name" class="specialInputFields">
            <p>{{field.name}}</p>
            <SpecialInput :inputType="field.type" :arguments="args.specialInput"></SpecialInput>
        </div>

        <b-button variant="success" @click="handleSubmit" style="margin-top:10px">Submit!</b-button>
    </div>

    <!-- Loading Modal -->
    <b-modal v-model="modal.loading.visible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
        <template slot="modal-title">
            Loading
        </template>
        <div class="d-block text-center">
            <div slot="table-busy" class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong> Loading...</strong>
            </div>
        </div>
    </b-modal>

    <!-- Error Modal -->

    <!-- Message Modal -->

    
    
</div>
</template>

<script>
import {db} from '../../firebase';
import {rb} from '../../firebase';
import YouthIDSelector from '../../components/YouthIDSelector';
import {Timestamp} from '@/firebase.js';
import moment from 'moment';
import SpecialInput from '../../components/SpecialInput'

export default {
    name: 'YouthSubmitOrders',
    components: {
        YouthIDSelector,
        SpecialInput
    },
    data() {
        return {
            allReady: false,
            ready: {
                selector: false,
                placeholders: false,
                fields: false
            },
            fields: {
                required: [], // {name: "", value: null}
                optional: [],
                hidden: []
            }, 
            placeholders: {},
            args: {
                specialInput: {
                    style: "text-align: center"
                }
            },
            modal: {
                loading: {
                    visible: false
                },
                error: {
                    visible: false,
                    errors: []
                },
                msg: {
                    visible: false,
                    title: "",
                    message: ""
                }
            },
            form: {
                YouthProfile: {}
            }

        }
    },
    computed: {
        youthIDFieldIndex: function() {
            let index = this.getFieldIndex('Youth ID', 'required');
            return index;
        }
    },
    watch: {
        ready: {
            handler: function() {
                this.checkReady();
            },
            deep: true
        }
    },
    methods: {
        //helpers for readiness/////////////////////////////////////////////////////
        checkReady() {
            if (!Object.values(this.ready).includes(false)) {
                this.allReady = true;
            }
        },
        selectorReady() {
            this.ready.selector = true;
        },

        //mounted helpers///////////////////////////////////////////////////////////
        async queryFields() {
            let f = await db.collection("GlobalFieldsCollection")
                            .doc("Youth Order Form").get();
            return f.data();
        },
        async queryPlaceholders() {
            let snapshot = await rb.ref("Submit Orders Placeholders")
                                    .once('value');
            return snapshot.val();
        },
        async setFields(fields) {
            let fieldTypes = ["required", "optional", "hidden"];
            fieldTypes.forEach(fieldType => {
                fields[fieldType].forEach(field => {
                    this.fields[fieldType].push({
                        type: Object.values(field)[0],
                        name: Object.keys(field)[0],
                        value: null,
                    });
                });
            });
            console.log(this.fields);
            this.ready.fields = true;
        },
        async setPlaceholders(placeholders) {
            this.placeholders = placeholders;
            this.ready.placeholders = true;
        },

        //other/////////////////////////////////////////////////////
        getFieldIndex(fieldName, fieldType) {
            let ret = -1;
            for (let i = 0; i < this.fields[fieldType].length; i++) {
                if (this.fields[fieldType][i].name === fieldName) {
                    ret = i;
                    return ret;
                }
            }
            return ret;
        },
        selectedID(value) {
            if (value == null) {
                this.fields.required[this.getFieldIndex("Youth ID", "required")]
                    .value = "";
                this.fields.required[this.getFieldIndex("First Name", "required")]
                    .value = "";
                this.fields.required[this.getFieldIndex("Last Name", "required")]
                    .value = "";

            } else {
                this.fields.required[this.getFieldIndex("Youth ID", "required")]
                    .value = value.ID;
                this.fields.required[this.getFieldIndex("First Name", "required")]
                    .value = value["First Name"];
                this.fields.required[this.getFieldIndex("Last Name", "required")]
                    .value = value["Last Name"];
            }
        },

        //Error Handling//////////////////////////////////////////////
        handleError(errmsg) {
            window.alert("Apologies, Backend Error: " + errmsg +".\n Please refresh page to try again. If problem persists, let staff know")
        },

        //Modal helpers//////////////////////////////////////
        showErrorModal() {
            this.modal.loading.visible = false;
            this.modal.error.visible = true;
        },

        //Form Submission/////////////////////////////////////////////////////////
        async handleSubmit() {
            console.log('submit clicked')
            this.modal.loading.visible = true;
            if (!this.hasValidFields())
                return;
            console.log('hasValidFields');

            let res = await this.getYouthProfile()
            console.log('res', res);
            if (!(res)) 
                return;
            console.log('p',this.form.YouthProfile);

            if (!(await this.hasSufficientHours()))
                return;
            console.log('hasSufficientHours');

            if (!(await this.submitOrder()))
                return ;
            console.log("Successfully executed handleSubmit");
            this.resetPage();
        },
        async getYouthProfile() {
            let youthID = this.fields.required
                            .find(field => field.name === "Youth ID").value;
            let youthQuery = await db.collection("GlobalYouthProfile")
                .doc(youthID).get();

            if (youthQuery instanceof Error) {
                this.handleError(error);
                return false;
            }
            if (youthQuery.exists) {
                this.form.YouthProfile = youthQuery.data();
                return true;
            }
            else {
                this.modal.error.errors.push("YouthID not found :(, please check that it exists or whether you've made a typo");
                this.showErrorModal();
                return false;
            }

        },
        async hasValidFields() {
            let badFields = [];

            //non emptyg
            this.fields.required.forEach(field => {
                if (field.value == null || !field.value.length)
                    badFields.push(field.name);
            })
            
            this.modal.error.errors.push("The following fields are required: " + badFields.toString());
            console.log(this.modal.error.errors);
            this.showErrorModal();
        },
        async hasSufficientHours() {
            let cost = this.fields.required
                .find(f => f.name === "Item Total Cost").value
            let youthCurrentHours = parseFloat(this.form.YouthProfile["Hours Earned"] - parseFloat(this.form.YouthProfile["Hours Spent"]));
            if (youthCurrentHours < cost) {
                this.modal.error.errors.push("You don't have enough hours! You have " + youthCurrentHours + " but the Item Total Cost is " + cost);
            }
            return true;
        },
        async submitOrder() {
            //Submit Order to GlobalPendingOrders
            let payload = await this.constructSubmitPaylod();
            let submitResponse = await db.collection("GlobalPendingOrders").doc().set(payload);
            if (submitResponse) {
                window.alert("Submit wasn't successful, please refresh, check your connection and try again");
                return false;
            }

            //Update Youth Profile
            //TODO:
            let updateYouthProfileStatus = await this.updateYouthProfile(payload);
            if (!updateYouthProfileStatus)
                return false; 

            return true;
        
        },
        async constructSubmitPaylod() {
            //TODO: this builds the payload for GlobalPendingOrders
            let payload = {};
            console.log('f', this.fields);
            this.fields.required.forEach(field => {
                payload[field.name] = field.value;
            })
            this.fields.optional.forEach(field => {
                payload[field.name] = field.value;
            })
            this.fields.hidden.forEach(field => {
                payload[field.name] = field.value;
            })

            let periodQuery = await db.collection("GlobalPeriods").doc('metadata').get();
            payload["Period"] = periodQuery.data().CurrentPeriod
            return payload;
        },
        updateYouthProfile(payload) {
            //TODO:
        },
        resetPage() {
            //TODO:

        }

    },
    async mounted() {
        let fieldQuery = await this.queryFields();
        let placeholderQuery = await this.queryPlaceholders();
        await this.setFields(fieldQuery);
        await this.setPlaceholders(placeholderQuery);
    },

    
}

</script>

<style scoped>
.YouthSubmitOrders {
    margin: 0 auto;
}
hr.title {
    width: 80%
}

.idInput {
    border: 1px solid grey;
    width: 80%;
    margin: 0 auto;
    margin-bottom: 1rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}

textarea.id {
    width: 60%;
    text-align: center;
}

.spinner {
    margin: 25% auto;
}

span.inline {
    display: inline
}
.specialInputFields {
    width:  70%;
    margin: 0 auto;
}

</style>
