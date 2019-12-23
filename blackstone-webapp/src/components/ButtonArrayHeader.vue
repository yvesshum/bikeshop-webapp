
<template>
    <div class="button-array-header">
        <div style="margin: auto; text-align: center;">
            <b-button v-for="b in left" class="arr-l"
                @click="switch_to(get_name(b))"
                v-b-tooltip.hover :title="get_name(b)"
                variant="primary"
            >
                <span v-if="get_arrow(b) == 's'">&larr;</span>
                <span v-else-if="get_arrow(b) == 'd'">&Larr;</span>
                <span v-else-if="get_arrow(b) == 'b'">&larrb;</span>
            </b-button>

            <div style="display: inline-block;"><slot></slot></div>

            <b-button v-for="b in rev_right" class="arr-r"
                @click="switch_to(get_name(b))"
                v-b-tooltip.hover :title="get_name(b)"
                variant="primary"
            >
                <span v-if="get_arrow(b) == 's'">&rarr;</span>
                <span v-else-if="get_arrow(b) == 'd'">&Rarr;</span>
                <span v-else-if="get_arrow(b) == 'b'">&rarrb;</span>
            </b-button>
        </div>
        <div style="clear:both;"></div>
    </div>
</template>

<script>

export default {
    name: 'button-array-header',
    props: ["left", "right"],

    methods: {
        switch_to: function(name) {
            this.$emit("clicked", name)
        },

        get_name: function(b) {
            if (typeof b == "string") {
                return b;
            }
            else {
                return b.name;
            }
        },

        get_arrow: function(b) {
            if (typeof b == "string") {
                return "s";
            }
            else {
                return b.arr;
            }
        },
    },

    computed: {
        rev_right: function() {
            return this.right.reverse();
        },
    },
}
</script>

<style>
    .arr-l {
        float: left;
        margin: .05em;
    }

    .arr-r {
        float: right;
        margin: .05em;
    }

</style>