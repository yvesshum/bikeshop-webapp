<!--
Pretty much works the same as CategoryEditor, with a few modifications.
-->
<template>
<div>
    <b-button-group style="margin-bottom:10px">
        <b-button variant="warning" @click="resetOrdering">Reset Ordering</b-button>
        <b-button variant="success" @click="saveOrdering">Save Ordering</b-button>
    </b-button-group>

    <draggable v-model="category_data" @start="drag=true" @end="drag=false">
        <CategoryCard
            v-for="item in category_data"
            :key="item.data"
            :category="item.data"
            v-on:editClicked="editButtonClicked"
            v-on:deleteClicked="deleteButtonClicked"
        />
    </draggable>
    <p v-if="category_data.length === 0">No Categories Found </p>
    <br>
    <b-button-group>
        <b-button variant="info" @click="addButtonClicked">
            Add a category <font-awesome-icon icon="plus" class ="icon alt"/>
        </b-button>
    </b-button-group>

    <!-- Modals -->
    <!-- Msg -->
    <b-modal v-model = "modal.msg.visible" hide-footer lazy>
        <template slot="modal-title">
            {{modal.msg.title}}
        </template>
        <div class="d-block text-center">
            <h3>{{modal.msg.text}}</h3>
        </div>
        <b-button class="mt-3" block @click="closeMsgModal" variant = "primary">ok!</b-button>
    </b-modal>

    <!-- Loading -->
    <b-modal v-model = "modal.loading.visible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
        <template slot="modal-title">
            {{modal.loading.title}}
        </template>
        <div class="d-block text-center">
            <div slot="table-busy" class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong> Loading...</strong>
            </div>
        </div>
    </b-modal>

    <!-- Editing -->
    <b-modal v-model = "modal.edit.visible" hide-footer lazy>
        <template slot = "modal-title">
            Editing Category
        </template>
        <p>Category Name:</p>
        <b-form-textarea
                id="textarea"
                v-model="modal.edit.category_name"
                placeholder="Edit here.."
                rows="1"
                max-rows="3"
                :state="isValidEditingCategoryName"
        ></b-form-textarea>
        <br>
        <strong>(This new name must not already exist)</strong>
        <b-button class="mt-3" block @click="save_edit(); edit_closeModal()" :disabled="!isValidEditingCategoryName" variant="warning">Save and change all existing uses of the category</b-button>
        <b-button class="mt-3" block @click="edit_closeModal()" variant="success">Cancel</b-button>
    </b-modal>

    <!-- Deleting -->
    <b-modal v-model = "modal.delete.visible" hide-footer lazy>
        <template slot = "modal-title">
            Deleting Category
        </template>
        <div class="d-block text-center">
            <h3>Are you sure you want to delete {{modal.delete.category_name}}?</h3>
        </div>
        <b-button class="mt-3" block @click="deleteCategory(); delete_closeModal()" variant = "danger">Permanently delete this category and remove all existing uses of this category</b-button>
        <b-button class="mt-3" block @click="delete_closeModal()" variant="success">Cancel</b-button>
    </b-modal>

    <!-- Adding -->
    <b-modal v-model = "modal.add.visible" hide-footer lazy>
        <template slot = "modal-title">
            Adding A Category
        </template>
        <p style="margin-bottom: 0">Category Name</p>
        <b-form-textarea
                id="textarea"
                v-model="modal.add.category_name"
                placeholder="This cannot be empty and must not already exist!"
                :state="isValidNewCategoryName"
                size="sm"
                rows="1"
                max-rows="3"
        ></b-form-textarea>
        <b-button class="mt-3" block @click="addCategory(); add_closeModal()" variant = "warning" :disabled="!isValidNewCategoryName">Add a new category and change all existing documents to include this category</b-button>
        <b-button class="mt-3" block @click="add_closeModal()" variant="success">Cancel</b-button>
    </b-modal>


</div>
</template>

<script>
import draggable from 'vuedraggable'
import CategoryCard from '../components/CategoryCard.vue'
import {db} from '@/firebase.js'

