<!--
Submit Orders is for Youth to submit their orders, and spend their hours.

The YouthID Selector only selects those that are current active

Submit Orders should have error checking, e.g. not inputing a valid nubmer for Item Total Cost, not filling in required fields etc.

The submission also checks if the Youth has enough hours to pay for the item

Once a submission goes through firebase should have the following changes:
- In youth profile, Hours Spent should increase, Pending Hours should decrease
- GlobalPendingOrders should have a new record with all the fields on the form + some hidden fields such as Order Date, Period, Status (Always set to pending) etc.
</template>

-->
<template>
    <div class = "YouthSubmitOrders">
        <top-bar/>
        <h3 style="margin: 20px">Submit an order here!</h3>

        <h4 class = "field_msg">Required fields:</h4>
        <YouthIDSelector @selected="selectedID" periods="current" ref="selector"/>
        <p class = "separator">Or manually input it below</p>
        <div v-for="field in requiredFields" :key="field.name">
            <div class="each_field">
                <p class="field_header">{{field.name}}</p>
                <textarea v-model="field.value" :placeholder="placeholders[field.name]"></textarea>
            </div>
        </div>

        <h4 class = "field_msg" style="margin-top: 20px">Optional fields:</h4>
        <div v-for="field in optionalFields" :key="field.name">
            <div class="each_field">
                <p class="field_header">{{field.name}}</p>
                <textarea v-model="field.value" :placeholder="placeholders[field.name]"></textarea>
            </div>
        </div>

        <b-button variant="success" @click="submit" style="margin-top:10px">Submit!</b-button>

        <b-modal v-model = "modalVisible" hide-footer lazy>
            <template slot="modal-title">
                Order Submitted!
            </template>
            <div class="d-block text-center">
                <h3>Your order has been received and will be reviewed by staff!</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">Thanks!</b-button>
        </b-modal>

        <b-modal v-model = "errorModalVisible" hide-footer lazy>
            <template slot="modal-title">
                Error!
            </template>
            <div class="d-block text-center">
                <h3>The following fields have errors!</h3>
                <h4 v-for="errors in errorFields" :key="errors">{{errors}}</h4>
            </div>
            <b-button class="mt-3" block @click="closeErrorModal" variant = "primary">Thanks!</b-button>
        </b-modal>

        <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
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

    </div>

</template>

