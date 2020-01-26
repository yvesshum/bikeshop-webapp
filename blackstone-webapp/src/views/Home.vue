<template>
  <div class="home" v-if="ready">
    <top-bar :addPadding="false"/>
    <SpecialInput input="Datetime" :arguments="{}"/>
    <div id="menu_container">
      <div class="heading">
          <h1>Youth</h1>
      </div>
      <div role="tablist" >
        <b-card no-body class="mb-0">
          <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
            <h5 href="#" v-b-toggle.accordion-6>Record and Manage Hours</h5>
          </b-card-header>
          <b-collapse id="accordion-6" accordion="my-accordion" role="tabpanel" :visible="!isStaff">
            <b-card-body>
                <button onclick="location.href='/check-in'" class="btn btn-outline-info btn-block" type="button">Check In/Check Out</button>
                <button onclick="location.href='/profile-lookup'" class="btn btn-outline-info btn-block" type="button">Profile Lookup</button>
                <!-- <button onclick="location.href='/transfer-hours'" class="btn btn-outline-info btn-block" type="button">Transfer Hours Between Youth</button> -->
            </b-card-body>
          </b-collapse>
        </b-card>

        <b-card no-body class="mb-0">
          <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
            <h5 href="#" v-b-toggle.accordion-7>Submit and Check Orders</h5>
          </b-card-header>
          <b-collapse id="accordion-7" accordion="my-accordion" role="tabpanel">
            <b-card-body>
              <button onclick="location.href='/submit-orders'" class="btn btn-outline-info btn-block" type="button">Submit Orders</button>
              <button onclick="location.href='/check-orders'" class="btn btn-outline-info btn-block" type="button">Check Orders</button>
            </b-card-body>
          </b-collapse>
        </b-card>
      </div>

      <div v-if="isStaff" class="staff_view">

      <div class="heading">
          <h1>Staff</h1>
      </div>


      <div role="tablist" >
        <!--
        <b-card no-body class="mb-0">
          <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
            <h5 href="#" v-b-toggle.accordion-1>Youth Activity Management</h5>
          </b-card-header>
          <b-collapse id="accordion-1" accordion="my-accordion" role="tabpanel">
            <b-card-body>
                <button onclick="location.href='/approve-new-youth'" class="btn btn-outline-info btn-block" type="button">Approve New Youth Registration</button>
                <button onclick="location.href=''" class="btn btn-outline-info btn-block" type="button">Approve Returning Youth</button>
                <button onclick="location.href='/manage-skills-staff'" class="btn btn-outline-info btn-block" type="button">Manage Apron Skills</button>
                <button onclick="location.href='/manage-periods'" class="btn btn-outline-info btn-block" type="button">Manage Youth Activity Periods</button>
            </b-card-body>
          </b-collapse>
        </b-card>
      -->

        <b-card no-body class="mb-0">
          <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
            <h5 href="#" v-b-toggle.accordion-2>Approve Youth Activity</h5>
          </b-card-header>
          <b-collapse id="accordion-2" accordion="my-accordion" role="tabpanel">
            <b-card-body>
              <button onclick="location.href='/approve-orders'" class="btn btn-outline-info btn-block" type="button">Approve Orders</button>
              <!-- <button onclick="location.href='/approve-transfers'" class="btn btn-outline-info btn-block" type="button">Approve Hour Transfers</button> -->
              <button onclick="location.href='/approve-hours'" class="btn btn-outline-info btn-block" type="button">Approve Hour Logs</button>
            </b-card-body>
          </b-collapse>
        </b-card>

        <b-card no-body class="mb-0">
          <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
            <h5 href="#" v-b-toggle.accordion-3>Information Lookup</h5>
          </b-card-header>
          <b-collapse id="accordion-3" accordion="my-accordion" role="tabpanel">
            <b-card-body>
              <button onclick="location.href='/checked-in'" class="btn btn-outline-info btn-block" type="button">Currently Checked In</button>
              <button onclick="location.href='/profile-lookup-staff'" class="btn btn-outline-info btn-block" type="button">Profile Lookup and Editing</button>
            </b-card-body>
          </b-collapse>
        </b-card>

        <b-card no-body class="mb-0">
          <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
            <h5 href="#" v-b-toggle.accordion-4>Additional Hour Management Tools</h5>
          </b-card-header>
          <b-collapse id="accordion-4" accordion="my-accordion" role="tabpanel">
            <b-card-body>
              <button onclick="location.href='/add-subtract-hours'" class="btn btn-outline-info btn-block" type="button">Add/Subtract Hours from Youth</button>
              <button onclick="location.href='/log-hours-for-youth'" class="btn btn-outline-info btn-block" type="button">Log Hours for Multiple Youth</button>
            </b-card-body>
          </b-collapse>
        </b-card>

        <!--
        <b-card no-body class="mb-0">
          <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
            <h5 href="#" v-b-toggle.accordion-5>Statistics</h5>
          </b-card-header>
          <b-collapse id="accordion-5" accordion="my-accordion" role="tabpanel">
            <b-card-body>
              <button onclick="location.href='/stats'" class="btn btn-outline-info btn-block" type="button">Stats for the Quarter</button>
            </b-card-body>
          </b-collapse>
        </b-card>
      -->
    </div>

    <div class="heading">
        <h1>Admin</h1>
    </div>
    <div role="tablist" >
      <b-card no-body class="mb-0">
        <b-card-header header-tag="header" class="p-1 bg-success" role="tab">
          <h5 href="#" v-b-toggle.accordion-8>Admin Panel</h5>
        </b-card-header>
        <b-collapse id="accordion-8" accordion="my-accordion" role="tabpanel">
          <b-card-body>
            <button onclick="location.href='/youth-order-settings'" class="btn btn-outline-success btn-block" type="button">Youth Order Form</button>
            <button onclick="location.href='/youth-profile-staff-settings'" class="btn btn-outline-success btn-block" type="button">Youth Profile and Registration</button>
            <button onclick="location.href='/hour-logging-categories-settings'" class="btn btn-outline-success btn-block" type="button">Hour Logging Categories</button>
            <!-- <button onclick="location.href='/apron-colors-settings'" class="btn btn-outline-success btn-block" type="button">Apron Colors</button> -->
            <button onclick="location.href='/period-settings'" class="btn btn-outline-success btn-block" type="button">Period Settings</button>

          </b-card-body>
        </b-collapse>
      </b-card>
  </div>
    </div>
