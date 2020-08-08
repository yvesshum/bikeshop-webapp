<template>
    <div v-if="dataLoaded">
        <div class="content">
            <top-bar/>
            <br>
            <h1>Period Settings</h1>
            <hr class="title">
            <div style="width: 80%; margin: 0 auto">
                <h4 v-b-tooltip.hover title="Current active period">Current Period:</h4>
                <b-form-select v-model="currentPeriodSelection" :options="periodOptions"></b-form-select>
                <hr>
                <h4 v-b-tooltip.hover title="Period that youths are being registered into">Registration Period:</h4>
                <b-form-select v-model="registrationPeriodSelection" :options="periodOptions"></b-form-select>

                <b-button style="margin: 1%" variant="success" @click="save">Save</b-button>
            </div>

            <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
                <div class="d-block text-center">
                    <div slot="table-busy" class="text-center text-danger my-2">
                        <b-spinner class="align-middle"></b-spinner>
                        <strong> Loading...</strong>
                    </div>
                </div>
            </b-modal>

            <b-modal v-model = "successModalVisible" hide-footer lazy >
                <template slot="modal-title">
                    Success
                </template>
                <div class="d-block text-center">
                    <h3>Succesfully changed current period to {{this.currentPeriodSelection}}
                        , and registration period to {{this.registrationPeriodSelection}}
                    </h3>
                </div>
                <b-button class="mt-3" block @click="successModalVisible = false" variant = "primary">ok</b-button>
            </b-modal>
            
            <SettingsBottomNote/>
        </div>
        <Footer/>
    </div>

</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import moment from 'moment'

export default {
    name: 'PeriodSettings',
    components: {
        SettingsBottomNote,
    },
    data() {
        return {
            listenerUnsubscribe: null,
            periods: {
                currentPeriod: "",
                currentRegistrationPeriod: "",
                startPeriod: "",
                seasons: []
            },
            dataLoaded: false,

            periodOptions: [],
            currentPeriodSelection: null,
            registrationPeriodSelection: null,

            loadingModalVisible: false,
            successModalVisible: false
        }
    },
    methods: {
        async getData() {
            let data = await db.collection("GlobalPeriods").doc("metadata").get() 
            data = data.data();
            this.periods.currentPeriod = data.CurrentPeriod;
            this.periods.currentRegistrationPeriod = data.CurrentRegistrationPeriod;
            this.periods.startPeriod = data.FirstPeriod;
            this.periods.seasons = data.Seasons;

            this.currentPeriodSelection = this.periods.currentPeriod;
            this.registrationPeriodSelection = this.periods.currentRegistrationPeriod;
        },

        getPeriodOptions() {
            let years = [];
            years.push(moment().subtract(1, 'years').format("YY"));
            years.push(moment().format("YY"));
            years.push(moment().add(1, 'years').format("YY"));

            for (let i = 0; i < years.length; i++) {
                console.log('l', this.periods.seasons)
                for (let j = 0; j < this.periods.seasons.length; j++) {
                    this.periodOptions.push({
                        value: this.periods.seasons[j] + " " + years[i],
                        text: this.periods.seasons[j] + " " + years[i]
                    })
                }
            }
        },

    async save() {
            this.loadingModalVisible = true;
            let status = await db.collection("GlobalPeriods").doc("metadata").update({
                CurrentPeriod: this.currentPeriodSelection,
                CurrentRegistrationPeriod: this.registrationPeriodSelection
            })

            if (status) {
                this.loadingModalVisible = false;
                window.alert("Error, something went wrong with saving curreng and registration period")
            }
            
            this.loadingModalVisible = false;
            this.successModalVisible = true;
        }




    },
    async mounted() {
        await this.getData();
        this.getPeriodOptions();
        this.dataLoaded = true;
    },


}
</script>

<style>
    hr.title {
      width: 80%
    }

    hr.subheading {
      width: 70%
    }

    hr.divider {
      width: 50%
    }

</style>
