<template>
    <div class="example">
        <p>Here's an example display coming out from Example.vue, check out the code to see how this is imported here</p><br><br>
        <HelloWorld
           @hi="myFunc()"
        />
    </div>
</template>

<script>
    import HelloWorld from "../../components/HelloWorld";
    export default {
        name: 'Example',
        components: {
            HelloWorld
        },
        methods:{
            myFunc() {
                this.$emit('hi', object)
            }
        },
        data() {
            return {
                myVariable: 0,
            }
        }
    }
</script>