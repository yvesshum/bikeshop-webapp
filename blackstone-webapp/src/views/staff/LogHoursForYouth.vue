<template>
    <div>
        <top-bar/>
        <div class="loghours-page">
            <h1>Log hours for one or more youth</h1>
            <h3>Youths to log</h3>
            <b-button-group>

            <div class="placeholder">
                <b-button 
                    disabled 
                    squared 
                    block 
                    variant="light"  
                >
                    {{placeholderText}}
                </b-button>
            </div>
            <div class="button">
                <b-button
                    squared 
                    block 
                    variant="danger"
                    @click="onDeleteClicked"
                >
                    <font-awesome-icon icon="times" class ="icon alt"/>
                </b-button>
            </div>
        </b-button-group>

            <div style="width: 40rem">
                <YouthIDSelector @selected="YouthIDSelected" ref="selector" />
                <br>
                <b-textarea placeholder="ID Number" style="text-align: center" v-model="ID"></b-textarea>
            </div>
            <br>
            <b-button variant="success" @click="AddButtonClicked">Add to logging list</b-button>
        </div>
        
        
    </div>
</template>

<script>
import YouthIDSelector from '../../components/YouthIDSelector'

export default {
    name: "LogHoursForYouth",
    data() {
        return {
            multiple: true,
            taggable: true,
            ID: "",
        }
    },
    methods: {
        YouthIDSelected(item) {
            this.ID = item.split(" ")[2]
        },

        AddButtonClicked() {

        }
    },
    components: {
        YouthIDSelector
    }
};
</script>

<style scoped>
.loghours-page {
    display: flex;
    flex-direction:column;
    align-items: center
}
</style>
