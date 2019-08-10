// List of settings we need to have: 
// Changing Submit Orders placeholders 
// Changing Youth Profile fields 
// Youth Order Form
// Hour Transfers 
// Current active quarter 
<template>
    <div class="home">
        <top-bar/>
        <br>
        <div>
            <div class="heading">
                <h1>Admin Panel</h1>
            </div>
            <div class="options">
                <a href="/youth-order-settings">
                    <button class="page">
                    <h4>Youth Order Form</h4>
                    <p>Change Youth Order Form's settings</p>
                    </button>
                </a>
                <a href="/youth-profile-staff-settings">
                    <button class="page">
                    <h4>Youth Profile Staff View</h4>
                    <p>Change Youth Order staff view's settings</p>
                    </button>
                </a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'home',
  components: {
  },
  methods: {

  }
}
</script>

<style>
.heading {
  padding-top: 1rem;
  color: black;
}

.options {
  margin: 1rem;
}

.page {
  display: inline;
  margin: 0.5rem;
  border-radius: 0.5rem;
  border: 0.1rem solid lightblue;
  color: #007399;
  width: 20rem;
  height: 8rem;
}

h4 {
  color: black;
}

</style>
