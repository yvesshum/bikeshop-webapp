<template>
    <div>
        <top-bar/>
        <div class="Special-input-demo">

            <SpecialInput inputType="Datetime" v-model="testInput" ref="date" :arguments="{}"/>
            <br><hr>

            <p>{{this.testInput}}</p>

            <!-- <b-textarea v-model="testInput"></b-textarea> -->


        </div>
    </div>
    
</template>

<script>
import moment from 'moment'
import { Timestamp } from '@/firebase.js'

import SpecialInput from '../../components/SpecialInputTest.vue'

export default {
    name: 'Stats',
    components: {
        SpecialInput
    },
    data() {
        return {
            testInput: null
        }
    },
    
}
</script>

<style>
.Special-input-demo {
    width: 30rem;
    margin: 0 auto;
    align-items: center;

}
</style>