<template>
    <div class = "StaffManageSkills">
        <top-bar/>
        <h3 style="margin: 20px">Manage Apron skills here!</h3>
        <b>Add category: </b>
        <input v-model="new_category" type="text" id="new_category_field" aria-describedby="emailHelp" placeholder="Category Name" style="margin-top:10px"> 
        <b-button variant="success" @click="add_category" style="margin-top:10px">Add Category</b-button></br>
        <div>
            <b>Add skill: </b>
            <b-dropdown id="dropdown-1" v-bind:text="selected_category" class="m-md-2">
                <div v-for="category in uniqueCategories">
                    <b-dropdown-item @click="update_selected_category(category)">{{category}}</b-dropdown-item>
                </div>
            </b-dropdown>
            <input v-model="new_skill" type="text" id="new_skill_field" aria-describedby="emailHelp" placeholder="Skill Name" style="margin-top:10px">
            <b-button variant="success" @click="add_skill" style="margin-top:10px">Add Skill</b-button>
        </div>
        <EditTable v-bind:table_data="table_data" :headingdata="['Category', 'Skills']" @rowSelected="updateSelected"/>
        <b-button variant="success" @click="submit" style="margin-top:10px">Submit Changes</b-button></br>
        <b-button variant="info" @click="update" style="margin-top:10px">Refresh Table (Discards changes)</b-button>
        <b-modal v-model = "modalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{modalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{modalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">ok</b-button>
        </b-modal>
    </div>
</template>

<script>
    import EditTable from '../../components/EditTable';
    import {db} from '../../firebase';
    import {firebase} from '../../firebase';
    
    let ApronSkillsRef = db.collection("ApronSkills").doc("Categories");
    
    export default {
        name: 'StaffManageSkills',
        components: {
            EditTable,
        },
        data() {
            return {
                selectedRow: null,
                table_data: [],
                current_skills: [],
                current_categories: [],
                new_category: "",
                new_skill: "",
                modalHeader: "",
                modalMsg: "",
                modalVisible: false,
                selected_category: "Select Category"
            };
        },
        computed: {
            uniqueCategories: function () {
                // `this` points to the vm instance
                var categories = [];
                console.log(this.table_data)
                for(var i = 0; i < this.table_data.length; i++) {
                    categories.push(this.table_data[i]["Category"]);
                }
                console.log(categories)
                return [...new Set(categories)];
            }
        },
        methods: {
            async getCategories() {
                let f = await ApronSkillsRef.get();
                return f.data();
            },
            updateSelected (data) {
                this.selectedRow = data;
            },
            showModal(header, msg) {
                this.modalHeader = header;
                this.modalMsg = msg;
                this.modalVisible = true;1
            },
            closeModal() {
                this.modalVisible = false;
            },
            async update_selected_category(category) {
                this.selected_category = category;
            },
            async deleteSkill(index){
                console.log("delete!");
                this.table_data.splice(index, 1);
            },
            async add_category() {
                this.table_data.push({
                    'Category': this.new_category,
                    'Skills': "None"
                });
                this.new_category = "";
            },
            async add_skill() {
                this.table_data.push({
                    'Category': this.selected_category,
                    'Skills': this.new_skill
                });
                this.new_skill = "";
            },
            async update() {
                if(this.table_data.length != 0){
                    this.table_data.splice(0, this.table_data.length);
                }
                let categories = await this.getCategories();
                for(var category in categories) {
                    var skills =  categories[category];
                    for(let i = 0; i < skills.length; i++){
                        this.table_data.push({
                            'Category': category,
                            'Skills': skills[i]
                        });
                    }
                }
            },
            async submit() {
                var skill_arrays = {}
                for(let i = 0; i < this.table_data.length; i++){
                    let category = this.table_data[i]["Category"];
                    let skill = this.table_data[i]["Skills"];
                    if(skill_arrays[category] == null){
                        skill_arrays[category] = '["' + skill + '"';
                    }else{
                        skill_arrays[category] += ', "' + skill + '"';
                    }
                }
                console.log("Skill array: " + skill_arrays)
                var new_data_text = '{';
                for(var category in skill_arrays){
                    new_data_text += '"'
                    + category
                    + '" : '
                    + 
                    skill_arrays[category]
                    + "], "
                }
                console.log(new_data_text)
                new_data_text = new_data_text.slice(0, -2);
                new_data_text += "}"
                console.log(new_data_text)
                ApronSkillsRef.set(JSON.parse(new_data_text)).then((err) => {
                    if(err){
                        this.showModal("Error", "Unable to submit apron skills, this may be an internet connection problem")
                    } else {
                        this.showModal("Success", "New apron categories and skills submitted")
                    }
                    return null;
                });
                
            }
        },
        async mounted() {
            let categories = await this.getCategories();
            console.log(JSON.stringify(categories));
            for(var category in categories) {
                var skills = categories[category];
                for(let i = 0; i < skills.length; i++){
                    this.table_data.push({
                        'Category': category,
                        'Skills': skills[i]
                    });
                }
            }
        }
    }
</script>

<style scoped>
    p a {
        text-decoration: underline;
        cursor: pointer;
    }
    textarea{
        outline-color: cadetblue;
        text-align: center;
        border: 1px solid;
        border-radius: 4px;
        width: 30%;
        margin-top: 5px;
    }
    ::placeholder span{
        color: red;
        opacity: 1;
    }
    .field_msg{
        text-decoration: underline;
    }
</style>