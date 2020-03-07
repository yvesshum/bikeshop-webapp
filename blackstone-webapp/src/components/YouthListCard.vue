<template>
    <div class = "youth_listcard">
        <b-button-group>
            <div class="youth_card_name">
                <b-button squared disabled block variant="light">{{youth["First Name"]}}</b-button>
            </div>
            <div class="youth_card_name">
                <b-button squared disabled block variant="light">{{youth["Last Name"]}}</b-button>
            </div>
            <div class="youth_card_id">
                <b-button squared disabled block variant="light">{{youth["ID"]}}</b-button>
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
    </div>


</template>

<script>
export default {
    name: 'YouthListCard',
    props: {
        youth: Object,
        deleteHandler: Function
    },
    methods: {
        onDeleteClicked() {
            this.deleteHandler()
        },

    },

}
</script>

<style>
.youth_card_name{
    width: 8rem;
}
.youth_card_id{
    text-align: center;
    width: 5rem;
}

</style>
