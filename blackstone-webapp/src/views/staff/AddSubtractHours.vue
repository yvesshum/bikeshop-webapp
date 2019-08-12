<template>
    <div >
        <top-bar/>
        <br>
        <b-container>
            <b-row><b-col>
                <h1>Add or take away hours for Youth</h1>    
            </b-col></b-row>
            <b-row><b-col>
                <YouthIDSelector @selected="selectedID" @ready="idSelectorReady"/>
            </b-col></b-row>
            <br>
            <b-row><b-col>
                <div class="form-group row">
                    <label class="col-2 col-form-label">Or Type in an ID</label>
                    <div class="col-10">
                        <input class="form-control" type="string" :value="id" id="example-number-input">
                    </div>
                    
                    <label class="col-2 col-form-label">Hours</label>
                    <div class="col-10">
                        <input class="form-control" type="number" :value="value" id="example-number-input">
                    </div>
                </div>
            </b-col></b-row>
            <b-row>
                <b-col>
                    <b-button variant="success" @click="addButtonClicked">Add Hours</b-button>
                </b-col>
                <b-col>
                    <b-button variant="danger" @click="addButtonClicked">Subtract Hours</b-button>
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
            <b-button class="mt-3" block @click="closeModal" variant = "primary">Ok!</b-button>
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
    
</template>

<script>
import YouthIDSelector from "../../components/YouthIDSelector";
import {db} from '@/firebase'

export default {
    name: 'AddSubtractHours',
    components: {
        YouthIDSelector
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
        selectedID(input) {
            this.id = input.split(" ")[2]
        },
        async addButtonClicked() {
            this.loadingModalHeader = "Hold on...";
            this.loadingModalVisible = true;
            let profile = await db.collection("GlobalYouthProfile").doc(this.id).get();
            if (profile.data() == null) {
                window.alert("Error Youth not found with ID: " + this.id);
                return null;
            }


            
            

        },

        idSelectorReady() {
            this.ready = true;
        }
        

    },
}
</script>

<style>

</style>
