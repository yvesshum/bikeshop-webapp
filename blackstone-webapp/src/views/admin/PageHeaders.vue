<template>
    <div v-if="dataLoaded">
        <top-bar/>
        <br>

        <h1 v-b-tooltip.hover title="These settings here correspond to the instructions at the top of each page">Page Headers</h1>    
        <hr class="title">
        
        <div class="header-container">
            <b-card no-body class="mb-0">
                <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
                  <h5 href="#" v-b-toggle.accordion-registration>Registration Headers</h5>
                </b-card-header>
                <b-collapse id="accordion-registration" accordion="my-accordion" role="tabpanel">
                    <!-- <h2 v-b-tooltip.hover title="These texts are instructions for youth registration">Registration Headers</h2>
                    <hr class="subheading"> -->
                    
                    <div v-for="page in parentPages">
                        <div class="headerDiv">
                            <h3 v-b-tooltip.hover title="These texts are instructions for parents">{{page}}</h3>
                            <SpecialInput v-model="parentHeaders[page]" :ref="page" inputType="Essay" :args="arguments">
                            </SpecialInput>
                        </div>
                    </div>
                </b-collapse>
            </b-card>
        </div>
        
        <div class="header-container">
            <b-card no-body class="mb-0">
                <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
                  <h5 href="#" v-b-toggle.accordion-youth>Youth Headers</h5>
                </b-card-header>
                <b-collapse id="accordion-youth" accordion="my-accordion" role="tabpanel">
                    <!-- <h2 v-b-tooltip.hover title="These texts are instructions for youths">Youth Headers</h2>
                    <hr class="subheading"> -->
                    
                    <div v-for="page in youthPages">
                        <div class="headerDiv">
                            <h3 v-b-tooltip.hover title="These texts are instructions for youths">{{page}}</h3>
                            <SpecialInput v-model="youthHeaders[page]" :ref="page" inputType="Essay" :args="arguments">
                            </SpecialInput>
                        </div>
                    </div>
                </b-collapse>
            </b-card>
        </div>
        
        <div class="header-container">
            <b-card no-body class="mb-0">
                <b-card-header header-tag="header" class="p-1 bg-info" role="tab">
                  <h5 href="#" v-b-toggle.accordion-staff>Staff Headers</h5>
                </b-card-header>
                <b-collapse id="accordion-staff" accordion="my-accordion" role="tabpanel">
                    <!-- <h2 v-b-tooltip.hover title="These texts are instructions for staff">Staff Headers</h2>
                    <hr class="subheading"> -->
                    <div v-for="page in staffPages">
                        <div class="headerDiv">
                            <h3 v-b-tooltip.hover title="These texts are instructions for staff">{{page}}</h3>
                            <SpecialInput v-model="staffHeaders[page]" :ref="page" inputType="Essay" :args="arguments">
                            </SpecialInput>
                        </div>
                    </div>
                </b-collapse>
            </b-card>
        </div>
        
        <b-button variant="success" @click="save" style="margin-top:10px">Save Changes</b-button>

        
        <SettingsBottomNote/>
        <b-modal v-model = "modalVisible" hide-footer lazy>
            <template slot="modal-title">
                Page headers saved!
            </template>
            <div class="d-block text-center">
                <h3>Saved page header changes</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">Thanks!</b-button>
        </b-modal>

         <!-- Loading Modal -->
        <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                Doing some work...
            </template>
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong> Loading...</strong>
                </div>
            </div>
        </b-modal>

    </div>
    
</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import SpecialInput from '@/components/SpecialInput';
import { initSpecialInputVal } from '../../scripts/SpecialInit';
import { forKeyVal } from '@/scripts/ParseDB.js';

