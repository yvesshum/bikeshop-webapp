// This is a wrapper to special input's email input
<template>
    <b-form-input :value="value" @input="$emit('input', $event); isValidEmail($event)" :state="isValid" type="email"></b-form-input>
</template>


<script>
export default {
    name: 'emailWrapper',
    props: {
        value: {
            default: ""
        }
    },
    data() {
        return {
            isValid: false
        }
    },

    methods: {
        isValidEmail(value) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            this.isValid = re.test(String(value).toLowerCase());
            console.warn("isValid", re.test(String(value).toLowerCase()))
        },
    }
}
</script>