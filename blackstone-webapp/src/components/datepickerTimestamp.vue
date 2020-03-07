// This is a wrapper to Datepicker, no matter what happens it always outputs a timestamp, and takes in a timestamp 
<template>
    <datepicker 
        type="datetime" 
        v-bind:value="formatToString(value)" 
        v-on:input="$emit('input', formatToTimestamp($event))" 
        style="display: inline-block;"
    />
</template>


<script>
import Datepicker from 'vuejs-datepicker';
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
        Datepicker
    }
    
}
</script>