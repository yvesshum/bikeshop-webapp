<template>
    <div class = "StaffManageSkills">
        <div class="content">
        <top-bar/>
        <h1 style="margin: 20px">Manage Apron skills here!</h1>
        <PageHeader pageCategory="Staff Headers" pageName="Manage Apron Skills"></PageHeader>
        <!-- <div>
            <b-button variant="success" @click="showAddCategoryModal" style="margin: 1%;">Add Category</b-button>
            <b-button variant="success" @click="showRenameCategoryModal" style="margin: 1%;">Rename Category</b-button>
            <b-button variant="danger" @click="showDeleteCategoryModal" style="margin: 1%;">Delete Category</b-button>
        </div> -->
        <div class="toolbarwrapper">
            <b-dropdown text="Edit Categories" right variant="secondary" class="m-2">
              <b-dropdown-item variant="success" @click="showAddCategoryModal" style="margin: 1%;">Add Category</b-dropdown-item>
              <b-dropdown-item variant="secondary" @click="showRenameCategoryModal" style="margin: 1%;">Rename Category</b-dropdown-item>
              <b-dropdown-item variant="danger" @click="showDeleteCategoryModal" style="margin: 1%;">Delete Category</b-dropdown-item>
            </b-dropdown>
            <b-button variant="success" @click="showAddSkillModal" style="margin: 1%;">Add New Skill</b-button>
            <b-button variant="warning" @click="showConfirmationModal('submit',
              'Confirm submission',
              'Are you sure you want to submit the new apron skills table? Youth with changed or deleted skills will lose their skill information.'
              )" style="margin: 1%;">Save Changes</b-button>
            <b-button variant="info" @click="showConfirmationModal('refresh',
              'Confirm Refresh',
              'Are you sure you want to refresh the apron skills table? Any unsubmitted local changes will be lost.'
              )" style="margin: 1%;">Refresh Table</b-button>
        </div>
        <br>
        <DraggableTable :colors="colors" :groups="groups" :categories="categories" :changes="changes" />
        
        <b-modal v-model = "addCategoryModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Add a New Category
            </template>
            <div class="centerModal">
              <h4>Enter your new category name: </h4>
              <SpecialInput v-model="new_category" ref="new_category" inputType="String" :arguments="{...args.specialInput}"></SpecialInput>
              <h4 class="error_message">{{errorMsg}}</h4>
              <b-button class="mt-3" block @click="checkError(new_category, true, false);" variant = "success">Add Category</b-button>
              <b-button class="mt-3" block @click="closeAddCategoryModal();" variant="secondary">Cancel</b-button>
            </div>
        </b-modal>
        
        <b-modal v-model = "addSkillModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Add a New Skill
            </template>
            <div class="centerModal">
              <h4>Select skill category: </h4>
              <b-dropdown id="dropdown-1" v-bind:text="selected_category" class="m-md-2">
                  <div v-for="category in getUniqueCategories()" :key="category">
                      <b-dropdown-item @click="update_selected_category(category)">{{category}}</b-dropdown-item>
                  </div>
              </b-dropdown>
              <br>
              <h4>Select skill color: </h4>
              <ApronColorSelector
                style="display: inline-block;" :size="32" :selected="selected_color" :hideGray="true"
                @input="apronColorSelected"
              />
              <br>
              <h4>Enter your new skill name: </h4>
              <SpecialInput v-model="new_skill" ref="new_skill" inputType="String" :arguments="{...args.specialInput}"></SpecialInput>
              <h4 class="error_message">{{errorMsg}}</h4>
              <h4 class="success_message">{{successMsg}}</h4>
              <b-button class="mt-3" block @click="checkError(new_skill, false, false);" variant = "success">Add Skill</b-button>
              <b-button class="mt-3" block @click="closeAddSkillModal();" variant="secondary">Done</b-button>
            </div>
        </b-modal>
        
        <b-modal v-model = "renameCategoryModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Rename a Category
            </template>
            <div class="centerModal">
              <h4>Select category to rename: </h4>
              <b-dropdown id="dropdown-1" v-bind:text="selected_category" class="m-md-2">
                  <div v-for="category in getUniqueCategories()" :key="category">
                      <b-dropdown-item @click="update_selected_category(category)">{{category}}</b-dropdown-item>
                  </div>
              </b-dropdown>
              <h4>Enter new name for your category: </h4>
              <SpecialInput v-model="renamed_category" ref="renamed_category" inputType="String" :arguments="{...args.specialInput}"></SpecialInput>
              <h4 class="error_message">{{errorMsg}}</h4>
              <b-button class="mt-3" block @click="checkError(renamed_category, true, true);" variant = "success">Rename Category</b-button>
              <b-button class="mt-3" block @click="closeRenameCategoryModal();" variant="secondary">Cancel</b-button>
            </div>
        </b-modal>
        
        <b-modal v-model = "deleteCategoryModalVisible" hide-footer lazy >
            <template slot="modal-title">
                Select category to Delete
            </template>
            <div class="centerModal">
              <h4>Select category to delete: </h4>
              <b-dropdown id="dropdown-2" v-bind:text="selected_category" class="m-md-2">
                  <div v-for="category in getUniqueCategories()" :key="category">
                      <b-dropdown-item @click="update_selected_category(category)">{{category}}</b-dropdown-item>
                  </div>
              </b-dropdown>
              <h4 class="error_message">{{errorMsg}}</h4>
              <b-button class="mt-3" block @click="showConfirmationModal('delete_category',
                'Confirm Delete Category',
                'Are you sure you want to delete this category? All skills for this category will be deleted.'
                );" variant = "danger">Delete Category</b-button>
              <b-button class="mt-3" block @click="closeDeleteCategoryModal();" variant="secondary">Cancel</b-button>
            </div>
        </b-modal>
        
        <b-modal v-model = "modalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{modalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{modalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">ok</b-button>
        </b-modal>
        
        <b-modal v-model = "confirmationModalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{confirmationModalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{confirmationModalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeConfirmationModal();" variant = "secondary">Cancel</b-button>
            <b-button class="mt-3" block @click="closeConfirmationModal(); confirmed();" variant = "warning">Continue</b-button>
        </b-modal>
        
        <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                Doing some work in the background
            </template>
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong> Loading...</strong>
                </div>
            </div>
        </b-modal>
        <div v-if="unsaved" class="unsaved_bar">
          You have unsaved changes
        </div>
        <!-- <b-button variant="success" @click="submit" style="margin-top:10px">Submit Changes</b-button>
        <br/>
        <b-button variant="info" @click="update" style="margin-top:10px">Refresh Table (Discards changes)</b-button> -->
        </div>
        
        <Footer/>
    </div>
