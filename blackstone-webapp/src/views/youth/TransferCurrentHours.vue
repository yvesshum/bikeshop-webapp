<!--
Transfer Hours, useful for Youths who want to transfer their hours to/from other youths.
To prevent Youths from griefing other people, this page only submits a transfer request, to `GlobalTransferHours`,
for a staff member to approve.

(As it is current configure, it is possible to transfer hours to yourself, at the expense of your own Hours)

Youths have the ability to select their hours from a incrementer
Youth can also put down an optional note for staff to see.

When the submit button is clicked, a modal should appear to indicate the status of their action. This page makes sure that
the Youth has enough Hours to transfer.

In firebase the following things happen:
- GlobalYouthProfile: The 'from' Youth has Hours Spent increased, and Pending Hours decreased
                      The 'to' Youth has Pending Hours increased
- GlobalTransferHours has a new record of the transaction, waiting to be approved
-->
<template>
    <div id = "TransferHours">
        <div class="content">
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
                        <YouthIDSelector ref="selectedFrom" @selected="selectedFrom" style="margin-bottom: 10px" periods="all"/>
                        <br>
                    </b-row>
                </b-col>
                <b-col>
                    <b-row>
                        <YouthIDSelector ref="selectedTo" @selected="selectedTo" style="margin-bottom: 10px" periods="all"/>
                    </b-row>
                </b-col>
            </b-row>
            <b-row>
                <br>
            </b-row>
            <b-row>
                <b-col align="center">
                    <VueNumberInput
                        center
                        v-model="value"
                        :min="1"
                        placeholder="Amount to transfer"
                        align="center"
                        :step="0.5"
                        style="width: 20rem"
                        controls
                        ref="hoursInput"
                        :inputtable="false"
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
        <Footer/>
    </div>

</template>

<script>
    import YouthIDSelector from '../../components/YouthIDSelector';
    import VueNumberInput from '@chenfengyuan/vue-number-input';
    import {db} from '../../firebase';
    import {Timestamp} from '@/firebase.js'
    export default {
        name: 'HourTransfer',
        components: {
            YouthIDSelector,
            VueNumberInput
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

                if (fromID == null || toID == null) {
                    this.showModal("Error", "Please select/enter an ID for both 'To' and 'From'");
                    return null;
                } else if (fromID === toID) {
                    this.showModal("Error", "You can't transfer to yourself!");
                    return null;
                }
                else {
                    this.showLoadingModal("Checking if this transaction is valid...");
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
                        let metadata = await db.collection("GlobalPeriods").doc("metadata").get();
                        let period = metadata.data()["CurrentPeriod"];
                        let request_status = await db.collection("GlobalTransferHours").doc().set({
                            "From ID": fromID,
                            "To ID": toID,
                            "From Name": fromYouthProfile["First Name"] + " " +  fromYouthProfile["Last Name"],
                            "To Name": toYouthProfile["First Name"] + " " + toYouthProfile["Last Name"],
                            "Amount": amount,
                            "Date": Timestamp.fromDate(new Date()),
                            "Notes": this.note,
                            "Period": period
                        })
                        if (request_status) {
                            window.alert("Err: ", request_status)
                            return null;
                        }

                        //transfer the hours into pending
                        let newToPendingHours = parseFloat(toYouthProfile["Pending Hours"]) + amount;
                        let newFromPendingHours = parseFloat(fromYouthProfile["Pending Hours"]) - amount;
                        let newFromHoursSpent = parseFloat(fromYouthProfile["Hours Spent"]) + amount;

                        let status1 = await db.collection("GlobalYouthProfile").doc(toID).update({
                            "Pending Hours": newToPendingHours
                        });

                        let status2 = await db.collection("GlobalYouthProfile").doc(fromID).update({
                            "Pending Hours": newFromPendingHours,
                            "Hours Spent": newFromHoursSpent
                        });

                        if (status1 || status2) {
                            window.alert("Err1: " + status1 + " Err2: " + status2);
                            return null;
                        }

                        this.closeLoadingModal();
                        this.$refs.selectedFrom.reset();
                        this.$refs.selectedTo.reset();
                        this.$refs.hoursInput.setValue(1)

                        this.showModal("Success!", "Your request has been sent for staff approval")
                    }
                    else {
                        this.closeLoadingModal();
                        this.showModal("Error", "The sender does not have enough hours! They only have " + currentHours.toString() + " hours.");
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
    }
</script>
