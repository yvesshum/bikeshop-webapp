<template>
    <div>
        <top-bar/>
        <h2 style="margin-top: 20px;">
            Check In/Out: {{ date }}
        </h2>
        <br>

        <YouthIDSelector
            @selected="handleSelect"
            style="margin-bottom: 30px;"
        />

        <!-- Check In -->
        <div v-if="selectedUser && !isCheckedIn">
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
        <div v-if="selectedUser && isCheckedIn">
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
//import plugin from '@/plugin.js'
import Vue from 'vue'
import {db} from '@/firebase.js'
import {rb} from '../../firebase'
import YouthIDSelector from "@/components/YouthIDSelector.vue"
import moment from 'moment';

// <label>{{category}}</label>
// <input type="number" class="form-control" :value="hours[category]" placeholder="0">

export default {
    data() {
        return {
            listenerRef: "",
            checkedInUsers: {},
            selectedUser: "",
            categoryHours: [0, 0, 0, 0, 0],
            checkoutStatus: {
                title: '',
                message: ''
            },
            checkoutModalVisible: false,
            categories: [],
            hours: {},
            notes: "",

        }
    },
    methods: {
        handleSelect(item) {
            this.selectedUser = item;
        },
        showCheckoutModal() {
            this.checkoutModalVisible = true;
        },
        closeCheckoutModal() {
            this.checkoutModalVisible = false;
        },
        // currentDateTime(type) {
        //     var d = new Date()
        //     var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        //     var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        //     var day = days[d.getDay()];
        //     var hr = d.getHours();
        //     var min = d.getMinutes();
        //     if (min < 10) {
        //             min = "0" + min;
        //     }
        //     var ampm = " am";
        //     if( hr > 12 ) {
        //             hr -= 12;
        //             ampm = " pm";
        //     }
        //     var date = d.getDate();
        //     var month = months[d.getMonth()];
        //     var year = d.getFullYear();
        //     if (type === 'time') {
        //         return hr + ":" + min + ampm
        //     } else if (type === 'date') {
        //             return day + ', ' + date + " " + month + " " + year;
        //     }
        // },
        checkIn() {
            // check user into realtime database
            let user = this.selectedUser.split(" ");
            let ret = {
                "First Name": user[0],
                "Last Name": user[1],
                "Check In Time": moment().format(),
            }
            rb.ref('Checked In/' + user[2]).set(ret).catch(err => {
                window.alert("Err: " + err);
                return null;
            })
            this.checkoutStatus.title = 'Success'
            this.checkoutStatus.message = 'You have successfully checked in.'
            this.$bvModal.show('checkout-status-modal')
        
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
            let user = this.selectedUser.split(" ")
            let val = {
                "Check In": this.checkedInUsers[user[2]]["Check In Time"],
                "Check Out": moment().format(),
                "First Name": user[0],
                "Last Name": user[1],
                "Youth ID": user[2],
                "Notes": this.notes,
            };
            val = {...val, ...this.hours};
            let status = await db.collection("GlobalPendingHours").doc().set(val);
            if (status) {
                window.alert("Error on adding new entry in GlobalPendingHours")
                return null;
            }

            // add user's pending hours
            let profile = await db.collection("GlobalYouthProfile").doc(user[2]).get();
            profile = profile.data();
            let newPendingHours = parseFloat(profile["Pending Hours"]) + categoryHourSum;

            await db.collection("GlobalYouthProfile").doc(user[2]).update({
                "Pending Hours": newPendingHours
            })

            // check user out of realtime database
            await rb.ref('Checked In').child(user[2]).remove().catch(err => {
                    window.alert("Err: " + err);
            })
           
            this.checkoutStatus.title = 'Success'
            this.checkoutStatus.message = 'You have successfully checked out. Your hours have been requested.'
            this.$bvModal.show('checkout-status-modal')


            // if (categoryHourSum === this.totalHours) {
            //     var promises = []
            //     // check user out of realtime database
            //     promises.push(rb.ref('Checked In').child(this.selectedUserID).remove().catch(err => {
            //         window.alert("Err: " + err);
            //     }))
            //     // check user out of firestore database
            //     promises.push(db.collection('GlobalYouthProfile').doc(this.selectedUserID).update({
            //     lastSignIn: null
            //     }))
            //     promises.push(db.collection('GlobalPendingHours').add({
            //         category1: this.categoryHours[1],
            //         category2: this.categoryHours[2],
            //         category3: this.categoryHours[3],
            //         category4: this.categoryHours[4],
            //         date: Date.now(),
            //         forID: this.selectedUserID,
            //         forName: this.selectedUser['First Name'] + this.selectedUser['Last Name'],
            //         notes: ''
            //     }))
            //     Promise.all(promises).then(() => {
            //     this.checkoutStatus.title = 'Success'
            //     this.checkoutStatus.message = 'You have successfully checked out. Your hours have been requested.'
            //     this.$bvModal.show('checkout-status-modal')
            //     })
            // } else {
            //     this.checkoutStatus.title = 'Oops!'
            //     this.checkoutStatus.message = 'It seems that your category hours don\'t match your total hours. Please try again.'
            //     this.$bvModal.show('checkout-status-modal')
            // }
        }
    },
    computed: {
        totalHours: function() {
            let id = this.selectedUser.split(" ")[2]
            if (this.selectedUser && this.checkedInUsers[id] !== null) {
                let checkInTime = this.checkedInUsers[id]["Check In Time"]
                let diff = moment().diff(moment(checkInTime), 'hours', true);
                diff = Math.round(diff*2)/2; //closest 0.5 hour
                return diff
            } else {
                return null
            }
        },

        isCheckedIn() {
            let id = this.selectedUser.split(" ")[2];
            console.log('t', !(this.checkedInUsers[id] == null));
            return !(this.checkedInUsers[id] == null)
        },

        date() {
            return moment().format("dddd, MMM DD YYYY")
        },

        time() {
            return moment().format("hh:mm a")
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
