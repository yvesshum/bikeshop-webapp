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
                        <b-card
                            title="Check In"
                            style="max-width: 20rem;"
                            class="mb-2"
                        >
                            <b-card-text>
                                Youth's check-in page.
                            </b-card-text>

                            <b-button href="/check-in" variant="primry">Click me!</b-button>
                        </b-card>

                        <b-card
                            title="Profile Lookup"
                            style="max-width: 20rem;"
                            class="mb-2"
                        >
                            <b-card-text>
                                Youth's profile lookup tool
                            </b-card-text>

                            <b-button href="/profile-lookup" variant="primry">Click me!</b-button>
                        </b-card>


                        <b-card
                            title="Submit Orders"
                            style="max-width: 20rem;"
                            class="mb-2"
                        >
                            <b-card-text>
                                Submit an item order
                            </b-card-text>

                            <b-button href="/submit-orders" variant="primry">Click me!</b-button>
                        </b-card>

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
                    <b-card-group>
                        <b-card
                            title="Approve Orders"
                            style="max-width: 20rem;"
                            class="mb-2"
                        >
                            <b-card-text>
                                Check status, approve, complete, orders
                            </b-card-text>

                            <b-button href="/submit-orders" variant="primry">Click me!</b-button>
                        </b-card>
                    </b-card-group>
                </b-col>

            </b-row>
        </b-container>
    
        
    </div>
</template>

<script>
    import {firebase} from '../../firebase';
    export default {
        name: 'home',
        components: {
        },
        methods: {
            
        }
    }
</script>

