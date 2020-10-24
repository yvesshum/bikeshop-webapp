<template>
    <div>
        <div class="content">
        <top-bar/>
        <PageHeader pageCategory="Staff Headers" pageName="Log Hours for Multiple Youths"></PageHeader>
        <div class="loghours-page">
            <p v-if="profilesToAdd.length === 0">No youths selected</p>
            <div v-for="profile in profilesToAdd" :key="profile['ID']">
              <YouthListCard :youth="profile" :deleteHandler="function(){removeProfileToAdd(profile)}"/>
            </div>
            <br>
            <b-button @click="addButtonClicked" variant="success">Add a youth to log</b-button>
            <br>
            <h3>Hours</h3>
            <div v-for="(category, index) in categories" :key="index" class="input-field">
                <p style="text-align: center; margin-bottom:3px">{{category}}</p>
                <VueNumberInput
                    center
                    v-model="hours[category]"
                    :min="0"
                    :step="0.5"
                    placeholder="Hours"
                    align="center"
                    style="width: 20rem"
                    :precision="2"
                    controls
                    :inputtable="false"
                />
            </div>
            <div class="notes">
                <h3>Notes</h3>
                <input type="text" class="form-control" v-model="notes" placeholder="Leave a note!" style="text-align:center;">
            </div>
            <br>
            <b-button variant="info" @click="handleSubmit">Submit!</b-button>
        </div>



        <!-- Add Modal -->
        <b-modal  hide-footer v-model="addModalVisible">
            <template slot="modal-title">
                <h4 style="color: black;">Add a Youth</h4>
            </template>
            <div class ="add-form">
                <h2 style="text-align: center" v-b-tooltip.hover title="If a youth is not active, head over to Manager Periods and change it first">Select an active youth!</h2>
                <YouthIDSelector @selected="handleSelect" ref="selector"/>
                <br>
                <h3>You have selected:</h3>
                <div v-for="(item, index) in selected" :key="index">
                  <YouthListCard :youth="item" :deleteHandler="function(){removeSelected(item)}"/>
                </div>

                <br>

            </div>
            <b-button class="mt-3" block @click="closeAddModal" variant="danger">Cancel</b-button>
            <b-button class="mt-3" block @click="addYouth" variant="success">Add to logging list</b-button>
        </b-modal>

        <!-- Loading Modal -->
        <b-modal v-model = "loadingModalVisbile" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                <h4 style="color: black;">Doing some work...</h4>
            </template>
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong> Loading...</strong>
                </div>
            </div>
        </b-modal>

        <!-- Success Modal -->
        <b-modal v-model = "successModalVisbile" hide-footer lazy hide-header-close >
            <template slot="modal-title">
                <h4 style="color: black;">Success!</h4>
            </template>
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center my-2">
                    <h1>All entries have been logged.</h1>
                </div>
            </div>
            <b-button class="mt-3" block @click="closeSuccessModal" variant="success">Ok</b-button>
        </b-modal>

        </div>
        <Footer/>
    </div>
</template>

<script>
import YouthIDSelector from '../../components/YouthIDSelector'
import YouthListCard from '../../components/YouthListCard'
import {db} from '@/firebase.js'
import VueNumberInput from '@chenfengyuan/vue-number-input';
import { Timestamp } from '@/firebase.js'
import PageHeader from "@/components/PageHeader.vue"

export default {
    name: "LogHoursForYouth",
    data() {
        return {
            profilesToAdd: [],
            addModalVisible: false,
            loadingModalVisbile: false,
            successModalVisbile: false,
            notes: "Logged by staff",
            selected: [],
            categories: [],
            hours: {}

        }
    },
    methods: {
        handleSelect(item) {
            if (item !== null) {
                let index = this.selected.indexOf(item);
                if (index === -1) {
                    this.selected.push(item);
                }
                else {
                    this.selected.splice(index, 1);
                }
                this.$refs.selector.reset();
            }
        },

        addButtonClicked() {
            this.addModalVisible = true;
        },

        closeAddModal() {
            this.addModalVisible = false
        },

        closeSuccessModal() {
            this.successModalVisbile = false
        },

        addYouth() {
            this.selected.forEach(item => {
                let res = {
                    "First Name": item["First Name"],
                    "Last Name": item["Last Name"],
                    "ID": item["ID"]
                }
                //Check for duplicates
                if (this.profilesToAdd.filter(p => p.ID === res.ID).length === 0){
                    this.profilesToAdd.push(res);
                }
            })
            this.selected = [];
            this.closeAddModal();
        },

        removeSelected(item) {
            this.selected.splice(this.selected.indexOf(item), 1);
        },

        removeProfileToAdd(profile) {
            for (let i = 0; i < this.profilesToAdd.length; i++){
                if (this.profilesToAdd[i] === profile) {
                    this.profilesToAdd.splice(i, 1);
                    break;
                }
            }
        },

        async handleSubmit(){
            this.loadingModalVisbile = true;
            for (let youth of this.profilesToAdd) {
                //Grab Profile Data
                let profile = await db.collection("GlobalYouthProfile").doc(youth.ID).get()
                profile = profile.data();

                //Grab Period Data
                let period = ""
                try {
                    let metadata = await db.collection("GlobalPeriods").doc("metadata").get();
                    period = metadata.data()["CurrentPeriod"];
                } catch(err) {
                    window.alert("Unable to get current period, err: " + err);
                    return null;
                }

                //Create Entry in Global Pending Hours
                let entry = {
                    "First Name": youth["First Name"],
                    "Last Name": youth["First Name"],
                    "Youth ID": youth.ID,
                    "Period": period,
                    "Notes": this.notes,
                    "Check In": Timestamp.fromDate(new Date()),
                    "Check Out": Timestamp.fromDate(new Date())
                }
                entry = {...entry, ...this.hours};
                try {
                    await db.collection("GlobalPendingHours").doc().set(entry)
                } catch (err) {
                    window.alert("Error on setting new Globl Pending Hours Entry, error: " + err)
                }

                //Edit the youth's pending hours
                let totalHours = 0;
                let keys = Object.keys(this.hours);
                for (let i = 0; i < keys.length; i++) {
                    totalHours += parseFloat(this.hours[keys[i]])
                }
                let newPendingHours = parseFloat(profile["Pending Hours"]) + totalHours
                await db.collection("GlobalYouthProfile").doc(youth.ID).update({
                    "Pending Hours": newPendingHours
                })
                // console.log('logged.')
            }

            //Reset locally
            this.profilesToAdd = [];
            this.notes = "Logged by staff"
            this.categories.forEach(category => {
                this.hours[category] = 0;
            })

            this.loadingModalVisbile = false;
            this.successModalVisbile = true;
        }
    },
    async mounted() {
        let categories = await db.collection("GlobalVariables").doc("Hour Logging Categories").get();
        categories = categories.data()["Categories"];
        this.categories = categories;

        //set hour logs to be 0 by default
        this.categories.forEach(category => {
            this.hours[category] = 0;
        })
    },
    components: {
        YouthIDSelector,
        YouthListCard,
        VueNumberInput,
        PageHeader,
    }
};
</script>

<style scoped>
.loghours-page {
    display: flex;
    flex-direction:column;
    align-items: center;
    margin: 0 auto;
    width: 70%;
    margin-top: 2rem;
}

.add-form {
  text-align: center;
}


.title {
margin-bottom: 1rem;
}

</style>
