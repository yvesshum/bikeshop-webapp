<template>
  <div class="header-div" v-if="headerText != null && headerText != ''">
    <hr>
    <pre class="header-pre">{{headerText}}</pre>
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
                var headerText = pageHeaders[this.pageCategory][this.pageName];
                headerText = headerText.split("\\n").join("\n");
                this.headerText = headerText;
            }

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
.header-pre {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  font-size: 16px;
  overflow-x: auto;
  white-space: pre-wrap;
  white-space: -moz-pre-wrap;
  white-space: -pre-wrap;
  white-space: -o-pre-wrap;
  word-wrap: break-word;
}
</style>
