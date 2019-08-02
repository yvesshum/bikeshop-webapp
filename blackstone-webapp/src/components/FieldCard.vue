<template>
    <div>
        <b-button-group>
            <b-button>:</b-button>
            <b-button disabled>{{field}}</b-button>
            <b-button variant="danger" >X</b-button>
        </b-button-group>


    </div>
</template>

<script>
export default {
    name: 'FieldCard',
    props: {
        field: String
    }

}
</script>

<style>

</style>
