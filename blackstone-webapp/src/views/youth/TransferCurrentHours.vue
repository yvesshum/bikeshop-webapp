// TODO: Remove Manual Entry, configure YouthIDSelector to draw from all 
<template>
    <div id = "TransferHours">
        <top-bar/>
        <br>
        <b-container>
            <b-row>
                <b-col>
                    <h1>Transfer Hours</h1>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <h2>From:</h2>
                </b-col>
                <b-col>
                    <h2>To:</h2>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <b-row>
                        <YouthIDSelector @selected="selectedFrom" style="margin-bottom: 10px" periods="all"/>
                        <br>
                    </b-row>
                </b-col>
                <b-col>
                    <b-row>
                        <YouthIDSelector @selected="selectedTo" style="margin-bottom: 10px" periods="all"/>
                    </b-row>
                </b-col>
            </b-row>
            <b-row>
                <br>
            </b-row>
            <b-row>
                <b-col>
                    <VueNumericInput
                            v-model="value"
                            :min="1"
                            placeholder="Amount to transfer"
                            align="center"
                    />
                </b-col>
            </b-row>
            <b-row>
                <br>
            </b-row>
            <b-row>
                <b-col>
                    <b-form-textarea v-model="note"
                                     placeholder="Enter an optional note for staff"
                                     rows="3"
                                     max-rows="6"
                                     size="sm"
                                     style="text-align: center"
                    ></b-form-textarea>
                </b-col>
            </b-row>
            <b-row>
                <br>
            </b-row>
            <b-row>
                <b-col>
                    <b-button variant="success" @click="submit">{{submitMsg}}</b-button>
                </b-col>
            </b-row>
        </b-container>

        <b-modal v-model = "modalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{modalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{modalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">ok!</b-button>
        </b-modal>

        <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                {{loadingModalHeader}}
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
    import YouthIDSelector from '../../components/YouthIDSelector';
    import VueNumericInput from 'vue-numeric-input';
    import {db} from '../../firebase';
    import {Timestamp} from '@/firebase.js'
    export default {
        name: 'HourTransfer',
        components: {
            YouthIDSelector,
            VueNumericInput

        },

        data() {
            return {
                modalVisible: false,
                modalHeader: "",
                modalMsg: "",
                toSelector: {},
                fromSelector: {},
                value: 1,
                loadingModalVisible: false,
                loadingModalHeader: "",
                note: "",
                // fromInput: "",
                // toInput: "",
                submitMsg: "Submit order for staff review!",
            }
        },

        methods: {
            showModal(title, msg) {
                this.modalVisible = true;
                this.modalHeader = title;
                this.modalMsg = msg;
            },

            closeModal() {
                this.modalVisible = false;
            },

            async submit() {
                let amount = this.value;
                let fromID;
                let toID;

                //selecting from which input it is
                fromID = this.fromSelector["ID"]
                toID   = this.toSelector["ID"]

                if (fromID == "" && toID == "") {
                    this.showModal("Error", "Please select/enter an ID for both 'To' and 'From'");
                }
                else {
                    this.showLoadingModal("One second..");
                    //check if from user has sufficient credits for the amount
                    let fromYouthProfile = await db.collection("GlobalYouthProfile").doc(fromID).get();
                    let toYouthProfile = await db.collection("GlobalYouthProfile").doc(toID).get();
                    if (fromYouthProfile.data() == null) {
                        this.closeLoadingModal();
                        this.showModal("Error", "Sender Youth Profile not found");
                        return null;
                    }
                    if (toYouthProfile.data() == null) {
                        this.closeLoadingModal();
                        this.showModal("Error", "Recipient Youth Profile not found");
                        return null;
                    }

                    fromYouthProfile = fromYouthProfile.data();
                    toYouthProfile = toYouthProfile.data();

                    let currentHours = parseFloat(fromYouthProfile["Hours Earned"]) - parseFloat(fromYouthProfile["Hours Spent"]);
                    if (currentHours >= amount) {
                        //create request for it

                        //Attaching current period 
                        let period = await db.collection("GlobalVariables").doc("ActivePeriods").get()
                        period = period.data()["CurrentPeriod"]

                        db.collection("GlobalTransferHours").doc().set({
                            "From ID": fromID,
                            "To ID": toID,
                            "From Name": fromYouthProfile["First Name"] + " " +  fromYouthProfile["Last Name"],
                            "To Name": toYouthProfile["First Name"] + " " + toYouthProfile["Last Name"],
                            "Amount": amount,
                            "Date": Timestamp.fromDate(new Date()),
                            "Notes": this.note,
                            "Period": period
                        }).catch(err => {
                           window.alert("Err: " + err);
                           return null;
                        });

                        //transfer the hours into pending
                        let newToPendingHours = parseFloat(toYouthProfile["Pending Hours"]) + amount;
                        let newFromPendingHours = parseFloat(fromYouthProfile["Pending Hours"]) - amount;
                        let newFromHoursSpent = parseFloat(fromYouthProfile["Hours Spent"]) + amount;

                        let status1 = await db.collection("GlobalYouthProfile").doc(toID).update({
                            "Pending Hours": newToPendingHours.toString()
                        });

                        let status2 = await db.collection("GlobalYouthProfile").doc(fromID).update({
                            "Pending Hours": newFromPendingHours.toString(),
                            "Hours Spent": newFromHoursSpent.toString()
                        });

                        if (status1 || status2) {
                            window.alert("Err1: " + status1 + " Err2: " + status2);
                            return null;
                        }

                        this.closeLoadingModal();
                        this.showModal("Success!", "Your request has been sent for staff approval")
                    }
                    else {
                        this.closeLoadingModal();
                        this.showModal("Error", "From user does not have enough hours! They only have: " + currentHours.toString());
                    }



                }

            },

            selectedFrom(value) {
                this.fromSelector = value;
            },

            selectedTo(value) {
                this.toSelector = value;
            },

            showLoadingModal(msg) {
                this.loadingModalVisible = true;
                this.loadingModalHeader = msg;
            },

            closeLoadingModal() {
                this.loadingModalVisible = false;
            },




        },

        async mounted() {

        }
    }
</script>

<style>

</style>