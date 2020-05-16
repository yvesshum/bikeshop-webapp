<template>
  <div class="header-div" v-if="headerText != null && headerText != ''">
    <hr>
    <p>{{headerText}}</p>
    <hr>
  </div>

</template>


<script>
    import {firebase} from '@/firebase'
    import {db} from '@/firebase';
    export default {
        name: 'PageHeader',
        props: {
            pageCategory: {
                type: String,
                default: null,
            },
            pageName: {
              type: String,
              default: true
            }
        },
        data() {
            return {
                headerText: ""
            };
        },
        methods: {
            async getHeaderText() {
                let pageHeaders = await db.collection("GlobalVariables").doc("PageHeaders").get();
                pageHeaders = pageHeaders.data();
                if (pageHeaders == null) { 
                    window.alert("Unable to get PageHeaders from Global Variables");
                }
                let headerText = pageHeaders[this.pageCategory][this.pageName];
                this.headerText = headerText;
            },

        },
        async mounted() {
            await this.getHeaderText();
            console.log("Header text: " + this.headerText);
        }
    }
</script>

<style scoped>
  
.header-div{
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  justify-content: center;
}
</style>
