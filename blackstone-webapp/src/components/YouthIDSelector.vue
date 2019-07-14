<!--Usage: <YouthIDSelector @selected="function"/>-->
<!--This returns a string of "FirstName LastName YouthID"-->

<template>
    <div class = "YouthIDSelector">
        <multiselect id = "multiselect" :options="options" placeholder="Select your ID" @select="selected" open-direction="bottom"></multiselect>
    </div>
</template>


<script>
    import {firebase} from '../firebase'
    import {db} from '../firebase'
    import Multiselect from 'vue-multiselect'
    export default {
        name: 'YouthIDSelector',
        components: { Multiselect },
        data () {
            return {
                options: []
            }
        },
        methods: {
            selected(value) {
                this.$emit('selected', value);

            },
           async getData() {
                let data = await db.collection("GlobalVariables").doc('CurrentActiveYouths').get();
                return data.data();
            }

        },
        async mounted() {
            let data = await this.getData();
            this.options = data["IDs"];
        }
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
    .YouthIDSelector {
        width: 30%;
        position: relative;
        left: 35%;
        right: 35%;
    }


</style>