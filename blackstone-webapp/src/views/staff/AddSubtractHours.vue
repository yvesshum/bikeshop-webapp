<template>
  <div >
    <div class="content">
  <top-bar/>
  <h1 class="title">Add or take away hours for Youth</h1>
  <p style="margin: 0 1rem; padding-top: 0.5rem;">Note: This changes Hours Earned and does not show up as a record</p>
  <PageHeader pageCategory="Staff Headers" pageName="Add and Subtract Hours for Multiple Youths"></PageHeader>
  <br>
    <b-container>
      <b-row>
        <b-col>
          <YouthIDSelector @selected="handleSelect" @ready="idSelectorReady"/>
        </b-col>
      </b-row>
      <br>
      <b-row><b-col>
        <div>
          <br>
          <p style="margin-bottom: 1rem;">Hours (Only up to 2 d.p. will be accepted)</p>
          <div >
            <VueNumericInput
              v-model="value"
              :min="0"
              :step="1.00"
              placeholder="0.00"
              align="center"
              style="width: 20rem"
            />
          </div>
        </div>
        <br>
      </b-col></b-row>
      <b-row>
        <b-col>
          <b-button variant="success" @click="addButtonClicked">Add Hours</b-button>
        </b-col>
        <b-col>
          <b-button variant="danger" @click="subtractButtonClicked">Subtract Hours</b-button>
        </b-col>
      </b-row>
    </b-container>


      <!-- Modals -->
    <b-modal v-model = "modalVisible" hide-footer lazy>
      <template slot="modal-title">
        {{modal_title}}
      </template>
      <div class="d-block text-center">
        <h3>{{modal_msg}}</h3>
      </div>
      <b-button class="mt-3" block @click="closeModal" variant="primary">Ok!</b-button>
    </b-modal>

    <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
      <template slot="modal-title">
        {{loadingModalHeader}}
      </template>
      <div class="d-block text-center">
        <div slot="table-busy" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong> Loading...</strong>
        </div>
      </div>
    </b-modal>
    </div>
    <Footer/>
  </div>
</template>

<script>
import YouthIDSelector from "../../components/YouthIDSelector";
import {db} from '@/firebase'
import PageHeader from "@/components/PageHeader.vue"
import VueNumericInput from 'vue-numeric-input';
export default {
    name: 'AddSubtractHours',
    components: {
        YouthIDSelector,
        VueNumericInput,
        PageHeader,
    },
    data() {
        return {
            id: "",
            value: 0,
            modal_title: "",
            modal_msg: "",
            loadingModalHeader: "",
            ready: false,
            loadingModalVisible: false,
            modalVisible: false
        }
    },
    mounted() {

    },
    methods: {
        handleSelect(item) {
          if (item !== null && item !== undefined) {
            this.id = item['ID']
          } else {
            this.id = ""
          }
        },
        async addButtonClicked() {
            this.loadingModalHeader = "Hold on...";
            this.loadingModalVisible = true;
            let profile = await db.collection("GlobalYouthProfile").doc(this.id).get();
            if (profile.data() == null) {
                window.alert("Error Youth not found with ID: " + this.id);
                return null;
            }
            profile = profile.data();
            let newHoursEarned = Math.round((parseFloat(profile["Hours Earned"]) + this.value) * 100) / 100
            try {
                await db.collection("GlobalYouthProfile").doc(this.id).update({
                    "Hours Earned": newHoursEarned.toString()
                });
            } catch (err) {
                window.alert("Problem adding hours: " + err)
            }
            this.loadingModalVisible = false
            this.showModal("Success!", profile["First Name"] + "'s Hours Earned Increased from " + profile["Hours Earned"] + " to " + newHoursEarned )
        },

        async subtractButtonClicked() {
            this.loadingModalHeader = "Hold on...";
            this.loadingModalVisible = true;
            let profile = await db.collection("GlobalYouthProfile").doc(this.id).get();
            if (profile.data() == null) {
                window.alert("Error Youth not found with ID: " + this.id);
                return null;
            }
            profile = profile.data();
            let newHoursEarned = Math.round((parseFloat(profile["Hours Earned"]) - this.value) * 100) / 100
            try {
                await db.collection("GlobalYouthProfile").doc(this.id).update({
                    "Hours Earned": newHoursEarned
                });
            } catch (err) {
                window.alert("Problem adding hours: " + err)
            }
            this.loadingModalVisible = false
            this.showModal("Success!", profile["First Name"] + "'s Hours Earned decreased from " + profile["Hours Earned"] + " to " + newHoursEarned )
        },

        idSelectorReady() {
            this.ready = true;
        },

        closeModal() {
            this.modalVisible = false;
        },

        showModal(title, msg) {
            this.modal_title = title;
            this.modal_msg = msg;
            this.modalVisible = true;
        },





    },
}
</script>

<style>

.title {
margin-bottom: 1rem;
}

</style>
