// New submit orders
<template>
<div>
    <div class="content">
    <div class="spinner" v-if="!allReady">
        <b-spinner label="Loading..."></b-spinner>
    </div>
    <div class="YouthSubmitOrders" v-show="allReady">
        <top-bar/>
        <h1 id="title">Submit Order Form</h1>
        <hr class="title">
        <PageHeader pageCategory="Youth Headers" pageName="Submit Orders"></PageHeader>

        <div v-for="field in fields.required" :key="field.name">
            <div v-if="field.name !== 'Youth ID'" class="specialInputFields">
                <span class="inline">{{field.name}}</span>
                <span style="color: red">*</span>
                <p style="color: grey">{{placeholders[field.name]}}</p>
                <SpecialInput :inputType="field.type" v-model="field.value" :arguments="{...args.specialInput}"></SpecialInput>

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
            <p style="color: grey">{{placeholders[field.name]}}</p>
            <SpecialInput v-model="field.value" v-if="allReady" :inputType="field.type" :arguments="args.specialInput"></SpecialInput>
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
    <b-modal v-model="this.errorVisible" hide-footer lazy hide-header-close no-close-on-backdrop no-close-on-esc>
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
    <b-modal v-model="this.messageVisible" hide-footer lazy hide-header-close no-close-on-backdrop no-close-on-esc>
        <template slot="modal-title">
            {{this.modal.msg.title}}
        </template>
        <div class="d-block text-center">
            <h4>{{this.modal.msg.message}}</h4>
        </div>
        <b-button class="mt-3" block @click="closeMsgModal" variant = "success">Ok</b-button>
    </b-modal>
    </div>
    <Footer/>



</div>
</template>

<script>
import {db} from '../../firebase';
import {rb} from '../../firebase';
import YouthIDSelector from '../../components/YouthIDSelector';
import {Timestamp} from '@/firebase.js';
import SpecialInput from '../../components/SpecialInput'
import PageHeader from "@/components/PageHeader.vue"
import { initSpecialInputVal } from '../../scripts/SpecialInit';	
import eMath from 'exact-math'

export default {
    name: 'YouthSubmitOrders',
    components: {
        YouthIDSelector,
        SpecialInput,
        PageHeader,
    },
    data() {
        return {
            allReady: false,
            ready: {
                selector: false,
                placeholders: false,
                fields: false,
                initializers: false
            },
            fields: {
                required: [], // {name: "", type: "", value: null}
                optional: [],
                hidden: []
            },
            placeholders: {},
            initializers: {},
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
                        value: initSpecialInputVal(Object.values(field)[0]),
                    });
                });
            });
            // console.log(this.fields);
            this.ready.fields = true;
        },
        async setPlaceholders(placeholders) {
            this.placeholders = placeholders;
            this.ready.placeholders = true;
        },

        async getInitializers() {
            let initializers = await rb.ref("Submit Orders Initializers").once('value').then(snapshot => { 
                return snapshot.val()
            })
            return initializers;
        },

        setInitializers(initializers) {
            let protectedInitializers = initializers.Protected;
            let unprotectedInitializers = initializers.Unprotected;
            this.initializers = {
                protectedInitializers,
                unprotectedInitializers
            }
            this.ready.initializers = true;
            
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
            this.modal.loading.visible = true;

            let hasValidFields = await this.hasValidFields();
            if (!hasValidFields) {
                return false

            }

            let res = await this.getYouthProfile()

            if (!(res)) {
                this.modal.loading.visible = false;
                window.alert("Unable to get Youth Profile")
                return;
            }


            if (!(await this.hasSufficientHours())) {
                this.modal.loading.visible = false;
                this.modal.error.visible = true;
                return;
            }


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
                this.handleError(youthQuery);
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

                let isNonValid = await this.isNonValidField(field.type, field.value)

                if (isNonValid) {
                    badFields.push(field.name);
                }
            })


            if (badFields.length) {
                this.modal.error.errors.push("The following fields have bad input or have missing values: " + badFields.toString());

                this.modal.loading.visible = false;
                this.showErrorModal();
                return false;
            }

            return true;

        },
        isNonValidField(type, value) {
            // console.warn(type, value);

            if (value == null) {
                return true;
            } else if (type == "Hours" && isNaN(value)) {
                return true
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
            let youthCurrentHours = eMath.sub(this.form.YouthProfile["Hours Earned"], parseFloat(this.form.YouthProfile["Hours Spent"]));
            if (youthCurrentHours < cost) {
                this.modal.error.errors.push("You don't have enough hours! You have " + youthCurrentHours + " but the Item Total Cost is " + cost);
                return false;
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
            // console.log('f', this.fields);
            this.fields.required.forEach(field => {
                payload[field.name] = field.value;
            })
            this.fields.optional.forEach(field => {
                payload[field.name] = field.value;
            })
            let protectedInitializers = this.initializers.protectedInitializers || {};
            let unprotectedInitializers = this.initializers.unprotectedInitializers || {};
            this.fields.hidden.forEach(field => {
                if (protectedInitializers[field.name] != null) {
                    payload[field.name] = protectedInitializers[field.name]
                } else if (unprotectedInitializers[field.name] != null) {
                    payload[field.name] = unprotectedInitializers[field.name]
                } else {
                    payload[field.name] = field.value;
                }
            })

            let periodQuery = await db.collection("GlobalPeriods").doc('metadata').get();
            payload["Period"] = periodQuery.data().CurrentPeriod
            payload["Order Date"] = Timestamp.fromDate(new Date());
            payload["Status"] = "Pending";
            return payload;
        },
        

        async updateYouthProfile(payload) {
            //Subtract hours
            //profile: this.form.YouthProfile
            // console.warn("ITC", payload["Item Total Cost"])
            // console.warn("HS", parseFloat(this.form.YouthProfile["Hours Spent"]))
            // console.warn("PH", parseFloat(this.form.YouthProfile["Pending Hours"]))
            // console.warn("NEW HS", (parseFloat(this.form.YouthProfile["Hours Spent"]) * 100 + parseFloat(payload["Item Total Cost"]) * 100) / 100)
            // console.warn("NEW PH",  (parseFloat(this.form.YouthProfile["Pending Hours"]) * 100 - parseFloat(payload["Item Total Cost"]) * 100) / 100)

            this.form.YouthProfile["Hours Spent"] = eMath.add(parseFloat(this.form.YouthProfile["Hours Spent"]), parseFloat(payload["Item Total Cost"]))
            this.form.YouthProfile["Pending Hours"] = eMath.sub(parseFloat(this.form.YouthProfile["Pending Hours"]), parseFloat(payload["Item Total Cost"]))
            // console.warn(this.form.YouthProfile);
            let updateStatus = await db.collection("GlobalYouthProfile").doc(payload["Youth ID"]).update(this.form.YouthProfile);
            if (updateStatus) {
                return false
            }
            return true;
        },

        resetPage() {
            this.form.YouthProfile = {};

            // console.log('c', Object.entries(this.$refs.YouthIDSelector[0]));
            this.$refs.YouthIDSelector[0].reset();
            for (let fieldType in this.fields) {
                this.fields[fieldType].forEach(element => {
                    element.value = initSpecialInputVal(element.type);
                })
            }
            return true;

        }

    },
    async mounted() {
        let queries = await Promise.all([
            await this.queryFields(),
            await this.queryPlaceholders(),
            await this.getInitializers(),
        ])
        await this.setFields(queries[0]);
        await this.setPlaceholders(queries[1]);
        await this.setInitializers(queries[2])
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
::v-deep .form-control {
    background-color: #fafafa;
}

</style>
