<template>
    <div class = "StaffRegisterYouth">
        <top-bar/>
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
                <input size="35" v-model="field.value" :type="field.type" :placeholder="field.placeholder"></br></br>
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
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import {firebase} from '../../firebase';
    let fieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Profile");
    let quarterRef = db.collection("GlobalVariables").doc("CurrentActiveQuarter")
    export default {
        name: 'StaffRegisterYouth',
        components: {
        
        },
        data() {
            return {
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
            async getQuarter() {
                let f = await quarterRef.get();
                return f.data();
            },
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
                    var input = {};
                    //hidden field initializers
                    let listener = await rb.ref('Youth Profile Initializers').on("value", snapshot => { 
                        let hiddenProtectedInitializers = snapshot.val()["Protected"];
                        let hiddenUnprotectedInitializers = snapshot.val()["Unprotected"];
                        for (let key in hiddenProtectedInitializers) {
                            input[key] = hiddenProtectedInitializers[key]
                        }
                        for (let key in hiddenUnprotectedInitializers) { 
                            input[key] = hiddenUnprotectedInitializers[key]
                        }
                    })
                    let quarter = await this.getQuarter()
                    input["ActivePeriods"] = [quarter["currentActiveQuarter"]];
                
                    let data = this.parse(this.requiredFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }
                    
                    data = this.parse(this.optionalFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }
                    let submitRef = db.collection("GlobalYouthProfile").doc();

                    //detach RTD listener
                    rb.ref('Youth Profile Initializers').off("value", listener);
                    
                    submitRef.set(input).then(response => {
                        // console.log("Document written with ID: ", submitRef.id);
                        this.newID = submitRef.id;
                        db.collection("GlobalYouthProfile").doc(submitRef.id).collection("Work log").add({
                            // Creates placeholder
                        });
                        db.collection("GlobalYouthProfile").doc(submitRef.id).collection("Order log").add({
                            // Creates placeholder
                        });
                        db.collection("GlobalYouthProfile").doc(submitRef.id).collection("Transfer log").add({
                            // Creates placeholder
                        });
                        let variableID = input["First Name"] + ' ' + input["Last Name"] + ' ' + submitRef.id;
                        db.collection("GlobalVariables").doc("CurrentActiveYouths").update({
                            IDs: firebase.firestore.FieldValue.arrayUnion(variableID)
                        });
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
                db.collection("GlobalVariables").doc("ActivePeriods").update({
                    CurrentActiveYouths: current_active_youth,
                    FutureActiveYouths:  future_active_youth
                }).then(
                    // TODO: This function will be run on a successful update
                    function() {},
                    // TODO: This function will be run if the update fails
                    function(err) {
                        window.alert("Error updating Active Periods document: " + err);
                        return err;
                    }
                );

                // Return the ActivePeriods variable for the youth represented by youth_id
                return activePeriods;
            }
        },
        async mounted() {
            let fields = await this.getFields();
            await rb.ref("Youth Profile Placeholders").once('value').then(snapshot => { 
                this.placeholders = snapshot.val();
            })

            if (this.placeholders === {}) { 
                window.alert("Error on getting placeholder text values");
                return null;
            }
            
            for (let i = 0; i < fields["required"].length; i ++) {
                if(fields["required"][i] != "DOB"){
                    this.requiredFields.push({
                        name: fields["required"][i],
                        value: "",
                        type: "textarea",
                        placeholder: this.placeholders[fields["required"][i]]
                    })
                } else {
                  this.requiredFields.push({
                      name: fields["required"][i],
                      value: "",
                      type: "date"
                  })
                }
            }
            for (let i = 0; i < fields["optional"].length; i ++) {
                if(fields["optional"][i] == "Current Grade"){
                    this.optionalFields.push({
                        name: fields["optional"][i],
                        value: "",
                        type: "number"
                    })
                } else if(fields["optional"][i] == "Qualified for free/reduced lunch?"){
                    this.optionalFields.push({
                        name: fields["optional"][i],
                        value: "",
                        type: "checkbox"
                    })
                } else {
                    this.optionalFields.push({
                        name: fields["optional"][i],
                        value: "",
                        type: "textarea",
                        placeholder: this.placeholders[fields["optional"][i]]
                    })
                }
            }
            for (let i = 0; i <fields["hidden"].length; i ++) {
                this.hiddenFields.push({
                    name: fields["hidden"][i],
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

</style>