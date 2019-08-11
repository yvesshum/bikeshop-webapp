<template>
    <div class = "YouthSubmitOrders">
        <top-bar/>
        <h3 style="margin: 20px">Submit an order here!</h3>

        <h4 class = "field_msg">Required fields:</h4>
        <YouthIDSelector @selected="selectedID"/>
        <p class = "separator">Or manually input it below</p>
        <div v-for="field in requiredFields">
            <div class="each_field">
                <p class="field_header">{{field.name}}</p>
                <textarea v-model="field.value" :placeholder="field.placeholder"></textarea>
            </div>
        </div>

        <h4 class = "field_msg" style="margin-top: 20px">Optional fields:</h4>
        <div v-for="field in optionalFields">
            <div class="each_field">
                <p class="field_header">{{field.name}}</p>
                <textarea v-model="field.value" :placeholder="field.placeholder"></textarea>
            </div>
        </div>

        <b-button variant="success" @click="submit" style="margin-top:10px">Submit!</b-button>



        <!--//copied from https://bootstrap-vue.js.org/docs/components/modal/-->
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
                <h4 v-for="errors in errorFields">{{errors}}</h4>
            </div>
            <b-button class="mt-3" block @click="closeErrorModal" variant = "primary">Thanks!</b-button>
        </b-modal>

    </div>

</template>

<script>
    import {db} from '../../firebase';
    import {rb} from '../../firebase';
    import YouthIDSelector from "../../components/YouthIDSelector";

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
                    let curName = this.requiredFields[i]["name"];
                    if (curName === "First Name") this.requiredFields[i]["value"] = value.split(" ")[0];
                    else if (curName === "Last Name") this.requiredFields[i]["value"] = value.split(" ")[1];
                    else if (curName === "Youth ID") this.requiredFields[i]["value"] = value.split(" ")[2];
                }
            },

            async submit() {
                //Populate this.YouthProfile with the current youth trying to submit
                let YouthID = this.parse(this.requiredFields).find(field => field["name"] === "Youth ID");
                console.log(YouthID);
                if (!(YouthID["value"] == null || YouthID["value"] === "")) {
                    let YouthProfile = await db.collection("GlobalYouthProfile").doc(YouthID["value"]).get();
                    this.YouthProfile = YouthProfile.data();
                    if (YouthProfile == null) this.errorFields.push("YouthID not found");
                }
                

                let badFields = await this.checkValid();
                //if an error field has been returned
                if (badFields.length) {
                    this.errorFields = badFields;
                    this.showErrorModal();
                }
                else {
                    let input = {};
                    let data = this.parse(this.requiredFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }

                    data = this.parse(this.optionalFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }

                    data = this.parse(this.hiddenFields);
                    for (let i = 0; i < data.length; i++) {
                        if (data[i]["name"] === "Status") input["Status"] = "Pending"
                        else if (data[i]["name"] === "Order Date") input["Order Date"] = new Date().toLocaleDateString();
                        else input[data[i]["name"]] = data[i]["value"];
                    }


                    let submitRef = db.collection("GlobalPendingOrders").doc();
                    let submitResponse = await submitRef.set(input); //if its good there should be nothing returned
                    if (submitResponse) {
                        window.alert("Submit wasn't successful, please check your connection and try again");
                        return null;
                    }

                    //update youth hours with the appropriate value
                    let ITC = this.parse(this.requiredFields).find(field => field["name"] === "Item Total Cost");
                    let newHoursSpent =  parseFloat(this.YouthProfile["Hours Spent"]) + parseFloat(ITC["value"]);
                    let newPendingHours = parseFloat(this.YouthProfile["Pending Hours"]) - parseFloat(ITC["value"]);
                    let youthRef = db.collection("GlobalYouthProfile").doc((this.parse(this.requiredFields).find(field => field["name"] === "Youth ID"))["value"]);
                    youthRef.update({
                        "Hours Spent": newHoursSpent.toString(),
                        "Pending Hours": newPendingHours.toString()
                    }).then(() => {
                        //reset youth profile
                        this.YouthProfile = {};

                        this.showModal();
                    }).catch(error => {
                        window.alert(error);
                    });
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

                let ITC = this.parse(this.requiredFields).find(field => field["name"] === "Item Total Cost");
                if (isNaN(ITC["value"])) ret.push(ITC["name"] + " has to be a number!");
                if (ITC["value"] < 0) ret.push("Item Total Cost has to be a positive number!")

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
            }
        },
        async mounted() {
            let fields = await this.getFields();
            await rb.ref("Submit Orders Placeholders").once('value').then(snapshot => { 
                this.placeholders = snapshot.val();
            })

            if (this.placeholders === {}) { 
                window.alert("Error on getting placeholder text values");
                return null;
            }

            for (let i = 0; i < fields["required"].length; i ++) {
                this.requiredFields.push({
                    name: fields["required"][i],
                    value: "",
                    placeholder: this.placeholders[fields["required"][i]]
                });
            }
            for (let i = 0; i < fields["optional"].length; i ++) {
                this.optionalFields.push({
                    name: fields["optional"][i],
                    value: "",
                    placeholder: this.placeholders[fields["optional"][i]]
                })
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