<template>
<div>
<div class="content">
    <top-bar />
    <!-- Manage blog pages -->
    <h1 class="title">Blog Page Manager</h1>
    <PageHeader pageCategory="Staff Headers" pageName="Blog Page Manager"></PageHeader>



</div>
<Footer/>
</div>
</template>

<script>
import { db } from "../../firebase";
import PageHeader from '@/components/PageHeader.vue'

export default {
    name: "BlogPage",

    data() {
        return {
            blogs: [],
            ready: false
        }
    },

    methods: {
        processBlogSnapshot(snapshot) {
            let blogs = []
            snapshot.docs.forEach(doc => {
                blogs.push(doc.data())
            })
            this.blogs = blogs
        }
    },

    async mounted() {
        let blogSnapshot = await db.collection("GlobalBlogs").get();
        this.processBlogSnapshot(blogSnapshot)
        this.ready = true
    },

    components: {
        PageHeader
    }
}
</script>

<style>

</style>