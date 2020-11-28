<template>
    <div>
        <!-- <b-container>
            <b-row> -->
            <b-button-group>
                <b-button :disabled="isProtected" squared variant="light" pressed><font-awesome-icon icon="bars" class="icon alt"/></b-button>
                <div class="fieldText">
                    <b-button 
                        disabled 
                        squared 
                        block 
                        variant="light" 
                        pressed 
                    >
                        {{field}}
                    </b-button>
                </div>
                <div class="fieldColor" :style="{backgroundColor: color}">
                </div>
                <b-button :disabled="isProtected" variant="info" @click="onEditClicked" squared><font-awesome-icon icon="edit" class ="icon alt"/></b-button>
                <b-button :disabled="isProtected" variant="danger" @click="onDeleteClicked" squared><font-awesome-icon icon="times" class="icon alt"/></b-button>
            </b-button-group>
            <!-- </b-row>
        </b-container> -->
    </div>
</template>

<script>
export default {
    name: 'FieldCard',
    props: {
        field: String,
        isProtected: Boolean,
        color: String
    },
   methods: {
       onEditClicked() {
           let ret = {};
           ret[this.field] = this.type;
           this.$emit('editClicked', ret);
       },

       onDeleteClicked() {
           let ret = {};
           ret[this.field] = this.type;
           this.$emit('deleteClicked', ret);
       }
   }
}
</script>

<style>
.fieldText{
    width:10rem;
}

.fieldColor{
    width: 2rem;
}
</style>
