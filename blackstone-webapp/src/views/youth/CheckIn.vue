// TODO: Moment JS Time deoes not update in real time 
<template>
  <div>
    <top-bar/>
    <h2 style="margin-top: 20px;">
        Check In/Out: {{ date }}
    </h2>
    <br>
    <!-- ID Selector Component -->
    <YouthIDSelector
      @selected="handleSelect"
      style="margin-bottom: 20px;"
      ref="selector"
    />
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
    <b-modal  hide-footer v-model="checkoutModalVisible">
      <template slot="modal-title">
          Hours since checked in: {{ totalHours }}
      </template>
      <div class ="checkout-form">
        <h2 style="text-align: center">Fill out this form to log hours!</h2>
        <div v-for="category in categories" :key="category" class="input-field">
          <p style="text-align: center; margin-bottom:3px">{{category}}</p>
            <VueNumericInput 
              v-model="hours[category]"
              :min="0"
              :step="0.5"
              placeholder="Hours"
              align="center"
              style="width: 20rem"
              :precision="2"
            />
        </div>
        <br>
        <p>Notes</p>
        <input type="text" class="form-control" v-model="notes" placeholder="Leave a note!" style="text-align:center">
      </div>
      <b-button class="mt-3" block @click="closeCheckoutModal" variant="danger">Cancel</b-button>
      <b-button class="mt-3" block @click="handleCheckOut()" variant="success">Confirm for staff review</b-button>
    </b-modal>
    <b-modal id="checkout-status-modal" hide-footer>
      <div v-if="loading" class="text-center text-info my-2">
        <b-spinner class="align-middle"></b-spinner>
        <br>
        <strong>Sending Request...</strong>
      </div>
      <div v-else>
        <template slot="modal-title">
          {{ checkoutStatus.title }}
        </template>
        <div class="d-block text-center">
          {{ checkoutStatus.message}}
        </div>
        <b-button class="mt-3" block @click="$bvModal.hide('checkout-status-modal')">Okay</b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import {db} from '@/firebase.js'
import {rb} from '../../firebase'
import {Timestamp} from '@/firebase.js'
import YouthIDSelector from "@/components/YouthIDSelector.vue"
import moment from 'moment';
import { setTimeout } from 'timers';
import VueNumericInput from 'vue-numeric-input';

export default {
    data() {
        return {
            listenerRef: "",
            checkedInUsers: {},
            selected: false,
            ID: "",
            FirstName: "",
            LastName: "",
            checkoutStatus: {
                title: '',
                message: ''
            },
            checkoutModalVisible: false,
            categories: [],
            hours: {},
            notes: "",
            totalHours: "", 
            date: "",
            time: "",
            overHours: false,
            loading: false
        }
    },
    methods: {
        handleSelect(item) {
          if (item !== null && item !== undefined) {
            this.selected = true
            this.ID = item['ID']
            this.FirstName = item['First Name']
            this.LastName = item['Last Name']
          } else {
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
        handleCheckOut() {
          this.$bvModal.hide('checkout-modal')
          this.loading = true
          this.$bvModal.show('checkout-status-modal')
          this.checkOut().then(_ => {
            this.loading = false
          })
        },
        async checkOut() {
            //TODO: Validation of hours.. or maybe not
            let categoryHourSum = 0
            for (let category in this.hours) { 
                categoryHourSum += this.parseHours(this.hours[category]);
                console.log(this.hours[category])
            }
            
            //add to GlobbalPendingHours
            let period = await db.collection("GlobalVariables").doc("ActivePeriods").get()
            period = period.data()["CurrentPeriod"]
            
            let val = {
                "First Name": this.FirstName,
                "Last Name": this.LastName,
                "Youth ID": this.ID,
                "Notes": this.notes,
            };
            val["Period"] = period
            val["Check In"] = Timestamp.fromDate(moment(this.checkedInUsers[this.ID]["Check In Time"]).toDate());
            val["Check Out"] = Timestamp.fromDate(moment().toDate());

            val = {...val, ...this.hours};
            let status = await db.collection("GlobalPendingHours").doc().set(val);
            if (status) {
                window.alert("Error on adding new entry in GlobalPendingHours")
                return null;
            }

            // add user's pending hours
            let profile = await db.collection("GlobalYouthProfile").doc(this.ID).get();
            profile = profile.data();
            let newPendingHours = Math.round((parseFloat(profile["Pending Hours"]) + categoryHourSum) * 100) / 100;

            await db.collection("GlobalYouthProfile").doc(this.ID).update({
                "Pending Hours": newPendingHours.toString()
            })

            // check user out of realtime database
            await rb.ref('Checked In').child(this.ID).remove().catch(err => {
                    window.alert("Err: " + err);
            })

            this.closeCheckoutModal();

            this.checkoutStatus.title = 'Success'
            this.checkoutStatus.message = 'You have successfully checked out. Your hours have been requested.'

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

        updateTime() {
            this.date = moment().format("dddd, MMM DD YYYY");
            this.time = moment().format("hh:mm a");
            setTimeout(this.updateTime, 1000 * 30)
        }
    },
    computed: {
        isCheckedIn() {
            return !(this.checkedInUsers[this.ID] == null)
        },

        userSelected() {
            return !([this.ID, this.FirstName, this.LastName].includes(""));
        },

    },

    async mounted() {
        this.listenerRef = await rb.ref('Checked In').on("value", snapshot => { 
            if (snapshot.val() == null) this.checkedInUsers = {};
            else this.checkedInUsers = snapshot.val();          
        })

        //Hour Logging categories
        let categories = await db.collection("GlobalVariables").doc("Hour Logging Categories").get();
        categories = categories.data()["Categories"];
        this.categories = categories;

        //set hour logs to be 0 by default
        this.categories.forEach(category => { 
            this.hours[category] = 0;
        })

        this.updateTime();
    },

    beforeDestroy() {
        rb.ref('Checked In').off('value', this.listenerRef)
    },

    components: {
        YouthIDSelector,
        VueNumericInput
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

.checkout-form{
    display: flex;
    flex-direction:column;
    align-items: center
}

.input-field {
    margin-bottom: 1rem
}
</style>
