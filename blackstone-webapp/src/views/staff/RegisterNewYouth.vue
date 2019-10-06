<template>
    <div class = "RegisterYouth">
        <top-bar omitEmail/>
        <h3 style="margin: 20px">Register a new Youth here!</h3>

        <h4 class = "field_msg">Required fields:</h4>
        

        <div v-for="field in requiredFields">
            <div class="each_field">
                <p class="field_header">{{field.name}}</p>
                <input size="35" v-model="field.value" :type="field.type" :placeholder="field.placeholder"></br></br>
                <!-- <textarea v-model="field.value" :placeholder="field.name + '*'"></textarea> -->
            </div>
        </div>

        <h4 class = "field_msg" style="margin-top: 20px">Optional fields:</h4>
        <div v-for="field in optionalFields">
            <div class="each_field">
                <p class="field_header">{{field.name}}</p>
                <input v-if="field.type != 'radioOther' && field.type != 'radio' && field.type != 'tel'" size="35" v-model="field.value" :type="field.type" :placeholder="field.placeholder">
                <div v-if="field.type == 'tel'" class = "telDiv">
                  <vue-tel-input v-model="field.value" maxLen=14 validCharactersOnly=true></vue-tel-input>
                </div>
                <div v-if="field.type == 'radioOther'" class = "radioDiv">
                    <RadioGroupOther v-model="field.value" :options="field.id" nullOption>
                    </RadioGroupOther>
                </div>
                <div v-if="field.type == 'radio'" class = "radioDiv">
                    <RadioGroupOther v-model="field.value" :options="field.id" omitOtherOption>
                    </RadioGroupOther>
                </div>
                </br></br>
                <!-- <textarea v-model="field.value" :placeholder="field.name + '*'"></textarea> -->
            </div>
        </div>

        <b-button variant="success" @click="submit" style="margin-top:10px">Submit!</b-button>



        <!--//copied from https://bootstrap-vue.js.org/docs/components/modal/-->
        <b-modal v-model = "modalVisible" hide-footer lazy>
            <template slot="modal-title">
                New Youth registered!
            </template>
            <div class="d-block text-center">
                <h3>A new Youth has been registered with ID: {{newID}}!</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">Thanks!</b-button>
        </b-modal>

        <b-modal v-model = "errorModalVisible" hide-footer lazy>
            <template slot="modal-title">
                Error!
            </template>
            <div class="d-block text-center">
                <h3>The following fields have errors!</h3>
                <h4 v-for="errors in errorFields">{{errors}}</h4>
            </div>
            <b-button class="mt-3" block @click="closeErrorModal" variant = "primary">Thanks!</b-button>
        </b-modal>

    </div>

</template>

