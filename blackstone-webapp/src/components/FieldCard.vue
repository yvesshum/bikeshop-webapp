<template>
    <div>
        <b-container fluid>
            <b-row>
                <b-button squared variant="light" pressed><font-awesome-icon icon="bars" class="icon alt"/></b-button>
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
                <b-button :disabled="isProtected" variant="info" @click="onEditClicked" squared><font-awesome-icon icon="edit" class ="icon alt"/></b-button>
                <b-button :disabled="isProtected" variant="danger" @click="onDeleteClicked" squared><font-awesome-icon icon="times" class="icon alt"/></b-button>
                
            </b-row>
        </b-container>
    </div>
</template>

<script>
export default {
    name: 'FieldCard',
    props: {
        field: String,
        isProtected: Boolean,
    },
   methods: {
       onEditClicked() {
           this.$emit('editClicked', this.field);
       },

       onDeleteClicked() {

       }
   }
}
</script>

<style>
.fieldText{
    width: 50%
}
</style>
