<template>
    <div class = "RegisterYouth">
        <top-bar omitEmail/>
        
        <h4 style="margin: 20px">Are you registering a new Youth or a returning Youth?</h4>
        
        <div class = "specialDiv">
          <b-form-select v-model="returningYouth" :options="returningOptions" style="margin-top: 20px"></b-form-select>
        </div>
        
        <h3 v-if="returningYouth == 'New Youth'" style="margin: 20px">Register a new Youth here!</h3>
        
        <h3 v-if="returningYouth == 'Returning Youth'" style="margin: 20px">Register a returning Youth here!</h3>

        <div v-if="returningYouth != '-'">

        <h4 class = "field_msg">Required fields:</h4>
        
        <div v-if="returningYouth == 'Returning Youth'">
        
          <p class="field_header">Enter Your Youth ID:</p>
        
          <div class = "specialDiv">
            <SpecialInput v-model="returningYouthID" ref="returningYouthID" inputType="String"></SpecialInput>
            </br>
            <div v-for="field in requiredFields">
                  <div v-if="field.name == 'Class'">
                      <p class="field_header">{{field.name}}</p>
                        <SpecialInput v-model="field.value" :ref="field.name" :inputType="field.type" :args="arguments">
                        </SpecialInput>
                      <br>
                  </div>
                  <div v-if="field.name == 'Class' && field.value != '' && field.value != undefined && field.value != null">
                      <div v-for="question in essayQuestions[field.value]">
                        <p class="field_header">{{question}}</p>
                          <SpecialInput v-model="answers[field.value][question]" :ref="question" inputType="Essay" :args="arguments">
                          </SpecialInput>
                        <br>
                      </div>
                  </div>
            </div>
            <b>Enter new answers below to overwrite the information from your previous registration. Leave the fields blank if your answers have not changed.</b>
            <hr>
          </div>
        
      </div>
        

        <div v-for="field in requiredFields">
            <div class="each_field">
                <div v-if="!(field.name == 'Class' && returningYouth == 'Returning Youth')">
                  <p class="field_header">{{field.name}}</p>
                  <div class = "specialDiv">
                    <SpecialInput v-model="field.value" :ref="field.name" :inputType="field.type" :args="arguments">
                    </SpecialInput>
                  </div>
                </div>
                <br>
                <div v-if="field.name == 'Class' && field.value != '' && field.value != undefined && field.value != null && returningYouth != 'Returning Youth'">
                    <div v-for="question in essayQuestions[field.value]">
                      <p class="field_header">{{question}}</p>
                      <div class = "specialDiv">
                        <SpecialInput v-model="answers[field.value][question]" :ref="question" inputType="Essay" :args="arguments">
                        </SpecialInput>
                      </div>
                      <br>
                    </div>
                </div>
            </div>
        </div>

        <h4 class = "field_msg" v-if="returningYouth == 'New Youth'">Optional fields:</h4>
        <div v-for="field in optionalFields">
            <div class="each_field">
                <p class="field_header">{{field.name}}</p>
                <div class = "specialDiv">
                  <SpecialInput v-model="field.value" :ref="field.name" :inputType="field.type" :args="arguments">
                  </SpecialInput>
                </div>
                <br>
            </div>
        </div>

        <b-button variant="success" @click="submit" style="margin-top:10px">Submit!</b-button>

        </div>


        <b-modal v-model = "modalVisible" hide-footer lazy>
            <template slot="modal-title">
                New Youth registered!
            </template>
            <div class="d-block text-center">
                <h3 v-if="returningYouth == 'New Youth'">A new Youth has been registered! Confirmation ID: {{newID}} (You may safely ignore this)</h3>
                <h3 v-if="returningYouth == 'Returning Youth'">A returning Youth has been registered! Confirmation ID: {{newID}} (You may safely ignore this)</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">Thanks!</b-button>
        </b-modal>

        <b-modal v-model = "errorModalIsVisible" hide-footer lazy>
            <template slot="modal-title">
                Error!
            </template>
            <div class="d-block text-center">
                <h3>The following fields have errors!</h3>
                <h4 v-for="errors in errorFields">{{errors}}</h4>
            </div>
            <b-button class="mt-3" block @click="closeErrorModal" variant = "primary">Thanks!</b-button>
        </b-modal>

         <!-- Loading Modal -->
        <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                Doing some work...
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
    import { VueTelInput } from 'vue-tel-input'
    import SpecialInput from '@/components/SpecialInput';
    import { initSpecialInputVal } from '../../scripts/SpecialInit';
    import RadioGroupOther from '../../components/RadioGroupOther';
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import {firebase} from '../../firebase';
    import { forKeyVal } from '@/scripts/ParseDB.js';
    import {Timestamp} from '@/firebase.js';

    let fieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Profile");
    let optionsRef = db.collection("GlobalVariables").doc("Profile Options");
    let essayRef = db.collection("GlobalVariables").doc("EssayQuestions");
    
    // let quarterRef = db.collection("GlobalVariables").doc("CurrentActiveQuarter")
    export default {
        name: 'RegisterYouth',
        components: {
            RadioGroupOther,
            VueTelInput,
            SpecialInput,
        },
        data() {
            return {
                listenerRef: "",
                requiredFields: [], //[{name: "YouthID", value =""}, {name: "ItemID", value = ""}]
                optionalFields: [],
                hiddenFields: [],
                modalVisible: false,
                loadingModalVisible: false,
                errorModalVisible: false,
                errorFields: [], //list of messages to be shown as errors
                YouthProfile: {},
                newID: "123",
                placeholders: {},
                arguments: {
                    "placeholder": "0"
                },
                returningYouth: "-",
                returningOptions: [
                    { value: '-', text: '-' },
                    { value: 'New Youth', text: 'New Youth' },
                    { value: "Returning Youth", text: 'Returning Youth' }
                ],
                returningYouthID: null,
                essayQuestions : {},
                answers : {},
            };
        },
        computed:{
            errorModalIsVisible: function () {
              return this.errorModalVisible
            }
        },
        methods: {
            async getFields() {
                let f = await fieldsRef.get();
                this.loadingModalVisible = false;
                return f.data();
            },
            async getEssays() {
                let f = await essayRef.get();
                return f.data();
            },
            async getOptions() {
                let o = await optionsRef.get();
                return o.data();
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
                this.loadingModalVisible = true;
                //if an error field has been returned
                let badFields = await this.checkValid();
                if (badFields.length) {
                    this.errorFields = badFields;
                    this.loadingModalVisible = false;
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
                    
                    if(this.returningYouth == "Returning Youth"){
                        let selectedYouth = await db.collection("GlobalYouthProfile").doc(this.returningYouthID).get();
                        input = selectedYouth.data();
                        if (input == null) {
                            this.errorFields = ["Returning Youth ID"];
                            this.loadingModalVisible = false;
                            this.showErrorModal();
                            return null;
                        }
                        input["New or Returning"] = "Returning Youth";
                        input["ReturningID"] = this.returningYouthID;
                    } else {
                        input["New or Returning"] = "New Youth";
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
                    }
                    
                    var today = new Date();
                    var date = Timestamp.fromDate(new Date());
                    input["Timestamp"] = date
                
                    let data = this.requiredFields;
                    for (let i = 0; i < data.length; i ++) {
                        if(data[i]["value"] == undefined){
                            if(this.returningYouth != "Returning Youth"){
                                data[i]["value"] = "";
                            }
                        } else if(this.returningYouth == "Returning Youth") {
                            if(data[i]["value"] != initSpecialInputVal(data[i]["type"])){
                                input[data[i]["name"]] = data[i]["value"];
                            }
                        }
                        if(this.returningYouth != "Returning Youth"){
                            input[data[i]["name"]] = data[i]["value"];
                        }
                    }
                    
                    data = this.optionalFields;
                    for (let i = 0; i < data.length; i ++) {
                        if(data[i]["value"] == undefined){
                            if(this.returningYouth != "Returning Youth"){
                                data[i]["value"] = "";
                            }
                        } else if(this.returningYouth == "Returning Youth") {
                            if(data[i]["value"] != initSpecialInputVal(data[i]["type"])){
                                input[data[i]["name"]] = data[i]["value"];
                            }
                        }
                        if(this.returningYouth != "Returning Youth"){
                            input[data[i]["name"]] = data[i]["value"];
                        }
                    }
                    
                    let currentClass = input["Class"];
                    console.log("Current class " + currentClass);
                    input["Essay"] = {}
                    for(var question in this.answers[currentClass]){
                        input["Essay"][question] = this.answers[currentClass][question];
                    }
                    
                    console.log(input);
                    let submitRef = db.collection("GlobalPendingRegistrations").doc();

                    //detach RTD listener
                    // rb.ref('Youth Profile Initializers').off("value", this.listenerRef);
                    let submitStatus = await submitRef.set(input)
                    if(this.returningYouth == "Returning Youth"){
                        if (submitStatus) {
                            window.alert("Error adding returning registration");
                        }
                    } else {
                        if (submitStatus) {
                            window.alert("Error adding new registration");
                        }
                    }
                        // console.log("Document written with ID: ", submitRef.id);
                    this.newID = submitRef.id;
                    
                    // Clear the fields
                    for (let i = 0; i < this.requiredFields.length; i ++) {
                        this.requiredFields[i]["value"] = initSpecialInputVal(this.requiredFields[i]["type"]);
                    }
                    for (let i = 0; i < this.optionalFields.length; i ++) {
                        this.optionalFields[i]["value"] = initSpecialInputVal(this.optionalFields[i]["type"]);
                    }
                          
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

                    // .catch(function(error) {
                        // console.error("Error adding document: ", error);
                    // });
                    this.loadingModalVisible = false;
                    this.showModal();
                }
            },
            //returns an array of fields that are not valid
            async checkValid() {
                let ret = [];
                //loop over required fields, check that they are at least filled in
                if(this.returningYouth == "New Youth"){
                  for (let i = 0; i < this.requiredFields.length; i++) {
                      let currentField = this.requiredFields[i];
                      //if it is of length 0
                      if (currentField["value"] == undefined || currentField["value"] == "") ret.push(currentField["name"]);
                  }
                } else {
                  if (!this.returningYouthID.length) ret.push("Returning Youth ID");
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
            this.loadingModalVisible = true;
            let fields = await this.getFields();
            let options = await this.getOptions();
            this.essayQuestions = await this.getEssays();
            for (var className in this.essayQuestions) {
                this.answers[className] = {};
                for(var i = 0; i < this.essayQuestions[className].length; i++){
                    this.answers[className][this.essayQuestions[className][i]] = "";
                }
            }
            await rb.ref("Youth Profile Placeholders").once('value').then(snapshot => { 
                console.log("Reading placeholders")
                this.placeholders = snapshot.val();
            })

            if (this.placeholders === {}) { 
                window.alert("Error on getting placeholder text values");
                return null;
            }
            var req_keys = [];
            var req_vals = [];
            forKeyVal(fields["required"], function(name, val, n) {
                req_keys.push(name);
                req_vals.push(val);
            });
            for (let i = 0; i < req_keys.length; i ++) {
                this.requiredFields.push({
                    name: req_keys[i],
                    value: initSpecialInputVal(req_vals[i]),
                    type: req_vals[i],
                    placeholder: this.placeholders[req_keys[i]]
                });
            }
            var opt_keys = [];
            var opt_vals = [];
            forKeyVal(fields["optional"], function(name, val, n) {
                opt_keys.push(name);
                opt_vals.push(val);
            });
            for (let i = 0; i < opt_keys.length; i ++) {
                this.optionalFields.push({
                    name: opt_keys[i],
                    value: initSpecialInputVal(opt_vals[i]),
                    type: opt_vals[i],
                    placeholder: this.placeholders[opt_keys[i]]
                });
            }
            var hidden_keys = [];
            forKeyVal(fields["hidden"], function(name, val, n) {
                // console.log(`${n}: ${name},  ${val}`);
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
    
    .specialDiv{
        width: 35%;
        margin-left: auto;
        margin-right: auto;
        justify-content: center;
    }

</style>