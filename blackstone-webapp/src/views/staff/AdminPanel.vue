// List of settings we need to have: 
// Changing Submit Orders placeholders 
// Changing Youth Profile fields 
// Youth Order Form
// Hour Transfers 
// Current active quarter 
<template>
    <div class="AdminPanel">
        <top-bar/>
        <br>
        <b-container>
            <b-row>
                <b-col>
                    <b-card-group deck>

                        <a href="/youth-order-settings">
                            <b-card
                                    title="Youth Order Form"
                                    style="max-width: 20rem;"
                                    class="mb-2"
                            >
                                <b-card-text>
                                    Change Youth Order Form's settings
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
    name: 'AdminPanel',
    
}
</script>

<style>
</style>