export default {
    name: 'CategoryEditor',
    components: {
        CategoryCard,
        draggable
    },
    props: {
        sourceFieldName: String, //required, optional, hidden
        sourceDocument: String, //name of doc of where the categories are from 
        elements: Array, //Actual data of the categories
        collectionsToEdit: Array, //name of collection of where the categories are from
        subcollectionsToEdit: Array
    },
    computed: {
        isValidNewCategoryName: function() {
            let res = !this.category_data.some(field => field.data === this.modal.add.category_name) && this.modal.add.category_name.length > 0
            return res
        },

        isValidEditingCategoryName: function() {
            let res = !this.category_data.some(field => field.data === this.modal.edit.category_name) && this.modal.edit.category_name.length > 0
            // console.log(res)
            return res
        }
    },
    data() {
        return {
            category_data: [],
            category_data_initial_copy: [],
            modal: {
                msg: {
                    visible: false,
                    title: "",
                    text: ""
                },
                loading: {
                    visible: false,
                    title: ""
                },
                edit: {
                    visible: false,
                    category_name: "",
                    original_category_name: "",
                },
                delete: {
                    visible: false,
                    category_name: ""
                },
                add: {
                    visible: false,
                    category_name: "",
                    initial_value: 0 // Deprecated, it's pretty much always 0 lol
                }
            }
        }
    },
    mounted() {
        this.category_data = this.elements;
        this.category_data_initial_copy = this.parse(this.category_data);
    },
    methods: {
        parse(item) {
            return JSON.parse(JSON.stringify(item));
        },

        editButtonClicked(data) {
            this.modal.edit.category_name = Object.keys(data)[0];
            this.modal.edit.original_category_name = Object.keys(data)[0];
            this.modal.edit.visible = true;
        },

        deleteButtonClicked(category) {
            this.modal.delete.category_name = Object.keys(category)[0];
            this.modal.delete.visible = true;  
        },
        
        addButtonClicked() {
            this.modal.add.category_name = "";
            this.modal.add.visible = true;
        },

        resetOrdering() {
            this.category_data = this.parse(this.category_data_initial_copy); // DEEP copy

        },

        async saveOrdering() {
            this.showLoadingModal("One second...");
            let categories = [];
            this.category_data.forEach(category => {
                categories.push(category.data);
            });

            let updateVal = {};
            updateVal[this.sourceFieldName] = categories;

            let updateStatus = await db.collection("GlobalVariables")
                                .doc(this.sourceDocument).update(updateVal);
            
            if (updateStatus) {
                window.alert("Error on updating Global Categories Collection doc: " + this.sourceDocument);
                return null;
            }
            this.category_data_initial_copy = this.parse(this.category_data); // DEEP COPY
            this.closeLoadingModal();
            this.showMsgModal("Success", "The ordering has been saved.");
        },

        //Modal Methods
        showMsgModal(title, text) {
            this.modal.msg.visible = true;
            this.modal.msg.title = title;
            this.modal.msg.text = text;
        },
        closeMsgModal() {
            this.modal.msg.visible = false;
        },
        showLoadingModal(title) {
            this.modal.loading.visible = true;
            this.modal.loading.title = title;
        },
        closeLoadingModal() {
            this.modal.loading.visible = false;
        },
        edit_closeModal() {
            this.modal.edit.visible = false;
        },
        delete_closeModal() {
            this.modal.delete.visible = false;
        },
        add_closeModal() {
            this.modal.add.visible = false;
        },
        async save_edit() {
            this.edit_closeModal();
            this.showLoadingModal("Saving..");
            let newCategoryName = this.modal.edit.category_name;
            for (let i = 0; i < this.category_data.length; i++) {
                if (this.category_data[i].data === this.modal.edit.original_category_name) {
                    //Update GlobalCategoriesCollection
                    //reshape

                    let updatedCategoryNames = this.category_data.map(element => {
                        return element.data
                    })

                    // console.log('u', updatedCategoryNames)
                    updatedCategoryNames[i] = newCategoryName;
                    let updateObject = {};
                    updateObject[this.sourceFieldName] = updatedCategoryNames;
                    // console.log(updateObject);
                    

                    let updateStatus = await db.collection("GlobalVariables").doc(this.sourceDocument).update(updateObject);
                    if (updateStatus) {
                        window.alert("Error on updating GlobalCategoriesCollection on firebase. " + updateStatus);
                        return null;
                    }

                    // Updating all the collections that needs an update
                    for (let j = 0; j < this.collectionsToEdit.length; j++) {
                        let query = await db.collection(this.collectionsToEdit[j]).get();
                        let batch = db.batch();
                        query.forEach(async doc => {
                            let id = doc.id;
                            let data = doc.data();
                            data[newCategoryName] = data[this.modal.edit.original_category_name]
                            delete data[this.modal.edit.original_category_name];
                            batch.set(db.collection(this.collectionsToEdit[j]).doc(id), data);
                        })
                        await batch.commit();
                    }
                    for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                        let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                        let batch = db.batch();
                        query.forEach(async doc => {
                            let path = doc.ref.path
                            let data = doc.data();
                            data[newCategoryName] = data[this.modal.edit.original_category_name]
                            delete data[this.modal.edit.original_category_name];
                            // console.log(data);
                            batch.set(db.doc(path), data);
                        })
                        await batch.commit()
                    }

                    //Local Update
                    this.category_data[i].data = newCategoryName;

                    //Updating the copied version. Since ordering may have changed, we'll need to search through this.
                    for (let j = 0; j < this.category_data_initial_copy.length; j++) {
                        if (this.category_data_initial_copy[j].data === this.modal.edit.original_category_name) {
                            this.category_data_initial_copy[j].data = newCategoryName
                        }
                    }

                    this.closeLoadingModal();
                    this.showMsgModal("Success!", "Successfully updated firebase Global Categories Collection and corresponding documents")
                    break;
                }
            }
        },
        async deleteCategory() {
            this.delete_closeModal();
            this.showLoadingModal();

            let updatedCategories = this.category_data.map(element => {return element.data});
            for (let i = 0; i < updatedCategories.length; i ++) {
                if (updatedCategories[i] === this.modal.delete.category_name) {
                    // Delete from global categories collection
                    updatedCategories.splice(i, 1);
                    let updateValue = {};
                    updateValue[this.sourceFieldName] = updatedCategories;
                    // console.log(updateValue);

                    let deleteStatus = await db.collection("GlobalVariables").doc(this.sourceDocument).set(updateValue);
                    if (deleteStatus) {
                        window.alert("Error on removing a category in GlobalCategoriesCollection. Category: " + this.modal.delete.category_name + ", doc: " + this.sourceDocument);
                        return null;
                    }

                    // Delete from collections
                    for (let j = 0; j < this.collectionsToEdit.length; j++) {
                        let query = await db.collection(this.collectionsToEdit[j]).get();
                        let batch = db.batch();
                        query.forEach(async doc => {
                            let id = doc.id;
                            let data = doc.data();
                            delete data[this.modal.delete.category_name]
                            batch.set(db.collection(this.collectionsToEdit[j]).doc(id), data);
                        })
                        await batch.commit()
                    }
                    for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                        let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                        let batch = db.batch();
                        query.forEach(async doc => {
                            let path = doc.ref.path
                            let data = doc.data();
                            delete data[this.modal.delete.category_name]
                            batch.set(db.doc(path), data);
                        })
                        await batch.commit()
                    }

                    // Delete locally 
                    this.category_data.splice(i, 1);

                    // Ordering might be different, have to search for it again
                    for (let j = 0; j < this.category_data_initial_copy.length; j ++) {
                        if (this.category_data_initial_copy[j].data === this.modal.delete.category_name) {
                            this.category_data_initial_copy.splice(j, 1);
                            break;
                        }
                    }

                    this.modal.delete.category_name = "";

                    this.closeLoadingModal();
                    this.showMsgModal("Success!", "Successfully deleted category in GlobalCategoriesCollection and corresponding documents");

                    break;
                }
            }
        },
        async addCategory() {
            this.modal.add.visible = false;
            this.showLoadingModal();

            // Update GlobalVariables
            let updatedCategories = this.category_data.map(element => {return element.data})
            updatedCategories.push(this.modal.add.category_name);
            let updateObject = {};
            updateObject[this.sourceFieldName] = updatedCategories;
            let updateStatus = await db.collection("GlobalVariables").doc(this.sourceDocument).update(updateObject);
            if (updateStatus) {
                window.alert("Error on updating GlobalCategoriesCollection on firebase. " + updateStatus);
                return null;
            }

            //Update Collections
            for (let j = 0; j < this.collectionsToEdit.length; j++) {
                let query = await db.collection(this.collectionsToEdit[j]).get();
                let batch = db.batch();
                query.forEach(async doc => {
                    let id = doc.id;
                    let data = doc.data();
                    data[this.modal.add.category_name] = 0;
                    batch.set(db.collection(this.collectionsToEdit[j]).doc(id), data);
                })
                await batch.commit();
            }
            for (let j = 0; j < this.subcollectionsToEdit.length; j ++) {
                let query = await db.collectionGroup(this.subcollectionsToEdit[j]).get();
                let batch = db.batch();
                query.forEach(async doc => {
                    let path = doc.ref.path
                    let data = doc.data();
                    data[this.modal.add.category_name] = 0;
                    batch.set(db.doc(path), data);
                })
                await batch.commit();

            }

            // Updating Locally 

            this.category_data.push({"data": this.modal.add.category_name});
            this.category_data_initial_copy.push({"data": this.modal.add.category_name});

            // Reset
            this.modal.add.category_name = "";

            this.closeLoadingModal();
            this.showMsgModal("Success!", "Added a new category in GlobalCategoriesCollection and corresponding documents.");
        }

    }
}
</script>

<style>

</style>