</div>
<footer>
    <p class="copyright">Blackstone Bicycle Works © 2019, version 0.1a</p>
</footer>
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
          isStaff: false,
          ready: false
      }
  },
  methods: {
  },
  async mounted() {
        const currentUser = await firebase.auth().currentUser;
        console.log('c', currentUser.email);
        if (currentUser) {
            if (currentUser.email === "staff@blackstonebikes.com") {
                this.isStaff = true;
            }
        }
        console.log(this.isStaff);
        this.ready = true;

  }
}
</script>

<style>
a, a:hover, a:active, a:link {
  color:inherit;
  text-decoration: none;
 }

h5 {
  padding: 0.5rem;
  color: white;
  cursor: pointer;
}

h5:hover {
  text-decoration: underline;
}

.heading {
  margin-top: 1.5rem;
  padding: 1rem;
  color: black;
}

.home {
  justify-content: center;
  text-align: center;
  background-image: url("../assets/Bike_Stock.jpg");
  background-size: 100%;
  background-attachment: fixed;
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

footer {
  background-color: #fff;
  color: grey;
  padding: 2rem;
}

h4 {
  color: black;
}

#menu_container {
  padding-top: 6rem;
  margin: auto;
  max-width: 750px;
  background-color: #ffffff;
}

</style>
