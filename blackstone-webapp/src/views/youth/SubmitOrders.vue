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
                <SpecialInput :inputType="field.type" v-model="field.value" :arguments="{...args.specialInput, ...{placeholder: placeholders[field.name]}}"></SpecialInput>

            </div>
            <div v-else>
                <div class="idInput">
                    <h4>Enter your ID</h4>
                    <YouthIDSelector @selected="selectedID" periods="current" ref="YouthIDSelector" @ready="selectorReady"/>
                    <p class="separator">Or enter manually if not found</p>
                    <div style="width: 80%; margin: 0 auto">
                        <SpecialInput inputType="String" v-model="fields.required[youthIDFieldIndex].value" v-if="allReady" :arguments="args.specialInput"></SpecialInput>
                    </div>

                </div>
            </div>
        </div>

        <div v-for="field in fields.optional" :key="field.name" class="specialInputFields">
            <p>{{field.name}}</p>
            <SpecialInput :inputType="field.type" :arguments="args.specialInput" class = "input"></SpecialInput>
        </div>

        <b-button variant="success" @click="handleSubmit()" style="margin-top:10px">Submit!</b-button>
    </div>

    <!-- Loading Modal -->
    <b-modal v-model="this.loadingVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
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
    <b-modal v-model="this.errorVisible" hide-footer lazy hide-header-close>
        <template slot="modal-title">
            Error
        </template>
        <div class="d-block text-center">
            <h3>Error:</h3>
            <h4 v-for="errors in modal.error.errors" :key="errors">{{errors}}</h4>
        </div>
        <b-button class="mt-3" block @click="closeErrorModal" variant = "primary">Understood</b-button>
    </b-modal>

    <!-- Message Modal -->
    <b-modal v-model="this.messageVisible" hide-footer lazy hide-header-close>
        <template slot="modal-title">
            {{this.modal.msg.title}}
        </template>
        <div class="d-block text-center">
            <h4>{{this.modal.msg.message}}</h4>
        </div>
        <b-button class="mt-3" block @click="closeMsgModal" variant = "success">Ok</b-button>
    </b-modal>



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
                    visible: false,
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
        },

        loadingVisible: function() {
            return this.modal.loading.visible;
        },

        errorVisible: function() {
            return this.modal.error.visible;
        },

        messageVisible: function() {
            return this.modal.msg.visible;
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
            console.log('p', this.placeholders);
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

        closeErrorModal() {
            this.modal.error.visible = false;
            this.modal.error.errors = [];
        },

        closeMsgModal() {
            this.modal.msg.visible = false;
            this.modal.msg.title = "";
            this.modal.msg.message = "";
        },

        //Form Submission/////////////////////////////////////////////////////////
        async handleSubmit() {
            console.log(this.fields)
            this.modal.loading.visible = true;

            let hasValidFields = await this.hasValidFields();
            if (!hasValidFields) {
                return false

            }

            let res = await this.getYouthProfile()

            if (!(res))
                return;


            if (!(await this.hasSufficientHours()))
                return;


            if (!(await this.submitOrder()))
                return ;


            this.resetPage();
            this.modal.loading.visible = false;
            this.modal.msg.title = "Success!";
            this.modal.msg.message = "Your order has been placed and will be reviewed by staff."
            this.modal.msg.visible = true;

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
            this.modal.error.errors = [];

            //non empty
            await this.fields.required.forEach(async (field) => {

                let isNonValid = await this.isNonValidField(field.value)

                if (isNonValid) {
                    badFields.push(field.name);

                }


            })


            if (badFields.length) {
                this.modal.error.errors.push("The following fields are required: " + badFields.toString());

                this.modal.loading.visible = false;
                this.showErrorModal();
                return false;
            }

            return true;

        },
        isNonValidField(value) {

            if (value == null) {
                return true;
            }
            else if (typeof(value) === "number") {
                return false;
            }
            else {
                return (!value.length)
            }
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
            let updateYouthProfileStatus = await this.updateYouthProfile(payload);
            if (!updateYouthProfileStatus)
                return false;

            return true;

        },
        async constructSubmitPaylod() {
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
            payload["Order Date"] = Timestamp.fromDate(new Date());
            return payload;
        },
        async updateYouthProfile(payload) {
            //Subtract hours
            //profile: this.form.YouthProfile
            console.log('p', payload);
            console.log('yp', this.form.YouthProfile);
            this.form.YouthProfile["Hours Spent"] =
                parseFloat(this.form.YouthProfile["Hours Spent"]) + payload["Item Total Cost"]
            this.form.YouthProfile["Pending Hours"] =
                parseFloat(this.form.YouthProfile["Pending Hours"]) - payload["Item Total Cost"];
            // console.warn(this.form.YouthProfile);
            let updateStatus = await db.collection("GlobalYouthProfile").doc(payload["Youth ID"]).update(this.form.YouthProfile);
            if (updateStatus) {
                return false
            }
            return true;
        },

        resetPage() {
            this.form.YouthProfile = {};

            console.log('c', Object.entries(this.$refs.YouthIDSelector[0]));
            this.$refs.YouthIDSelector[0].reset();
            for (let fieldType in this.fields) {
                this.fields[fieldType].forEach(element => {
                    element.value = null;
                })
            }
            return true;

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
    margin-bottom: 2rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
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
    margin-bottom: 1rem;
}

.separator {
  margin-top: 1rem;
}

</style>