export default {
    name: 'PageHeaders',
    components: {
        SettingsBottomNote,
        SpecialInput,
    },
    data() {
        return {
            dataLoaded: false,
            newYouthInfo: "",
            returningYouthInfo: "",
            modalVisible: false,
            loadingModalVisible: false,
            parentHeaders: {},
            youthHeaders: {},
            staffHeaders: {},
            parentPages: [],
            youthPages: [],
            staffPages: [],
        }
    },
    methods: {
        parse(item) {
                return JSON.parse(JSON.stringify(item));
        },
        
        async getPageHeaders() {
            let pageHeaders = await db.collection("GlobalVariables").doc("PageHeaders").get();
            pageHeaders = pageHeaders.data();
            if (pageHeaders == null) { 
                window.alert("Unable to get PageHeaders from Global Variables");
            }
            let parentPages = [];
            for (const page in pageHeaders["Parent Headers"]) {
                pageHeaders["Parent Headers"][page] =
                  pageHeaders["Parent Headers"][page].split("\\n").join("\n");
                parentPages.push(page);
            }
            this.parentPages = parentPages;
            let youthPages = [];
            for (const page in pageHeaders["Youth Headers"]) {
                pageHeaders["Youth Headers"][page] =
                  pageHeaders["Youth Headers"][page].split("\\n").join("\n");
                youthPages.push(page);
            }
            this.youthPages = youthPages;
            let staffPages = [];
            for (var page in pageHeaders["Staff Headers"]) {
                pageHeaders["Staff Headers"][page] =
                  pageHeaders["Staff Headers"][page].split("\\n").join("\n");
                staffPages.push(page);
            }
            this.staffPages = staffPages;
            this.parentHeaders = pageHeaders["Parent Headers"];
            this.youthHeaders = pageHeaders["Youth Headers"];
            this.staffHeaders = pageHeaders["Staff Headers"];
        },
        async save() {
            this.loadingModalVisible = true;
            let submitRef = db.collection("GlobalVariables").doc("PageHeaders");
            var newPageHeaders = {};
            newPageHeaders["Parent Headers"] = Object.assign(this.parentHeaders);
            newPageHeaders["Youth Headers"] = Object.assign(this.youthHeaders);
            newPageHeaders["Staff Headers"] = Object.assign(this.staffHeaders);
            var submitPageHeaders = {};
            submitPageHeaders["Parent Headers"] = {};
            submitPageHeaders["Youth Headers"] = {};
            submitPageHeaders["Staff Headers"] = {};
            for(var page in newPageHeaders["Parent Headers"]){
              submitPageHeaders["Parent Headers"][page] = 
                newPageHeaders["Parent Headers"][page].split('\n').join('\\n');
            }
            for(var page in newPageHeaders["Youth Headers"]){
              submitPageHeaders["Youth Headers"][page] = 
                newPageHeaders["Youth Headers"][page].split('\n').join('\\n');
            }
            for(var page in newPageHeaders["Staff Headers"]){
              submitPageHeaders["Staff Headers"][page] = 
                newPageHeaders["Staff Headers"][page].split('\n').join('\\n');
            }
            let submitStatus = await submitRef.set(submitPageHeaders)
            if (submitStatus) {
                window.alert("Error updating page headers");
            }
            this.showModal();
            this.loadingModalVisible = false;
        },
        showModal() {
            this.modalVisible = true;
        },
        
        closeModal() {
            this.modalVisible = false;
        },
    },
    async mounted() {
        this.loadingModalVisible = true;
        await this.getPageHeaders();
        this.dataLoaded = true;
        this.loadingModalVisible = false;
    }

    
}
</script>
<style scoped>\
a, a:hover, a:active, a:link {
  color:inherit;
  text-decoration: none;
 }

h5 {
  padding: 0.5rem;
  color: white;
  cursor: pointer;
}

.header-container {
  /* padding-top: 6rem; */
  margin: auto;
  max-width: 750px;
  background-color: #ffffff;
}

h5:hover {
  text-decoration: underline;
}

.headerDiv{
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    justify-content: center;
    padding-bottom: 1rem;
    padding-top: 1rem;
}
</style>