<script>
    import { VueTelInput } from 'vue-tel-input'
    import RadioGroupOther from '../../components/RadioGroupOther';
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import {firebase} from '../../firebase';
    import { forKeyVal } from '../../components/ParseDB.js';
    let fieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Profile");
    // let quarterRef = db.collection("GlobalVariables").doc("CurrentActiveQuarter")
    export default {
        name: 'RegisterYouth',
        components: {
            RadioGroupOther,
            VueTelInput,
        },
        data() {
            return {
                listenerRef: "",
                requiredFields: [], //[{name: "YouthID", value =""}, {name: "ItemID", value = ""}]
                optionalFields: [],
                hiddenFields: [],
                modalVisible: false,
                errorModalVisible: false,
                errorFields: [], //list of messages to be shown as errors
                YouthProfile: {},
                newID: "123",
                placeholders: {}
            };
        },
        methods: {
            async getFields() {
                let f = await fieldsRef.get();
                return f.data();
            },
            // async getQuarter() {
            //     let f = await quarterRef.get();
            //     return f.data();
            // },
            selectedID(value) {
                for (let i = 0; i < this.requiredFields.length; i ++) {
                    let curName = this.requiredFields[i]["name"];
                    if (curName === "First Name") this.requiredFields[i]["value"] = value.split(" ")[0];
                    else if (curName === "Last Name") this.requiredFields[i]["value"] = value.split(" ")[1];
                    else if (curName === "Youth ID") this.requiredFields[i]["value"] = value.split(" ")[2];
                }
            },
            async submit() {
                //if an error field has been returned
                let badFields = await this.checkValid();
                if (badFields.length) {
                    this.errorFields = badFields;
                    this.showErrorModal();
                }
                else {
                    console.log("Required fields")
                    console.log(this.requiredFields)
                    console.log("Optional fields")
                    console.log(this.optionalFields)
                    // let quarter = await this.getQuarter()
                    // input["ActivePeriods"] = [quarter["currentActiveQuarter"]];
                    
                    var input = {};
                    //hidden field initializers
                    await rb.ref('Youth Profile Initializers').once("value", snapshot => { 
                        console.log("Hidden listener")
                        console.log(snapshot.val())
                        let hiddenProtectedInitializers = snapshot.val()["Protected"];
                        let hiddenUnprotectedInitializers = snapshot.val()["Unprotected"];
                        for (let key in hiddenProtectedInitializers) {
                            console.log("Protected hidden")
                            input[key] = hiddenProtectedInitializers[key]
                        }
                        for (let key in hiddenUnprotectedInitializers) { 
                            console.log("Unprotected hidden")
                            input[key] = hiddenUnprotectedInitializers[key]
                        }
                    })
                    
                    var today = new Date();
                    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + ', ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                    input["Timestamp"] = date
                
                    let data = this.parse(this.requiredFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }
                    
                    data = this.parse(this.optionalFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }
                    
                    console.log(input);
                    let submitRef = db.collection("GlobalPendingRegistrations").doc();

                    //detach RTD listener
                    // rb.ref('Youth Profile Initializers').off("value", this.listenerRef);
                    
                    submitRef.set(input).then(response => {
                        // console.log("Document written with ID: ", submitRef.id);
                        this.newID = submitRef.id;
                        // db.collection("GlobalYouthProfile").doc(submitRef.id).collection("Work log").add({
                        //     // Creates placeholder
                        // });
                        // db.collection("GlobalYouthProfile").doc(submitRef.id).collection("Order log").add({
                        //     // Creates placeholder
                        // });
                        // db.collection("GlobalYouthProfile").doc(submitRef.id).collection("Transfer log").add({
                        //     // Creates placeholder
                        // });
                        // let variableID = input["First Name"] + ' ' + input["Last Name"] + ' ' + submitRef.id;
                        // db.collection("GlobalVariables").doc("CurrentActiveYouths").update({
                        //     IDs: firebase.firestore.FieldValue.arrayUnion(variableID)
                        // });
                        
                        
                        
                        // var textareas = this.$el.querySelector(".each_field")
                        // for(let i = 0; i < textareas.length; i ++){
                        //     console.log(textareas[i].value)
                        //     textareas[i].value = "";
                        // }
                    })
                    // .catch(function(error) {
                        // console.error("Error adding document: ", error);
                    // });
                    
                    this.showModal();
                }
            },
            //returns an array of fields that are not valid
            async checkValid() {
                let ret = [];
                //loop over required fields, check that they are at least filled in
                for (let i = 0; i < this.requiredFields.length; i++) {
                    let currentField = this.requiredFields[i];
                    //if it is of length 0
                    if (!currentField["value"].length) ret.push(currentField["name"]);
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
            },

            /* Set the active periods for the new youth.
             *   youth_id: The name and id of the new youth (e.g. "Yves Shum 10001")
             *   current_period: Whether to add the youth to the current period (boolean)
             *   next_period: Whether to add the youth to the next period (boolean)
             *
             * Handles the database loading and updating itself. If you want to load the active
             * periods database elsewhere for any reason, just move that first line of code to
             * wherever you'd like.
             *
             * Returns an array which is what the new youth's ActivePeriods field should be.
             * You can just set it to that directly, eg:
             *
             * new_profile["ActivePeriods"] = setYouthActivePeriods("Yves Shum 10001", true, false)
             */
            async setYouthActivePeriods(youth_id, current_period, next_period) {
                let active_periods_doc = await db.collection("GlobalVariables").doc("ActivePeriods").get();
                let data = active_periods_doc.data();
                let activePeriods = [];

                // Copy existing array of currently active youth and adds youth_id if applicable
                let current_active_youth = data["CurrentActiveYouths"];
                if (current_period) {
                    current_active_youth.concat([youth_id]);
                    activePeriods.push(data["CurrentPeriod"]);
                };

                // Copy existing array of future active youth and adds youth_id if applicable
                let future_active_youth = data["FutureActiveYouths"];
                if (next_period) {
                    future_active_youth.concat([youth_id]);
                    activePeriods.push(data["FuturePeriod"]);
                };

                // Update the database with the (potentially) changed arrays
                // db.collection("GlobalVariables").doc("ActivePeriods").update({
                //     CurrentActiveYouths: current_active_youth,
                //     FutureActiveYouths:  future_active_youth
                // }).then(
                //     // TODO: This function will be run on a successful update
                //     function() {},
                //     // TODO: This function will be run if the update fails
                //     function(err) {
                //         window.alert("Error updating Active Periods document: " + err);
                //         return err;
                //     }
                // );

                // Return the ActivePeriods variable for the youth represented by youth_id
                return activePeriods;
            }
        },
        async mounted() {
            let fields = await this.getFields();
            await rb.ref("Youth Profile Placeholders").once('value').then(snapshot => { 
                console.log("Reading placeholders")
                this.placeholders = snapshot.val();
            })
            
            console.log("Placeholders: " + this.placeholders);

            if (this.placeholders === {}) { 
                window.alert("Error on getting placeholder text values");
                return null;
            }
            var getType = function (val) {
                var type = "";
                if (val == "String"){
                    type = "textarea";
                } else if (val == "Boolean"){
                    type = "radio";
                } else if (val == "Grade"){
                    type = "number";
                } else if (val == "Date"){
                    type = "date";
                } else if (val == "Gender"){
                    type = "radioOther";
                } else if (val == "Phone"){
                    type = "tel";
                } else if (val == "Race"){
                    type = "radioOther";
                } else {
                    type = "textarea";
                }
                return type;
            };
            var getLabels = function (val, fields) {
                var labels = null;
                if (val == "Boolean"){
                    labels = ["Yes", "No"];
                }
                if (val == "Race"){
                    labels = fields["race"];
                }
                else if (val == "Gender"){
                    labels = fields["gender"];
                }
                return labels;
            };
            var req_keys = [];
            var req_types = [];
            var req_labels = [];
            forKeyVal(fields["required"], function(name, val, n) {
                console.log(`${n}: ${name},  ${val}`);
                var type = getType(val);
                var labels = getLabels(val, fields);
                req_keys.push(name);
                req_types.push(type);
                req_labels.push(labels)
            });
            for (let i = 0; i < req_keys.length; i ++) {
                if(req_labels[i] == null){
                    this.requiredFields.push({
                        name: req_keys[i],
                        value: "",
                        type: req_types[i],
                        placeholder: this.placeholders[req_keys[i]]
                    });
                } else {
                    for (let j = 0; j < req_labels[i].length; j ++){
                        this.requiredFields.push({
                            name: req_keys[i],
                            value: req_labels[i][j],
                            id: req_labels[i][j],
                            type: req_types[i]
                        });
                    }
                }
                
            }
            var opt_keys = [];
            var opt_types = [];
            var opt_labels = [];
            forKeyVal(fields["optional"], function(name, val, n) {
                console.log(`${n}: ${name},  ${val}`);
                var type = getType(val);
                var labels = getLabels(val, fields);
                opt_keys.push(name);
                opt_types.push(type);
                opt_labels.push(labels)
            });
            for (let i = 0; i < opt_keys.length; i ++) {
                if(opt_labels[i] == null){
                  this.optionalFields.push({
                      name: opt_keys[i],
                      value: "",
                      type: opt_types[i],
                      placeholder: this.placeholders[opt_keys[i]]
                  });
                } else {
                    this.optionalFields.push({
                        name: opt_keys[i],
                        value: "",
                        values: opt_labels[i],
                        id: opt_labels[i],
                        type: opt_types[i]
                    });
                }
            }
            var hidden_keys = [];
            forKeyVal(fields["hidden"], function(name, val, n) {
                console.log(`${n}: ${name},  ${val}`);
                var type = getType(val);
                hidden_keys.push(name);
            });
            for (let i = 0; i <hidden_keys.length; i ++) {
                this.hiddenFields.push({
                    name: hidden_keys[i],
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
    input{
        outline-color: cadetblue;
        text-align: center;
        border: 1px solid;
        border-radius: 4px;
        /* width: 30%; */
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
    
    .radioDiv{
        width: 35%;
        display: flex;
        margin-left: auto;
        margin-right: auto;
        justify-content: center;
        border: 1px solid black;
    }
    
    .telDiv{
        width: 35%;
        display: flex;
        margin-left: auto;
        margin-right: auto;
        justify-content: center;
    }

</style>