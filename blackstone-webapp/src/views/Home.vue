<template>
  <div class="home">
    <top-bar/>
    <SpecialInput input="Datetime" :arguments="{}"/>
    <br>
    <div>
        <div class="heading">
            <h1>Youth Pages</h1>
        </div>
        <div class="options">
            <a href="/check-in">
                <button class="page">
                <h4>Check In/Check Out</h4>
                <p>Youth's check-in/check-out page</p>
                </button>
            </a>
            <a href="/profile-lookup">
                <button class="page">
                    <h4>Profile Lookup</h4>
                    <p>Youth's profile lookup tool</p>
                </button>
            </a>
            <a href="/submit-orders">
                <button class="page">
                    <h4>Submit Orders</h4>
                    <p>Submit an item order</p>
                </button>
            </a>
            <a href="/check-orders">
                <button class="page">
                    <h4>Check Orders</h4>
                    <p>Check placed orders</p>
                </button>
            </a>
            <a href="/transfer-hours">
                <button class="page">
                    <h4>Transfer Hours</h4>
                    <p>Request to transfer hours</p>
                </button>
            </a>

        </div>

        <div v-if="isStaff">
            <div class="heading">
            <h1>Staff Pages</h1>
            </div>

            <div class="options">
                <a href="/approve-orders">
                    <button class="page">
                        <h4>Approve Orders</h4>
                        <p>Check status, approve, complete, orders</p>
                    </button>
                </a>
                <a href="/checked-in">
                    <button class="page">
                        <h4>Currently Checked In</h4>
                        <p>See who's currently checked in</p>
                    </button>
                </a>
                <a href="/manage-skills-staff">
                    <button class="page">
                        <h4>Manage Apron Skills</h4>
                        <p>Add, remove, and edit skills</p>
                    </button>
                </a>

                <a href="/register-new-youth">
                <button class="page">
                    <h4>Register New Youth</h4>
                    <p>Register a new youth volunteer</p>
                </button>
                </a>

                <a href="/profile-lookup-staff">
                <button class="page">
                    <h4>Profile Lookup and Editing</h4>
                    <p>Staff's profile lookup tool</p>
                </button>
                </a>

                <a href="/approve-hours">
                    <button class="page">
                    <h4>Approve Hour Logs</h4>
                    <p>Approve or reject a youth's logged hours</p>
                    </button>
                </a>

                <a href="/approve-transfers">
                    <button class="page">
                        <h4>Approve Hour Transfers</h4>
                        <p>Approve or reject hour transfer requests</p>
                    </button>
                </a>

                <a href="/manage-periods">
                    <button class="page">
                        <h4>Manage Periods</h4>
                        <p>Manage which youth are active during which periods</p>
                    </button>
                </a>

                <a href="/add-subtract-hours">
                    <button class="page">
                        <h4>Add/Subtract Hours</h4>
                        <p>Give or take away hours from youth</p>
                    </button>
                </a>

                <a href="/log-hours-for-youth">
                    <button class="page">
                        <h4>Log hours for youth</h4>
                        <p>Log hours for one or more youth</p>
                    </button>
                </a>
                <a href="/stats">
                    <button class="page">
                        <h4>Stats for this quarter</h4>
                        <p>View various statistics</p>
                    </button>
                </a>

            </div>

            <div class="heading">
                <h1>Admin Panel</h1>
            </div>

            <div class="options">
            <a href="/admin-panel">
                    <button class="page">
                        <h4>Admin Panel</h4>
                        <p>Change various settings here!</p>
                    </button>
                </a>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import SpecialInput from '../components/SpecialInput.vue'
import {firebase} from '@/firebase.js';

export default {
  name: 'home',
  components: {
    SpecialInput
  },
  data() {
      return {
          isStaff: false
      }
  },
  methods: {
  },
  async mounted() { 
        const currentUser = await firebase.auth().currentUser;
        console.log('c', currentUser.email);
        if (currentUser) {
            if (currentUser.email === "yvesshum@uchicago.edu") {
                this.isStaff = true;
            }
        }
        console.log(this.isStaff);
    
  }
}
</script>

<style>
.heading {
  padding-top: 1rem;
  color: black;
}

.options {
  margin: 1rem;
}

.page {
  display: inline;
  margin: 0.5rem;
  border-radius: 0.5rem;
  border: 0.1rem solid lightblue;
  color: #007399;
  width: 20rem;
  height: 8rem;
}

h4 {
  color: black;
}

</style>
