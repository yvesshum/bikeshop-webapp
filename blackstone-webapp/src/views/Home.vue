<template>
    <div class="home" v-if="ready">
        <div class="content">
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
                                    <button onclick="location.href='/transfer-hours'" class="btn btn-outline-info btn-block" type="button">Transfer Hours Between Youth</button>
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
                        
                        <b-card no-body class="mb-0">
                            <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
                                <h5 href="#" v-b-toggle.accordion-1>Youth Activity Management</h5>
                            </b-card-header>
                            <b-collapse id="accordion-1" accordion="my-accordion" role="tabpanel">
                                <b-card-body>
                                        <button onclick="location.href='/approve-youth-registration'" class="btn btn-outline-info btn-block" type="button">Approve Youth Registration</button>
                                        <!-- <button onclick="location.href=''" class="btn btn-outline-info btn-block" type="button">Approve Returning Youth</button>-->
                                        <button onclick="location.href='/manage-skills-staff'" class="btn btn-outline-info btn-block" type="button">Manage Apron Skills</button>
                                        <button onclick="location.href='/manage-periods'" class="btn btn-outline-info btn-block" type="button">Manage Youth Activity Periods</button>
                                </b-card-body>
                            </b-collapse>
                        </b-card>
                

                        <b-card no-body class="mb-0">
                            <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
                                <h5 href="#" v-b-toggle.accordion-2>Approve Youth Activity</h5>
                            </b-card-header>
                            <b-collapse id="accordion-2" accordion="my-accordion" role="tabpanel">
                                <b-card-body>
                                    <button onclick="location.href='/approve-orders'" class="btn btn-outline-info btn-block" type="button">Approve Orders</button>
                                    <button onclick="location.href='/approve-transfers'" class="btn btn-outline-info btn-block" type="button">Approve Hour Transfers</button>
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
                                    <button onclick="location.href='/email-lookup'" class="btn btn-outline-info btn-block" type="button">Email lookup</button>

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

                        <b-card no-body class="mb-0">
                            <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
                                <h5 href="#" v-b-toggle.accordion-6>Blog</h5>
                            </b-card-header>
                            <b-collapse id="accordion-6" accordion="my-accordion" role="tabpanel">
                                <b-card-body>
                                    <button onclick="location.href='/blog-page-manager'" class="btn btn-outline-info btn-block" type="button">Blog page manager</button>
                                </b-card-body>
                            </b-collapse>
                        </b-card>
                
                    </div>
                </div>

                <div v-if="isAdmin">
                    <div class="heading">
                        <h1>Admin</h1>
                    </div>
                    <div role="tablist" >
                        <b-card no-body class="mb-0">
                            <b-card-header header-tag="header" class="p-1 bg-success" role="tab">
                                <h5 href="#" v-b-toggle.accordion-8>Modify Youth Registration</h5>
                            </b-card-header>
                            <b-collapse id="accordion-8" accordion="my-accordion" role="tabpanel">
                                <b-card-body>
                                    <button onclick="location.href='/youth-profile-staff-settings'" class="btn btn-outline-success btn-block" type="button">Youth Profile and Registration fields</button>
                                    <button onclick="location.href='/period-settings'" class="btn btn-outline-success btn-block" type="button">Set Current Period Settings</button>
                                    <button onclick="location.href='/essay-questions-settings'" class="btn btn-outline-success btn-block" type="button">Manage Essay Questions</button>
                                    <button onclick="location.href='/class-settings'" class="btn btn-outline-success btn-block" type="button">Manage Class Settings</button>
                                </b-card-body>
                            </b-collapse>
                        </b-card>

                        <b-card no-body class="mb-0">
                            <b-card-header header-tag="header" class="p-1 bg-success" role="tab">
                                <h5 href="#" v-b-toggle.accordion-9>Modify Youth Activity</h5>
                            </b-card-header>
                            <b-collapse id="accordion-9" accordion="my-accordion" role="tabpanel">
                                <b-card-body>
                                    <button onclick="location.href='/youth-order-settings'" class="btn btn-outline-success btn-block" type="button">Youth Order Form fields</button>
                                    <button onclick="location.href='/hour-logging-categories-settings'" class="btn btn-outline-success btn-block" type="button">Hour Logging Categories</button>
                                    <button onclick="location.href='/apron-colors-settings'" class="btn btn-outline-success btn-block" type="button">Create/Edit Apron Colors</button>
                                </b-card-body>
                            </b-collapse>
                        </b-card>

                        <b-card no-body class="mb-0">
                            <b-card-header header-tag="header" class="p-1 bg-success" role="tab">
                                <h5 href="#" v-b-toggle.accordion-10>Change Page Description</h5>
                            </b-card-header>
                            <b-collapse id="accordion-10" accordion="my-accordion" role="tabpanel">
                                <b-card-body>
                                    <button onclick="location.href='/page-headers'" class="btn btn-outline-success btn-block" type="button">Set Page Headers</button>
                                </b-card-body>
                            </b-collapse>
                        </b-card>
                    </div>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script>
import SpecialInput from '../components/SpecialInput.vue'
import {firebase} from '@/firebase.js';
import {isStaff, isAdmin} from '../scripts/getPrivilege'
export default {
        name: 'home',
        components: {
                SpecialInput
        },
        data() {
            return {
                isStaff: false,
                isAdmin: false,
                ready: false
            }
        },
        methods: {
        },
        async mounted() {
            this.isStaff = await isStaff()
            this.isAdmin = await isAdmin()
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