<script>
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import YouthIDSelector from "../../components/YouthIDSelector";
    import {Timestamp} from '@/firebase.js';
    import moment from 'moment';

    let YouthFieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Order Form");

    export default {
        name: 'YouthSubmitOrders',
        components: {
            YouthIDSelector
        },
        data() {
            return {
                requiredFields: [], //[{name: "YouthID", value =""}, {name: "ItemID", value = ""}]
                optionalFields: [],
                hiddenFields: [],
                loadingModalVisible: false,
                modalVisible: false,
                errorModalVisible: false,
                errorFields: [], //list of messages to be shown as errors
                YouthProfile: {}, //The current Youth profile trying to submit
                placeholders: {}
            };

        },
        methods: {
            async getFields() {
                let f = await YouthFieldsRef.get();
                return f.data();
            },

            selectedID(value) {

                // No ID selected - do nothing
                if (value == null) {
                    return;
                }
                for (let i = 0; i < this.requiredFields.length; i ++) {
                    let fieldName = this.requiredFields[i]["name"];
                    if (fieldName === "First Name") this.requiredFields[i]["value"] = value["First Name"];
                    else if (fieldName === "Last Name") this.requiredFields[i]["value"] = value["Last Name"];
                    else if (fieldName === "Youth ID") this.requiredFields[i]["value"] = value["ID"];
                }
            },

            async submit() {
                this.loadingModalVisible = true;
                //Populate this.YouthProfile with the current youth trying to submit
                let YouthID = this.parse(this.requiredFields).find(field => field["name"] === "Youth ID");
                console.log(YouthID);
                if (!(YouthID["value"] == null || YouthID["value"] === "")) {
                    let YouthProfile = await db.collection("GlobalYouthProfile").doc(YouthID["value"]).get();
                    this.YouthProfile = YouthProfile.data();
                    if (YouthProfile == null) {
                      this.errorFields.push("YouthID not found");
                      this.showErrorModal();
                    }
                }

                let badFields = await this.checkValid();
                //if an error field has been returned
                if (badFields.length) {
                    this.errorFields = badFields;
                    this.loadingModalVisible = false;
                    this.showErrorModal();
                }
                else {
                    let input = {};
                    let data = this.parse(this.requiredFields);
                    for (let i = 0; i < data.length; i ++) {
                        if (data[i]["name"] === "Item Total Cost") {
                            input[data[i]["name"]] = Math.round(parseFloat(data[i]["value"])*100) /100;
                        }
                        else {
                            input[data[i]["name"]] = data[i]["value"];
                        }

                    }

                    data = this.parse(this.optionalFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }

                    //Attaching current period
                    let period = await db.collection("GlobalVariables").doc("ActivePeriods").get()
                    period = period.data()["CurrentPeriod"]
                    input["Period"] = period;

                    //Submit order hidden fields from realtime database
                    //Sometimes we add hidden fields for the databases' sake
                    await rb.ref('Submit Orders Initializers').once("value" , snapshot => {
                        let hiddenProtectedInitializers = snapshot.val()["Protected"];
                        let hiddenUnprotectedInitializers = snapshot.val()["Unprotected"];
                        for (let key in hiddenProtectedInitializers) {
                            input[key] = hiddenProtectedInitializers[key]
                        }
                        for (let key in hiddenUnprotectedInitializers) {
                            input[key] = hiddenUnprotectedInitializers[key]
                        }
                    })
                    input["Order Date"] = Timestamp.fromDate(moment().toDate());

                    console.log('i', input);
                    let submitRef = db.collection("GlobalPendingOrders").doc();
                    let submitResponse = await submitRef.set(input); //if its good there should be nothing returned
                    if (submitResponse) {
                        window.alert("Submit wasn't successful, please check your connection and try again");
                        return null;
                    }

                    //update youth hours with the appropriate value
                    console.log(this.requiredFields);
                    let ITC = Math.round((this.parse(this.requiredFields).find(field => field["name"] === "Item Total Cost").value)*100)/100;
                    let newHoursSpent =  Math.round(((parseFloat(this.YouthProfile["Hours Spent"]) + parseFloat(ITC)))*100) / 100;
                    let newPendingHours = Math.round(((parseFloat(this.YouthProfile["Pending Hours"]) - parseFloat(ITC)))*100)/ 100;
                    let youthRef = db.collection("GlobalYouthProfile").doc((this.parse(this.requiredFields).find(field => field["name"] === "Youth ID"))["value"]);
                    console.log('hours', ITC, newHoursSpent, newPendingHours);
                    youthRef.update({
                        "Hours Spent": newHoursSpent,
                        "Pending Hours": newPendingHours
                    }).then(() => {
                        //reset youth profile
                        this.YouthProfile = {};
                        //reset fields
                        this.$refs.selector.reset();


                        this.resetFields();
                        this.loadingModalVisible = false;
                        this.showModal();
                    }).catch(error => {
                        window.alert(error);
                    });
                }
            },

            resetFields() {

                for (let f = 0; f < this.requiredFields.length; f ++) {
                    this.requiredFields[f]["value"] = "";
                }
                for (let f = 0; f < this.optionalFields.length; f ++) {
                    this.optionalFields[f]["value"] = "";
                }
            },

            //returns an array of fields that are not valid
            async checkValid() {
                let ret = [];
                //loop over required fields, check that they are at least filled in
                for (let i = 0; i < this.requiredFields.length; i++) {
                    let currentField = this.requiredFields[i];
                    //if it is of length 0
                    if (!currentField["value"].length || currentField["value"] == null) ret.push(currentField["name"]);
                }

                //Total cost must be a valid number
                let ITC = this.parse(this.requiredFields).find(field => field["name"] === "Item Total Cost");
                if (isNaN(ITC["value"])) ret.push(ITC["name"] + " has to be a number!");
                if (ITC["value"] < 0) ret.push("Item Total Cost has to be a positive number!")

                //checking if you have enough hours
                let currentHours = parseFloat(this.YouthProfile["Hours Earned"]) - parseFloat(this.YouthProfile["Hours Spent"]);
                if (currentHours < parseFloat(ITC["value"])) {
                    ret.push("Not enough hours, you have " + currentHours);
                }
                return ret;
            },

            find(key, arr) {
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i]["name"] === key) return arr[i];
                }
                return false;
            },

            parse(item) {
                return JSON.parse(JSON.stringify(item));
            },

            showModal() {
                this.modalVisible = true;
            },

            closeModal() {
                this.modalVisible = false;
            },
            showErrorModal() {
                this.errorModalVisible = true;
            },

            closeErrorModal() {
                this.errorModalVisible = false;
                //return scrolling ability
            }
        },
        async mounted() {
            let fields = await this.getFields();
            await rb.ref("Submit Orders Placeholders").once('value').then(snapshot => {
                this.placeholders = snapshot.val();
                console.log('p', this.placeholders)
            })

            if (this.placeholders === {}) {
                window.alert("Error on getting placeholder text values");
                return null;
            }

            for (let i = 0; i < fields["required"].length; i ++) {
                this.requiredFields.push({
                    name: Object.keys(fields["required"][i])[0],
                    value: "",
                    placeholder: this.placeholders[fields["required"][i]]
                });
            }
            for (let i = 0; i < fields["optional"].length; i ++) {
                this.optionalFields.push({
                    name: Object.keys(fields["optional"][i])[0],
                    value: "",
                    placeholder: this.placeholders[fields["optional"][i]]
                })
            }
            for (let i = 0; i <fields["hidden"].length; i ++) {
                this.hiddenFields.push({
                    name: Object.keys(fields["hidden"][i])[0],
                    value: ""
                })
            }

        }
    }
</script>

<style scoped>
    p a {
        text-decoration: underline;
        cursor: pointer;
    }
    textarea{
        outline-color: cadetblue;
        text-align: center;
        border: 1px solid;
        border-radius: 4px;
        width: 30%;
        margin-bottom: 5px;
    }
    ::placeholder span{
        color: red;
        opacity: 1;
    }
    .field_msg{
        text-decoration: underline;
    }

    .separator{
        color:grey;
        margin-top:2px;
        margin-bottom:2px;
        font-style:italic;
    }

    .field_header{
        margin-bottom:1px;

    }

</style>
