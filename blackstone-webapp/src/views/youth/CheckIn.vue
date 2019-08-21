// TODO: Moment JS Time deoes not update in real time 
<template>
    <div>
        <top-bar/>
        <h2 style="margin-top: 20px;">
            Check In/Out: {{ date }}
        </h2>
        <br>

        <YouthIDSelector
            @selected="handleSelect"
            style="margin-bottom: 20px;"
            ref="selector"
        />

        <p>Or fill in the information below</p>

        <b-container block>
            <b-row>
                <b-col>
                    <b-textarea placeholder="ID" style="text-align: center; align-self: center" v-model="ID"></b-textarea>
                </b-col>
                <b-col>
                    <b-textarea placeholder="First Name" style="text-align: center; align-self: center" v-model="FirstName"></b-textarea>
                </b-col>
                <b-col>
                    <b-textarea placeholder="Last Name" style="text-align: center; align-self: center" v-model="LastName"></b-textarea>
                </b-col>
            </b-row>
            
        </b-container>

        <br>

        <!-- Check In -->
        <div v-if="userSelected && !isCheckedIn" >
            <b-button
                class="check-in-out-button"
                @click="checkIn()"
            >
                <h4>
                    Check In
                </h4>
                {{ time }}
            </b-button>
        </div>

        <!-- Check Out -->
        <div v-if="userSelected && isCheckedIn">
            <b-button
                class="check-in-out-button"
                @click="showCheckoutModal"
            >
                <h4>
                    Check Out
                </h4>
                {{ time }}
            </b-button>
            
        </div>


        <!-- Modals -->
        <b-modal hide-footer v-model="checkoutModalVisible">
            <template slot="modal-title">
                Hours since checked in: {{ totalHours }}
            </template>
            <p >Please Enter your hours, round to the nearest 0.5 hours e.g. 0.5, 1.5, 3</p>
            <div class ="form-group">
                <div v-for="category in categories" :key="category">
                    <label class="col-sm-2 col-form-label" >{{category}}</label>
                    <div class="col-sm-10">
                        <input type="number" class="form-control" v-model="hours[category]" placeholder="0">
                    </div>
                </div>
                <br>
                <label class="col-sm-2 col-form-label" >Notes</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" v-model="notes" placeholder="Leave a note!">
                    </div>
            </div>
            <b-button class="mt-3" block @click="closeCheckoutModal" variant="danger">Cancel</b-button>
            <b-button class="mt-3" block @click="checkOut()" variant="success">Confirm</b-button>
        </b-modal>


        <b-modal id="checkout-status-modal" hide-footer>
            <template slot="modal-title">
            {{ checkoutStatus.title }}
            </template>
            <div class="d-block text-center">
            {{ checkoutStatus.message}}
            </div>
            <b-button class="mt-3" block @click="$bvModal.hide('checkout-status-modal')">Okay</b-button>
        </b-modal>

    </div>
</template>

<script>
import {db} from '@/firebase.js'
import {rb} from '../../firebase'
import YouthIDSelector from "@/components/YouthIDSelector.vue"
import moment from 'moment';

