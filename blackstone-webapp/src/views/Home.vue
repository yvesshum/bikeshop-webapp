<template>
    <div class="home">
        <top-bar/>
        <br>
        <b-container>
            <b-row>
                <b-col>
                    <h1>Youth Pages</h1>
                </b-col>

            </b-row>

            <b-row>
                <b-col>
                    <b-card-group deck>

                        <a href="/check-in">
                            <b-card
                                    title="Check In"
                                    style="max-width: 20rem;"
                                    class="mb-2"
                            >
                                <b-card-text>
                                    Youth's check-in page.
                                </b-card-text>
                            </b-card>
                        </a>

                        <a href="/profile-lookup">
                            <b-card
                                    title="Profile Lookup"
                                    style="max-width: 20rem;"
                                    class="mb-2"
                            >
                                <b-card-text>
                                    Youth's profile lookup tool
                                </b-card-text>
                            </b-card>
                        </a>

                        <a href="/submit-orders">
                            <b-card
                                    title="Submit Orders"
                                    style="max-width: 20rem;"
                                    class="mb-2"
                            >
                                <b-card-text>
                                    Submit an item order
                                </b-card-text>
                            </b-card>
                        </a>

                        <a href="/check-orders">
                            <b-card
                                    title="Check Orders"
                                    style="max-width: 20rem;"
                                    class="mb-2"
                            >
                                <b-card-text>
                                    Check placed orders
                                </b-card-text>
                            </b-card>
                        </a>

                    </b-card-group>
                </b-col>
            </b-row>

            <b-row>
                <b-col>
                    <h1>Staff Pages</h1>
                </b-col>

            </b-row>

            <b-row>
                <b-col>
                    <b-card-group deck>
                        <a href="/approve-orders">
                            <b-card
                                    title="Approve Orders"
                                    style="max-width: 20rem;"
                                    class="mb-2"
                            >
                                <b-card-text>
                                    Check status, approve, complete, orders
                                </b-card-text>
                            </b-card>
                        </a>

                        <a href="/checked-in">
                            <b-card
                                    title="Currently Checked In"
                                    style="max-width: 20rem;"
                                    class="mb-2"
                            >
                                <b-card-text>
                                    See who's currently checked in
                                </b-card-text>
                            </b-card>
                        </a>
                        
                        <a href="/manage-skills-staff">
                            <b-card
                                title="Manage Apron Skills"
                                style="max-width: 20rem;"
                                class="mb-2"
                            >
                                <b-card-text>
                                    Add, remove, and edit skills
                                </b-card-text>
                            </b-card>
                        </a>
                    </b-card-group>
                </b-col>

            </b-row>
        </b-container>


    </div>
</template>

<script>
    export default {
        name: 'home',
        components: {
        },
        methods: {

        }
    }
</script>

<style>
</style>
