<template>
    <div>
        <!-- <b-container>
            <b-row> -->
            <b-button-group>
                <b-button squared variant="light" pressed><font-awesome-icon icon="bars" class="icon alt"/></b-button>
                <div class="categoryText">
                    <b-button 
                        disabled 
                        squared 
                        block 
                        variant="light" 
                        pressed 
                    >
                        {{category}}
                    </b-button>
                </div>
                <b-button variant="info" @click="onEditClicked" squared><font-awesome-icon icon="edit" class ="icon alt"/></b-button>
                <b-button variant="danger" @click="onDeleteClicked" squared><font-awesome-icon icon="times" class="icon alt"/></b-button>
            </b-button-group>
            <!-- </b-row>
        </b-container> -->
    </div>
</template>

<script>
export default {
    name: 'CategoryCard',
    props: {
        category: String,
    },
   methods: {
       onEditClicked() {
           let ret = {};
           ret[this.category] = this.type;
           this.$emit('editClicked', ret);
       },

       onDeleteClicked() {
           let ret = {};
           ret[this.category] = this.type;
           this.$emit('deleteClicked', ret);
       }
   }
}
</script>

<style>
.categoryText{
    width:10rem;

}
</style>
