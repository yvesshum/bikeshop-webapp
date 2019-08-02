<template>
    <div>
        <b-
        <p v-bind="field"></p>
    </div>
</template>

<script>
export default {
    name: 'fieldCard',
    props: {
        field: String
    },
}
</script>

<style>

</style>