export default {
    data() {
        return {
            listenerRef: "",
            checkedInUsers: {},
            selected: false,
            ID: "",
            FirstName: "",
            LastName: "",
            categoryHours: [0, 0, 0, 0, 0],
            checkoutStatus: {
                title: '',
                message: ''
            },
            checkoutModalVisible: false,
            categories: [],
            hours: {},
            notes: "",
            totalHours: "", 


        }
    },
    methods: {
        handleSelect(item) {
            if (item !== null && item !== undefined && item !== "") {
                this.selected = true;
                this.ID = item.split(" ")[2]
                this.FirstName = item.split(" ")[0]
                this.LastName = item.split(" ")[1]
                console.log(this.FirstName, item.split(" "));
            }
            else {
                this.selected = false;
                this.ID = ""
                this.FirstName = ""
                this.LastName = ""
            }
            
        },
        showCheckoutModal() {
            this.getTotalHours();
            this.checkoutModalVisible = true;
        },
        closeCheckoutModal() {
            this.checkoutModalVisible = false;
        },
        async checkIn() {
            //check if ID exists if manual entry
            if (!this.selected) {
                let profile = await db.collection("GlobalYouthProfile").doc(this.ID).get();
                if (profile.data() == null) {
                    this.checkoutStatus.title = 'Error'
                    this.checkoutStatus.message = 'ID not found! Please check again.'
                    this.$bvModal.show('checkout-status-modal')
                    return null;
                }
            }

            // check user into realtime database
            let ret = {
                "First Name": this.FirstName,
                "Last Name": this.LastName,
                "Check In Time": moment().format(),
            }
            rb.ref('Checked In/' + this.ID).set(ret).catch(err => {
                window.alert("Err: " + err);
                return null;
            })
            this.checkoutStatus.title = 'Success'
            this.checkoutStatus.message = 'You have successfully checked in.'
            this.$bvModal.show('checkout-status-modal')
            this.resetInput();
        
        },
        resetInput() {
            this.$refs.selector.reset();
            this.ID = "";
            this.FirstName = "";
            this.LastName = "";
            this.$forceUpdate();
        },

        parseHours(hours) {
            return Math.round(hours*2)/2;
        },
        async checkOut() {
            //TODO: Validation of hours

            this.$bvModal.hide('checkout-modal')
            let categoryHourSum = 0
            for (let category in this.hours) { 
                categoryHourSum += this.parseHours(this.hours[category]);
            }
            
            //add to GlobbalPendingHours
            let val = {
                "Check In": this.checkedInUsers[this.ID]["Check In Time"],
                "Check Out": moment().format(),
                "First Name": this.FirstName,
                "Last Name": this.LastName,
                "Youth ID": this.ID,
                "Notes": this.notes,
            };
            val = {...val, ...this.hours};
            let status = await db.collection("GlobalPendingHours").doc().set(val);
            if (status) {
                window.alert("Error on adding new entry in GlobalPendingHours")
                return null;
            }

            // add user's pending hours
            let profile = await db.collection("GlobalYouthProfile").doc(this.ID).get();
            profile = profile.data();
            let newPendingHours = parseFloat(profile["Pending Hours"]) + categoryHourSum;

            await db.collection("GlobalYouthProfile").doc(this.ID).update({
                "Pending Hours": newPendingHours
            })

            // check user out of realtime database
            await rb.ref('Checked In').child(this.ID).remove().catch(err => {
                    window.alert("Err: " + err);
            })

            this.closeCheckoutModal();
            
           
            this.checkoutStatus.title = 'Success'
            this.checkoutStatus.message = 'You have successfully checked out. Your hours have been requested.'
            this.$bvModal.show('checkout-status-modal')

            this.resetInput();
        },
        getTotalHours() {
            if (this.checkedInUsers[this.ID] !== null) {
                let checkInTime = this.checkedInUsers[this.ID]["Check In Time"]
                let diff = moment().diff(moment(checkInTime), 'hours', true);
                diff = Math.round(diff*2)/2; //closest 0.5 hour
                this.totalHours = diff
            } else {
                this.totalHours = "Error"
            }
        },
    },
    computed: {
        isCheckedIn() {
            return !(this.checkedInUsers[this.ID] == null)
        },

        date() {
            return moment().format("dddd, MMM DD YYYY")
        },

        time() {
            return moment().format("hh:mm a")
        },

        userSelected() {
            return !([this.ID, this.FirstName, this.LastName].includes(""));
        }
    },
    async mounted() {
        this.listenerRef = await rb.ref('Checked In').on("value", snapshot => { 
            if (snapshot.val() == null) this.checkedInUsers = {};
            else this.checkedInUsers = snapshot.val();          
        })

        //Apron Skills Categories
        let categories = await db.collection("ApronSkills").doc("Categories").get();
        categories = Object.keys(categories.data());
        this.categories = categories;

        //set hour logs to be 0 by default
        this.categories.forEach(category => { 
            this.hours[category] = 0;
        })
    },

    beforeDestroy() {
        rb.ref('Checked In').off('value', this.listenerRef)
    },

    components: {
        YouthIDSelector,
    }
}
</script>

<style>
.check-in-out-button {
  height: 150px;
  width: 150px;
  border-radius: 20px;
  outline: none;
  background-color: rgb(243, 255, 255);
}
.check-in-out-button:hover {
  background-color: grey;
}
</style>
