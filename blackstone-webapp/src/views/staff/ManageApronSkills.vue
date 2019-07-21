<template>
    <div class = "StaffManageSkills">
        <h3 style="margin: 20px">Manage Apron skills here!</h3>
        <input v-model="new_name" type="text" id="new_category" aria-describedby="emailHelp" placeholder="Category Name" style="margin-top:10px">
        <b-button variant="success" @click="add_new" style="margin-top:10px">Add Category</b-button>
        <EditTable v-bind:table_data="table_data" :headingdata="['Category', 'Skills']" @rowSelected="updateSelected"/>
        <b-button variant="success" @click="update" style="margin-top:10px">Update Table (Discards changes)</b-button>
        <b-button variant="success" @click="submit" style="margin-top:10px">Submit Changes</b-button>
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
                new_name: ""
            };
         },
        methods: {
            async getCategories() {
                let f = await ApronSkillsRef.get();
                return f.data();
            },
            updateSelected (data) {
                this.selectedRow = data;
            },
            async deleteCategory(index){
                console.log("delete!");
                this.table_data.splice(index, 1);
            },
            async add_new() {
                this.table_data.push({
                    'Category': this.new_name,
                    'Skills': "None"
                });
                this.new_name = "";
            },
            async update() {
                if(this.table_data.length != 0){
                    this.table_data.splice(0, this.table_data.length);
                }
                let categories = await this.getCategories();
                for(var category in categories) {
                    this.table_data.push({
                        'Category': category,
                        'Skills': categories[category]
                    });
                }
            },
            async submit() {
                // if(this.current_categories.length != 0){
                //     this.current_categories.splice(0, this.current_categories.length);
                // }
                // let categories = await this.getCategories();
                // for(var category in categories) {
                //     this.current_categories.push(category);
                //     this.current_skills.push(categories[category]);
                // }
                // console.log("Table data");
                // console.log(this.table_data);
                // console.log("Current data");
                // console.log(this.current_categories);
                // console.log(this.current_skills);
                // for(let i = 0; i < this.table_data.length; i++){
                //     let current_c_ind = this.current_categories.indexOf(this.table_data[i]["Category"])
                //     let current_s_ind = this.current_skills.indexOf(this.table_data[i]["Skills"])
                //     if(current_c_ind != -1 && current_s_ind == current_c_ind){
                //         console.log("Unmodified: " + this.table_data[i]);
                //     } else {
                //         console.log("Modified: " + this.table_data[i]);
                //         let cat = this.table_data[i]["Category"];
                //         ApronSkillsRef.set({
                //             cat : this.table_data[i]["Skills"]
                //         })
                //     }
                // }
                var new_data_text = '{';
                for(let i = 0; i < this.table_data.length - 1; i++){
                      new_data_text += '"'
                          + this.table_data[i]["Category"] 
                          + '" : "'
                          + this.table_data[i]["Skills"]
                          + '",';
                }
                new_data_text += '"'
                    + this.table_data[this.table_data.length - 1]["Category"] 
                    + '" : "'
                    + this.table_data[this.table_data.length - 1]["Skills"]
                    + '"}';
                ApronSkillsRef.set(JSON.parse(new_data_text));
            }
        },
        async mounted() {
            let categories = await this.getCategories();
            for(var category in categories) {
                this.table_data.push({
                    'Category': category,
                    'Skills': categories[category]
                });
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