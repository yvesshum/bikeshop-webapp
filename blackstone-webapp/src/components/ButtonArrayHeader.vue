
<template>
    <div class="button-array-header">
        <div style="margin: auto; text-align: center;">
            <b-button v-for="b in left" :key="b"
                class="arr-l"
                @click="switch_to(get_name(b))"
                v-b-tooltip.hover :title="get_name(b)"
                :variant="in_bounds(b) ? 'primary' : 'secondary'"
                :disabled="!in_bounds(b)"
            >
                <span v-if="get_arrow(b) == 's'">&larr;</span>
                <span v-else-if="get_arrow(b) == 'd'">&Larr;</span>
                <span v-else-if="get_arrow(b) == 'b'">&larrb;</span>
                <span v-else-if="get_arrow(b) == 'h'">&#8962;</span>
            </b-button>

            <b-dropdown style="display: inline-block;" variant="primary">
                <template v-slot:button-content><slot></slot></template>
                <div v-for="item in fullList" :key="item">
                    <b-dropdown-divider v-if="item == undefined"></b-dropdown-divider>
                    <b-dropdown-item-button v-else
                        @click="switch_to(item)"
                        :active="current == item"
                    >{{item}}</b-dropdown-item-button>
                </div>
            </b-dropdown>

            <b-button v-for="b in rev_right" :key="b"
                class="arr-r"
                @click="switch_to(get_name(b))"
                v-b-tooltip.hover :title="get_name(b)"
                :variant="in_bounds(b) ? 'primary' : 'secondary'"
                :disabled="!in_bounds(b)"
            >
                <span v-if="get_arrow(b) == 's'">&rarr;</span>
                <span v-else-if="get_arrow(b) == 'd'">&Rarr;</span>
                <span v-else-if="get_arrow(b) == 'b'">&rarrb;</span>
                <span v-else-if="get_arrow(b) == 'h'">&#8962;</span>
            </b-button>
        </div>
        <div style="clear:both;"></div>
    </div>
</template>

<script>

export default {
    name: 'button-array-header',
    props: ["left", "right", "min", "max", "compareFunc", "current", "fullList"],

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
            if (typeof b == "string" || b.arr == undefined) {
                return "s";
            }
            else {
                return b.arr;
            }
        },

        in_bounds: function(b) {
            if (this.current == null) return true;

            switch (b.val) {
                case 'min':
                case 'prev':
                    return this.compareFunc(this.min, this.current) < 0;

                case 'max':
                case 'next':
                    return this.compareFunc(this.max, this.current) > 0;

                default:
                    return true;
            }
        }
    },

    computed: {
        rev_right: function() {
            return this.right.slice().reverse();
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