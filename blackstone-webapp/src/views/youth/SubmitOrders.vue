<template>
    <div class = "YouthSubmitOrders">
        <h3 style="margin: 20px">Submit an order here!</h3>

        <h4 class = "field_msg">Required fields:</h4>
        <YouthIDSelector @selected="selectedID"/>

        <div v-for="field in requiredFields">
            <div class="each_field">
                <textarea v-model="field.value":placeholder="field.name + '*'"></textarea>
            </div>
        </div>

        <h4 class = "field_msg" style="margin-top: 20px">Optional fields:</h4>
        <div v-for="field in optionalFields">
            <div class="each_field">
                <textarea v-model="field.value":placeholder="'field.name'"></textarea>
            </div>
        </div>

        <b-button variant="success" @click="submit" style="margin-top:10px">Submit!</b-button>



        <!--//copied from https://bootstrap-vue.js.org/docs/components/modal/-->
        <b-modal v-model = "modalVisible" hide-footer lazy>
            <template slot="modal-title">
                Order Submitted!
            </template>
            <div class="d-block text-center">
                <h3>Your order has been received!</h3>
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
    import {firebase} from '../../firebase';
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
                YouthProfile: {}
            };

        },
        methods: {
            async getFields() {
                let f = await YouthFieldsRef.get();
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
                    let input = {};
                    input["Status"] = "Pending";
                    let data = this.parse(this.requiredFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }

                    data = this.parse(this.optionalFields);
                    for (let i = 0; i < data.length; i ++) {
                        input[data[i]["name"]] = data[i]["value"];
                    }

                    let submitRef = db.collection("GlobalPendingOrders").doc(new Date().toISOString());
                    submitRef.set(input);

                    //update youth's balance
                    //take away from current hours
                    console.log('a', this.YouthProfile);
                    //Subtract that value from pending hours



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

                let ITC = this.parse(this.requiredFields).find(field => field["name"] === "Item Total Cost");
                if (isNaN(ITC["value"])) ret.push(ITC["name"] + " has to be a number!");

                let YouthID = this.parse(this.requiredFields).find(field => field["name"] === "Youth ID");
                if (!(YouthID["value"] == null || YouthID["value"] === "")) {
                    let YouthProfile = await db.collection("GlobalYouthProfile").doc(YouthID["value"]).get();
                    YouthProfile = YouthProfile.data();
                    if (YouthProfile == null) ret.push("YouthID not found");
                    if (parseFloat(YouthProfile["Current Hours"]) < parseFloat(ITC["value"])) ret.push("Not enough current hours, you have " + YouthProfile["Current Hours"]);
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
            for (let i = 0; i < fields["required"].length; i ++) {
                this.requiredFields.push({
                    name: fields["required"][i],
                    value: ""
                })
            }
            for (let i = 0; i < fields["optional"].length; i ++) {
                this.optionalFields.push({
                    name: fields["optional"][i],
                    value: ""
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
        margin-top: 5px;
    }
    ::placeholder span{
        color: red;
        opacity: 1;
    }
    .field_msg{
        text-decoration: underline;
    }

</style>