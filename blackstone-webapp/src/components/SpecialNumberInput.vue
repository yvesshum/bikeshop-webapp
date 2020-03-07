<template>
    <div>
        <b-button-group>
            <b-button squared variant="danger" @click="handleValueAdd(-1)"><font-awesome-icon icon="minus" class ="icon alt"/> 1</b-button>
            <b-button squared variant="danger" @click="handleValueAdd(-0.5)"><font-awesome-icon icon="minus" class ="icon alt"/> .5</b-button>
            <b-button squared variant="danger" @click="handleValueAdd(-0.01)"><font-awesome-icon icon="minus" class ="icon alt"/> .01</b-button>

            
            <b-button squared blocked variant="warning">{{value}}$</b-button>

            <b-button variant="success" squared @click="handleValueAdd(0.01)"><font-awesome-icon icon="plus" class ="icon alt"/> .01</b-button>
            <b-button variant="success" squared @click="handleValueAdd(0.5)"><font-awesome-icon icon="plus" class ="icon alt"/> .5</b-button>
            <b-button variant="success" squared @click="handleValueAdd(1)"><font-awesome-icon icon="plus" class ="icon alt"/> 1</b-button>

        </b-button-group>
    </div>
</template>

<script>
export default {
    name: 'FieldCard',
    props: {
        value: {
            default: ""
        }
    },
    methods: {
        handleValueAdd(amount) {
            this.$emit('input', Math.round(this.adjustValue(this.value + amount) * 100) / 100)
        },

        /** 
         * Enforces that numbers don't go below 0
         */
        adjustValue(amount) {
            if (amount <= 0) {
                return 0
            } else {
                return amount 
            }
        }
    }
}
</script>

<style>
.fieldText{
    width:10rem;

}
</style>
