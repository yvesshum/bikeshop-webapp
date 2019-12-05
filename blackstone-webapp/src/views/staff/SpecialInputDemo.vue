<template>
    <div>
        <top-bar/>
        <div class="Special-input-demo">
            <p>Integer</p>
            <SpecialInput inputType="Integer"/>
            <br>
            <hr>

            <p>Boolean</p>
            <SpecialInput inputType="Boolean" ref="test"/>
            <br>
            <hr>

            <p>Phone</p>
            <SpecialInput inputType="Phone" ref="phone" :arguments="{}"/>
            <br><hr>


            <p>Date</p>
            <SpecialInput inputType="Datetime" ref="date" :arguments="{}"/>
            <br><hr>

            <p>Gender</p>
            <SpecialInput inputType="Gender" ref="gender"  :arguments="{}"/>
            <br><hr>

            <p>Race</p>
            <SpecialInput inputType="Race" ref="race"  :arguments="{}"/>
            <br><hr>

            <p>Grade</p>
            <SpecialInput inputType="Grade" ref="race"  :arguments="{}"/>
            <br><hr>

            <p>Email</p>
            <SpecialInput inputType="Email" ref="race"  :arguments="{}"/>
            <br><hr>

            <p>Hours</p>
            <SpecialInput inputType="Hours" ref="race"  :arguments="{}"/>
            <br><hr>

            <p>Class</p>
            <SpecialInput inputType="Class" ref="race"  :arguments="{}"/>
            <br><hr>

            <p>Period</p>
            <SpecialInput inputType="Period"/>
            <br><hr>

        </div>
    </div>
    
</template>

<script>
import moment from 'moment'
import SpecialInput from '../../components/SpecialInput.vue'

export default {
    name: 'Stats',
    components: {
        SpecialInput
    },
    data() {
        return {
        }
    },
    
}
</script>

<style>
.Special-input-demo {
    width: 30rem;
    margin: 0 auto;
    align-items: center;

}
</style>