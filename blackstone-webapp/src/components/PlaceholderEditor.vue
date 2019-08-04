<template>
    <div >
        <p v-b-tooltip.hover title="Field Name, Placeholder Text, Status, Edit, Delete">Hint</p>
        <div  v-if="dataLoaded">
            <PlaceholderCard 
                v-for="element in data"
                :key="element.field"
                :field="element.field"
                :placeholder="element.placeholder"
                :existingFieldNames="existingFieldNames"
                rbRef="Submit Orders Placeholders"
            />
        </div>
    </div>
</template>

<script>
import {rb} from '@/firebase.js';
import {db} from '@/firebase.js';
import PlaceholderCard from './PlaceholderCard.vue';

export default {
    name: 'PlaceholderEditor',
    props: {
        placeholderRef: String,
        doc: String
    },
    components: {
        PlaceholderCard
    },
    data() {
        return {
            data: [],
            existingFieldNames: [],
            dataLoaded: false,
        }
    },
    methods: {
        formatData(snapshot) {
            let ret = [];
            let keys = Object.keys(snapshot);
            for (let i = 0; i < keys.length; i ++) {
                let res = {
                    "field": keys[i],
                    "placeholder": snapshot[keys[i]]
                }
                ret.push(res)
            }
            return ret;
        },

        formatNames(obj) {
            let ret = [];
            let keys = Object.keys(obj)
            for (let i = 0; i < keys.length; i++) {
                for (let j = 0; j < obj[keys[i]].length; j++) {
                    ret.push(obj[keys[i]][j])
                }
            }
            return ret;
         },

         forceUpdate() {
            this.$forceUpdate();
         }

    },
    async mounted() {
        db.collection("GlobalFieldsCollection").doc(this.doc).onSnapshot(doc => {
            this.existingFieldNames = this.formatNames(doc.data());
            this.dataLoaded = true;
        })
        rb.ref(this.placeholderRef).on('value', snapshot => {
                this.data = this.formatData(snapshot.val());
                this.forceUpdate();
        });
    },

}
</script>

<style>
</style>
