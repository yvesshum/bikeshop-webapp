<template>
  <div>
    <h3 style="margin-top: 20px;">
      Check In/Out: {{ currentDateTime('date')}}
    </h3>
    <YouthIDSelector
      @selected="handleSelect"
      style="margin-bottom: 30px;"
    />
    <div v-if="selectedUser">
      <b-button
        v-if="this.selectedUser['Last Sign In'] !== undefined"
        class="check-in-out-button"
        @click="$bvModal.show('checkout-modal')"
      >
        <h4>
          Check Out
        </h4>
        {{ currentDateTime('time') }}
      </b-button>
      <b-button
        v-else
        class="check-in-out-button"
        @click="checkIn()"
      >
        <h4>
          Check In
        </h4>
        {{ currentDateTime('time') }}
      </b-button>
    </div>
    <div>
      <b-modal id="checkout-modal" hide-footer>
        <template slot="modal-title">
          Total Hours: {{ totalHours }}
        </template>
        <div class="d-block text-center">
          Category 1: <b-form-input v-model="categoryHours[1]" placeholder="Enter hours"></b-form-input><br>
          Category 2: <b-form-input v-model="categoryHours[2]" placeholder="Enter hours"></b-form-input><br>
          Category 3: <b-form-input v-model="categoryHours[3]" placeholder="Enter hours"></b-form-input><br>
          Category 4: <b-form-input v-model="categoryHours[4]" placeholder="Enter hours"></b-form-input><br>
        </div>
        <b-button class="mt-3" block @click="$bvModal.hide('checkout-modal')" variant="danger">Cancel</b-button>
        <b-button class="mt-3" block @click="checkOut()" variant="success">Confirm</b-button>
      </b-modal>
    </div>
    <div>
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
  </div>
</template>

<script>
//import plugin from '@/plugin.js'
import Vue from 'vue'
import {db} from '@/firebase.js'
import {rb} from '../../firebase'
import YouthIDSelector from "@/components/YouthIDSelector.vue"
//Vue.use(plugin, {})
export default {
  data() {
    return {
      allUsers: [],
      searchFilter:'',
      selectedUser: null,
      selectedUserID: null,
      categoryHours: [0, 0, 0, 0, 0],
      checkoutStatus: {
        title: '',
        message: ''
      }
    }
  },
  methods: {
    handleSelect(item) {
      if (item) {
        this.selectedUserID = item.slice(item.lastIndexOf(' ')+1)
        db.collection('GlobalYouthProfile').doc(this.selectedUserID).get().then(doc => {
          this.selectedUser = doc.data()
          console.log("user:", this.selectedUser['Last Sign In'] === undefined)
        })
      } else {
        this.selectedUser = null
        this.selecteUserId = null
      }
    },
    checkOutModal() {
    },
    currentDateTime(type) {
      var d = new Date()
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var day = days[d.getDay()];
      var hr = d.getHours();
      var min = d.getMinutes();
      if (min < 10) {
          min = "0" + min;
      }
      var ampm = " am";
      if( hr > 12 ) {
          hr -= 12;
          ampm = " pm";
      }
      var date = d.getDate();
      var month = months[d.getMonth()];
      var year = d.getFullYear();
      if (type === 'time') {
        return hr + ":" + min + ampm
      } else if (type === 'date') {
        return day + ', ' + date + " " + month + " " + year;
      }
    },
    checkIn() {
      var promises = []
      // check user into firestore database
      promises.push(db.collection('GlobalYouthProfile').doc(this.selectedUserID).update({
        "Last Sign In": Date.now()
      }))
      // check user into realtime database
      promises.push(rb.ref('Checked In').child(this.selectedUserID).set({
          "First Name": this.selectedUser['First Name'],
          "Last Name": this.selectedUser['Last Name'],
          "Check In Time": new Date().toLocaleString(),
      }).catch(err => {
          window.alert("Err: " + err);
      }))
      Promise.all(promises).then(() => {
        this.checkoutStatus.title = 'Success'
        this.checkoutStatus.message = 'You have successfully checked in.'
        this.$bvModal.show('checkout-status-modal')
      })
    },
    checkOut() {
      this.$bvModal.hide('checkout-modal')
      var categoryHourSum = 0
      this.categoryHours.forEach(x => {
        categoryHourSum = categoryHourSum + parseInt(x)
      })
      console.log(categoryHourSum)
      console.log(this.totalHours)
      if (categoryHourSum === this.totalHours) {
        var promises = []
        // check user out of realtime database
        promises.push(rb.ref('Checked In').child(this.selectedUserID).remove().catch(err => {
            window.alert("Err: " + err);
        }))
        // check user out of firestore database
        promises.push(db.collection('GlobalYouthProfile').doc(this.selectedUserID).update({
          lastSignIn: null
        }))
        promises.push(db.collection('GlobalPendingHours').add({
          category1: this.categoryHours[1],
          category2: this.categoryHours[2],
          category3: this.categoryHours[3],
          category4: this.categoryHours[4],
          date: Date.now(),
          forID: this.selectedUserID,
          forName: this.selectedUser['First Name'] + this.selectedUser['Last Name'],
          notes: ''
        }))
        Promise.all(promises).then(() => {
          this.checkoutStatus.title = 'Success'
          this.checkoutStatus.message = 'You have successfully checked out. Your hours have been requested.'
          this.$bvModal.show('checkout-status-modal')
        })
      } else {
        this.checkoutStatus.title = 'Oops!'
        this.checkoutStatus.message = 'It seems that your category hours don\'t match your total hours. Please try again.'
        this.$bvModal.show('checkout-status-modal')
      }
    }
  },
  computed: {
    totalHours() {
      if (this.selectedUser) {
        return Math.round((Date.now() - this.selectedUser.lastSignIn)/(1000*3600))
      } else {
        return null
      }
    }
  },
  mounted() {
    db.collection('GlobalYouthProfile').get().then(snapshot => {
        snapshot.docs.forEach(doc => {
          const user = {
            firstName: doc.data()["First Name"],
            lastName: doc.data()["Last Name"],
            lastSignIn: doc.data()["Last Sign In"],
            userId: doc.id
          }
          this.allUsers.push(user)
        })
      })
  },
  components: {
    YouthIDSelector
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
