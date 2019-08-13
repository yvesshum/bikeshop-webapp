<!--Usage: <YouthIDSelector @selected="function"/>-->
<!--This returns a string of "FirstName LastName YouthID"-->

<!-- TODO: Pass in which part of database to grab names from -->
<!-- TODO: Sort by name -->

<template>
    <div class = "YouthIDSelector">
        <multiselect v-model="value" id="multiselect" :options="options" placeholder="Select your ID if you are currently active" open-direction="bottom" label="name" :custom-label="nameWithID">
            <template slot="singleLabel" slot-scope="props">
                <span class="option__desc">
                    <span class="option__name">{{ props.option.name }}</span>
                    <br />
                    <small class="option__id">ID: {{ props.option.id}}</small>
                </span>
            </template>
            <template slot="option" slot-scope="props">
                <div class="option__desc">
                    <span class="option__name">{{ props.option.name }}</span>
                    <br>
                    <small class="option__id">ID: {{ props.option.id }}</small>
                </div>
            </template>
        </multiselect>
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
                value: '',
                options: []
            }
        },
        methods: {
            // selected(value) {
            //     // console.log("Emitting from selected: ", value, value.name, value.id);
            //     // this.$emit('selected', value.name + " " + value.id);
            // },
           async getData() {
                let data = await db.collection("GlobalVariables").doc("ActivePeriods").get();
                return data.data()["CurrentActiveYouths"];
            },
            nameWithID ({ name, id }) {
                return `${name} ${id}`;
            },
            reset() {
                this.value = null;
            }

        },

        watch: {
            value: function() {
                // console.log("Value changed to ", new_val);
                if (this.value == null) {
                    console.log("Emitting null...");
                    this.$emit('selected', null);
                } else {
                    this.$emit('selected', this.value.name + " " + this.value.id);
                };
            }
        },

        async mounted() {
            let data = await this.getData();
            var id_list = [];
            data.forEach(function(item, index) {
                let name = item.slice(0, item.lastIndexOf(' ')  );
                let id   = item.slice(   item.lastIndexOf(' ')+1);
                id_list.push({name, id});
            })
            this.options = id_list;
            this.$emit("ready", null);
        }
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
    .YouthIDSelector {
        width: 70%;
        position: relative;
        left: 15%;
        right: 15%;
    }


</style>