</template>

<script>
    import {db} from '../../firebase';
    import PageHeader from "../../components/PageHeader.vue"
    import ApronColorSelector from "../../components/ApronColorSelector.vue"
    import DraggableTable from "../../components/DraggableTable.vue"
    import { initSpecialInputVal } from '../../scripts/SpecialInit';
    import SpecialInput from '@/components/SpecialInput';
    
    let ApronSkillsRef = db.collection("GlobalVariables").doc("Apron Skills");
    let ApronColorsRef = db.collection("GlobalVariables").doc("Apron Colors");
    
    export default {
        name: 'StaffManageSkills',
        components: {
            PageHeader,
            ApronColorSelector,
            DraggableTable,
            SpecialInput
        },
        data() {
            return {
                selectedRow: null,
                table_data: [],
                current_skills: [],
                current_categories: [],
                new_category: "",
                renamed_category: "",
                new_skill: "",
                modalHeader: "",
                modalMsg: "",
                confirmationModalHeader: "",
                confirmationModalMsg: "",
                modalType: "",
                errorMsg: "",
                successMsg: "",
                selected_category: "Select Category to rename",
                selected_color: {},
                // For draggable table
                colors : [],
                categories : [],
                // contains items of the form { color : c1, category: c2, editable : true, droppable : true, skills : [{ skill}]}
                groups : [],
                loadingModalVisible : false,
                addCategoryModalVisible : false,
                renameCategoryModalVisible : false,
                deleteCategoryModalVisible : false,
                addSkillModalVisible : false,
                confirmationModalVisible : false,
                modalVisible : false,
                args: {
                    specialInput: {
                        style: "text-align: center"
                    }
                },
                // Dictionary from [category, color, skill] to [new color, new category, new skill] or null
                changes : {},
                saved_groups : [],
                unsaved : false
            };
        },
        watch: {
          groups: {
            handler: function (v){
                var changed = false;
                if(v.length != this.saved_groups.length){
                    console.log("Different lengths!")
                    changed = true;
                } else {
                    for(var i = 0; i < v.length; i++){
                      if(v[i]["category"] != this.saved_groups[i]["category"]){
                          console.log("Different categories!")
                          changed = true;
                      }
                      if(v[i]["color"] != this.saved_groups[i]["color"]){
                          console.log("Different colors!")
                          changed = true;
                      }
                      if(v[i]["skills"].length != this.saved_groups[i]["skills"].length){
                          console.log("Different skill lengths!")
                          changed = true;
                      } else {
                          for(var j = 0; j < v[i]["skills"].length; j++){
                            if(v[i]["skills"][j]["skill"] != this.saved_groups[i]["skills"][j]["skill"]){
                                console.log("Different skills!")
                                console.log(v[i]["skills"][j]["skill"])
                                console.log(this.saved_groups[i]["skills"][j]["skill"])
                                changed = true;
                                break
                            }
                          }
                      }
                      if(changed){
                          break;
                      }
                    }
                }
                if(changed){
                  this.unsaved = true;
                } else {
                  this.unsaved = false;
                }
                console.log("That give you any ideas?")
                console.log(v)
                console.log(this.saved_groups)
            },
            deep: true
          }
        },
        methods: {
            // async getCategories() {
            //     let f = await ApronSkillsRef.get();
            //     return f.data();
            // },
            confirmed(){
              if(this.modalType == "submit"){
                  this.submit();
              }
              if(this.modalType == "refresh"){
                  this.getNewData();
              }
              if(this.modalType == "delete_category"){
                  this.delete_category();
              }
            },
            checkError(input, isCat, isRenameCat){
              if(isCat && input.includes("/")){
                this.errorMsg = "Error: Categories cannot contain the forward slash (/) character.";
              } else if(isCat && input == "." || input == ".." ||
                  input == "Select Category to rename" || input == "Select a category for your skill"){
                this.errorMsg = "Error: Invalid category name";
              } else if(isCat && isRenameCat && this.selected_category == "Select Category to rename"){
                this.errorMsg = "Error: You must select a category to rename";
              } else if(isCat && this.categories.includes(input)){
                this.errorMsg = "Error: A category with that name already exists";
              } else if(!isCat && this.selected_category == "Select a category for your skill"){
                this.errorMsg = "Error: You must select a category for your skill";
              } else if(isCat && input.length > 300){
                this.errorMsg = "Error: Maximum category length is 300 characters";
              } else if(!isCat && input.length > 1000){
                this.errorMsg = "Error: Maximum skill length is 1000 characters";
              } else if(input.length == 0){
                this.errorMsg = "Error: Skill and category names cannot be empty";
              } else {
                if(this.modalType == "rename_category"){
                  this.rename_category();
                  this.closeRenameCategoryModal();
                  return;
                }
                if(this.modalType == "add_skill"){
                  this.add_skill();
                  return;
                }
                if(this.modalType == "add_category"){
                  this.add_category();
                  this.closeAddCategoryModal()
                  return;
                }
              }
              this.successMsg = "";
            },
            updateSelected (data) {
                this.selectedRow = data;
            },
            getUniqueCategories() {
                // `this` points to the vm instance
                var new_categories = [];
                for(var i = 0; i < this.categories.length; i++) {
                    new_categories.push(this.categories[i]);
                }
                return [...new Set(new_categories)];
            },
            async update_selected_category(category) {
                this.selected_category = category;
            },
            async update() {
                if(this.table_data.length != 0){
                    this.table_data.splice(0, this.table_data.length);
                }
                let categories = await this.getCategories();
                for(var category in categories) {
                    var skills = categories[category];
                    for(var skill in skills){
                        this.table_data.push({
                            'Category': category,
                            'Skill': skill,
                            'Color': skills[skill]
                        });
                    }
                }
            },
            checkSet(value){
                return (value != "" && value != undefined && value != null);
            },
            async submit() {
                this.showLoadingModal();
                var input = {}
                for(var i = 0; i < this.groups.length; i++){
                    let cat = this.groups[i].category;
                    let col = this.groups[i].color;
                    let skills = this.groups[i].skills;
                    if(!this.checkSet(input[cat])){
                        input[cat] = {}
                    }
                    if(!this.checkSet(input[cat][col])){
                        input[cat][col] = []
                    }
                    for(var j = 0; j < skills.length; j++){
                        input[cat][col].push(skills[j].skill);
                    }
                }
                this.closeLoadingModal();
                let check = ApronSkillsRef.set(input);
                let snapshot = await db.collection("GlobalYouthProfile").get();
                let changes = this.changes;
                await snapshot.forEach(async function (doc) {
                    let data = doc.data();
                    var changed = false;
                    for(const change_string in changes){
                        if(changes[change_string] != null){
                            let change_key = change_string.split("\n");
                            let old_category = change_key[0];
                            let old_color = change_key[1];
                            let old_skill = change_key[2];
                            if(changes[change_string] == false){
                                if(data["Apron Skills"] != undefined && data["Apron Skills"][old_color] != undefined && data["Apron Skills"][old_color]["Skills"][old_category] != undefined){
                                    let skill_array = data["Apron Skills"][old_color]["Skills"][old_category];
                                    let orig_length = skill_array.length;
                                    data["Apron Skills"][old_color]["Skills"][old_category] = skill_array.filter(skill_name => skill_name != old_skill);
                                    let new_length = data["Apron Skills"][old_color]["Skills"][old_category].length;
                                    if(new_length < orig_length){
                                        changed = true;
                                    }
                                }
                                continue
                            }
                            let new_category = changes[change_string][0];
                            let new_color = changes[change_string][1];
                            let new_skill = changes[change_string][2];
                            if(data["Apron Skills"] != undefined && data["Apron Skills"][old_color] != undefined && data["Apron Skills"][old_color]["Skills"][old_category] != undefined){
                                for(var i = 0; i < data["Apron Skills"][old_color]["Skills"][old_category].length; i++){
                                    if(data["Apron Skills"][old_color]["Skills"][old_category][i] == old_skill){
                                        data["Apron Skills"][old_color]["Skills"][old_category].splice(i, 1);
                                        if(data["Apron Skills"][new_color] != undefined){
                                            if(data["Apron Skills"][new_color]["Skills"][new_category] != undefined){
                                                data["Apron Skills"][new_color]["Skills"][new_category].push(new_skill)
                                            } else {
                                                data["Apron Skills"][new_color]["Skills"][new_category] = [new_skill]
                                            }
                                        } else {
                                            data["Apron Skills"][new_color] = {};
                                            data["Apron Skills"][new_color]["Achieved"] = false;
                                            data["Apron Skills"][new_color]["Skills"] = {}
                                            data["Apron Skills"][new_color]["Skills"][new_category] = [new_skill];
                                        }
                                        changed = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if(changed){
                        await db.collection("GlobalYouthProfile").doc(doc.id).update(data);
                    }
                });
                if(check){
                  this.colors = [];
                  this.categories = [];
                  this.groups = [];
                  this.changes = {};
                  await this.getTData();
                  this.closeLoadingModal();
                  this.showModal("Success", "New apron categories and skills submitted");
                }else{
                  this.showModal("Error", "Unable to submit apron skills, this may be an internet connection problem");
                }
            },
            async getColors() {
              let f = await ApronColorsRef.get();
              return f.data()["Colors"];
            },
            async getCategoryData() {
              let f = await ApronSkillsRef.get();
              return f.data();
            },
            async getNewData() {
                this.showLoadingModal();
                this.colors = [];
                this.categories = [];
                this.groups = [];
                this.changes = {};
                await this.getTData();
                this.closeLoadingModal();
                this.showModal("Table Refreshed", "The table should contain the latest information");
            },
            async apronColorSelected(new_color){
              this.selected_color = new_color;
            },
            showLoadingModal() {
                this.loadingModalVisible = true;
            },
        
            closeLoadingModal() {
                this.loadingModalVisible = false;
            },
            showModal(header, msg) {
                this.modalHeader = header;
                this.modalMsg = msg;
                this.modalVisible = true;
            },
            closeModal() {
                this.modalVisible = false;
            },
            showConfirmationModal(modalType, header, msg) {
                if(modalType == "delete_category"){
                  if(this.selected_category == "Select Category to delete"){
                    this.errorMsg = "You must select a category to delete";
                    return;
                  }
                }
                this.confirmationModalHeader = header;
                this.confirmationModalMsg = msg;
                this.modalType = modalType;
                this.confirmationModalVisible = true;
                if(modalType == "delete_category"){
                  this.closeDeleteCategoryModal();
                }
            },
            closeConfirmationModal() {
                this.confirmationModalVisible = false;
            },
            showAddCategoryModal() {
                this.errorMsg = "";
                this.modalType = "add_category";
                this.new_category = initSpecialInputVal("String");
                this.addCategoryModalVisible = true;
            },
            closeAddCategoryModal() {
                this.addCategoryModalVisible = false;
            },
            showAddSkillModal() {
                this.errorMsg = "";
                this.successMsg = "";
                this.new_skill = initSpecialInputVal("String");
                this.modalType = "add_skill";
                this.selected_category = "Select a category for your skill";
                if(this.colors.length > 1){
                  this.selected_color = this.colors[1];
                } else if(this.colors.length > 0){
                  this.selected_color = this.colors[0];
                }
                this.addSkillModalVisible = true;
            },
            closeAddSkillModal() {
                this.addSkillModalVisible = false;
            },
            change_existing(old_value, new_value, change_type){
                for(const change_string in this.changes){
                    let change_key = change_string.split("\n")
                    var old_category, old_color, old_skill;
                    var changed = false;
                    if(this.changes[change_string] == null){
                        old_category = change_key[0];
                        old_color = change_key[1];
                        old_skill = change_key[2];
                    } else if(this.changes[change_string] == false){
                        continue
                    } else {
                        old_category = this.changes[change_string][0];
                        old_color = this.changes[change_string][1];
                        old_skill = this.changes[change_string][2];
                    }
                    if(change_type == "del_category" && old_category == old_value){
                      this.changes[change_string] = false
                    }
                    if(change_type == "del_color" && old_color == old_value){
                      this.changes[change_string] = false
                    }
                    if(change_type == "del_skill" && old_category + "\n" + old_color + "\n" + old_skill == old_value){
                      this.changes[change_string] = false
                    }
                    if(change_type == "category" && old_category == old_value){
                        this.changes[change_string] = [new_value, old_color, old_skill];
                        changed = true;
                    }
                    if(change_type == "color" && old_color == old_value){
                        this.changes[change_string] = [old_category, new_value, old_skill];
                        changed = true;
                    }
                    if(change_type == "skill" && old_skill == old_value){
                        this.changes[change_string] = [old_category, old_color, new_value];
                        changed = true;
                    }
                    if(change_type == "move" && old_category + "\n" + old_color + "\n" + old_skill == old_value){
                        let new_category = new_value.split("\n")[0];
                        let new_color = new_value.split("\n")[1];
                        this.changes[change_string] = [new_category, new_color, old_skill];
                        changed = true;
                    }
                    if(changed && change_string == this.changes[change_string].join("\n")){
                        this.changes[change_string] = null
                    }
                }
            },
            showRenameCategoryModal() {
                this.errorMsg = "";
                this.renamed_category = initSpecialInputVal("String");
                this.modalType = "rename_category";
                this.selected_category= "Select Category to rename"
                this.renameCategoryModalVisible = true;
            },
            closeRenameCategoryModal() {
                this.renameCategoryModalVisible = false;
            },
            showDeleteCategoryModal() {
                this.errorMsg = "";
                this.selected_category= "Select Category to delete"
                this.deleteCategoryModalVisible = true;
            },
            closeDeleteCategoryModal() {
                this.deleteCategoryModalVisible = false;
            },
            async add_category(){
                this.categories.push(this.new_category);
                for(var i = 0; i < this.colors.length; i++){
                  let color = this.colors[i].name;
                  this.groups.push({
                      'category': this.new_category,
                      'color': color,
                      'skills': [],
                      'editable': true,
                      'droppable': true, 
                  });
                }
            },
            async rename_category(){
              for(let i = 0; i < this.categories.length; i++){
                  if(this.categories[i] == this.selected_category){
                      this.categories[i] = this.renamed_category;
                  }
              }
              for(let i = 0; i < this.groups.length; i++){
                  if(this.groups[i]["category"] == this.selected_category){
                      this.groups[i]["category"] = this.renamed_category;
                  }
              }
              this.change_existing(this.selected_category, this.renamed_category, "category")
            },
            async delete_category(){
              for(var i = 0; i < this.categories.length; i++){
                  if(this.categories[i] == this.selected_category){
                      this.categories.splice(i, 1);
                      let new_groups = this.groups.filter(group => group.category != this.selected_category);
                      this.groups = new_groups;
                      this.change_existing(this.selected_category, null, "del_category")
                      return
                  }
              }
            },
            async add_skill(){
                for(var i = 0; i < this.groups.length; i++){
                    if(this.groups[i].color == this.selected_color.name &&
                      this.groups[i].category == this.selected_category){
                        this.groups[i].skills.push({
                          skill : this.new_skill
                        });
                    }
                }
                this.successMsg = "Added skill: " + this.new_skill;
                this.new_skill = initSpecialInputVal("String");
                this.errorMsg = "";
            },
            getGroupsByColorCategory( color, category){
              for(var i = 0; i < this.groups.length; i++){
                if(this.groups[i].color == color.name && this.groups[i].category == category){
                  return [ this.groups[i] ] ;
                }
              }
              var placeholder = this.placeholder;
              placeholder["category"] = category;
              placeholder["color"] = color.name;
              return placeholder;
            },
            async getTData(){
              this.colors = await this.getColors();
              let categoryData = await this.getCategoryData();
              for(var category in categoryData) {
                this.categories.push(category);
                for(var j = 0; j < this.colors.length; j++){
                  let color = this.colors[j].name;
                  var skills = []
                  if(categoryData[category][color] != undefined){
                    for(var i = 0; i < categoryData[category][color].length; i++){
                      skills.push({ skill : categoryData[category][color][i] });
                      this.changes[category + "\n" + color + "\n" + categoryData[category][color][i]] = null
                    }
                  }
                  this.groups.push({
                      'category': category,
                      'color': color,
                      'skills': skills,
                      'editable': true,
                      'droppable': true, 
                  });
                }
              }
              this.saved_groups = [];
              for(var i = 0; i < this.groups.length; i++){
                  var new_obj = Object.assign({}, this.groups[i]);
                  var new_skills = []
                  for(var j = 0; j < new_obj["skills"].length; j++){
                    new_skills.push(JSON.parse(JSON.stringify(new_obj["skills"][j])))
                  }
                  new_obj["skills"] = new_skills
                  this.saved_groups.push(new_obj)
              }
            }
        },
        async mounted() {
            this.showLoadingModal();
            this.new_category = initSpecialInputVal("String");
            this.new_skill = initSpecialInputVal("String");
            this.renamed_category = initSpecialInputVal("String");
            await this.getTData();
            this.closeLoadingModal();
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
    .toolbarwrapper {
      margin-bottom: 1rem;
    }
    .centerModal{
      text-align: center;
      margin-left: auto;
      margin-right: auto;
    }
    .error_message{
      color: red;
    }
    .success_message{
      color: green;
    }
    .unsaved_bar {
      /* padding: 2px 15px !important; */
      /* min-height: 15px;
      width: -moz-calc(99% - 260px);
      width: -webkit-calc(99% - 260px);
      width: -o-calc(99% - 260px);
      width: calc(99% - 260px); */
      width: 100%;
      background-color: #ffc107;
      color: black;
      position: fixed;
      right: 0%;
      /* top: 108px; */
      bottom: 0px;
      text-align: center;
    }
</style>
