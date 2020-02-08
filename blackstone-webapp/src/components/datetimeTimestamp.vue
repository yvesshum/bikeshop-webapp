// This is a wrapper to Datetime, no matter what happens it always outputs a timestamp, and takes in a timestamp 
<template>
    <!-- <datetime :value="value" @input="$emit('input', toTimestamp($event))"/> -->
    <datetime type="datetime" v-bind:value="formatToString(value)" v-on:input="$emit('input', formatToTimestamp($event))" />
</template>

<script>
import { Datetime } from 'vue-datetime'
import { Timestamp } from '@/firebase.js'

export default {
    name: 'datetimeTimestamp',
    props: {
        value: {
            default: Timestamp.fromDate(new Date())
        }
    },
    methods: {
        formatToString(value) {
            if (value == null) {
                return (new Date().toISOString());
            } else {
                return value.toDate().toISOString();
            }
            
        },

        formatToTimestamp(value) {
            return Timestamp.fromDate(new Date(value));
        }
    },
    components: {
        Datetime
    }
    
}
</script>