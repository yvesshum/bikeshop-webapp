<template>
    <div class = "YouthSubmitOrders">
        <h3 style="margin: 20px">Submit an order here!</h3>

        <h4 class = "field_msg">Required fields:</h4>
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
            <b-button class="mt-3" block @click="closeModal">Thanks!</b-button>
        </b-modal>

        <b-modal v-model = "errorModalVisible" hide-footer lazy>
            <template slot="modal-title">
                Error!
            </template>
            <div class="d-block text-center">
                <h3>The following fields have errors!</h3>
                <h4 v-for="errors in errorFields">{{errors}}</h4>
            </div>
            <b-button class="mt-3" block @click="closeErrorModal">Thanks!</b-button>
        </b-modal>

    </div>

</template>

<script>
    import {db} from '../../firebase';

    let YouthFieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Order Form");

    export default {
        name: 'YouthSubmitOrders',
        components: {
        },
        data() {
            return {
                requiredFields: [], //[{name: "YouthID", value =""}, {name: "ItemID", value = ""}]
                optionalFields: [],
                hiddenFields: [],
                modalVisible: false,
                errorModalVisible: false,
                errorFields: [] //list of messages to be shown as errors
            };

        },
        methods: {
            async getFields() {
                let f = await YouthFieldsRef.get();
                return f.data();
            },

            submit() {
                //if an error field has been returned
                let badFields = this.checkValid();
                if (badFields.length) {
                    this.errorFields = badFields;
                    this.showErrorModal();
                }
                else {
                    //TODO: if user does have sufficient hours, then post it
                    console.log('showing modal..');
                    this.showModal();
                }
            },

            //returns an array of fields that are not valid
            checkValid() {
                let ret = [];
                //loop over required fields, check that they are at least filled in
                for (let i = 0; i < this.requiredFields.length; i++) {
                    let currentField = this.requiredFields[i];
                    //if it is of length 0
                    if (!currentField["value"].length) {
                        ret.push(currentField["name"]);
                    }

                    //any other checks
                    if (currentField["name"] === "Item Total Cost" && isNaN(currentField["name"]["value"])) {
                        ret.push(currentField["name"] + " has to be a number!");
                    }

                    //TODO: check if the user has sufficient current hours to be deducted
                    //TODO: check if user exists first
                }
                return ret;
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
            console.log(fields);
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
        width: 20%;
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