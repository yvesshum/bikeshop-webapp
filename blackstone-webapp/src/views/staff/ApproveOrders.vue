<template>
    <div>
        <top-bar/>
        <h1 class="title">Order Status Dashboard</h1>
        <div class="toolbarwrapper">
              <b-button-toolbar style="justify-content: center;">
                    <b-dropdown right text="Set Status" style="margin: 1%;">
                        <b-dropdown-item @click="setPending">Pending</b-dropdown-item>
                        <b-dropdown-item @click="setApproved">Approved</b-dropdown-item>
                        <b-dropdown-item @click="setCompleted">Completed</b-dropdown-item>
                    </b-dropdown>
                    <b-button variant="success" @click="editNote" style="margin: 1%;">Edit note</b-button>
                    <b-button variant="danger" @click="reject" style="margin: 1%;">Delete Order</b-button>
                    <b-button variant="info" @click="getNewData" style="margin: 1%;">Refresh Table</b-button>
              </b-button-toolbar>

            <p style="margin: 1rem;">Selected {{selected.length}} rows</p>
        </div>
        <p v-if="items.length === 0">No fields found!</p>
        <b-table
            selectable
            select-mode="multi"
            selectedVaraint = "success"
            :items="items"
            :fields="fields"
            @row-selected="rowSelected"
            responsive="sm"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            id="order_table"
            :busy="isBusy"
        >
            <div slot="table-busy" class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Loading...</strong>
            </div>
        </b-table>

        <b-modal v-model = "modalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{modalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{modalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeModal" variant = "primary">ok</b-button>
        </b-modal>

        <b-modal v-model = "rejectModalVisible" hide-footer lazy >
            <template slot="modal-title">
                {{rejectModalHeader}}
            </template>
            <div class="d-block text-center">
                <h3>{{rejectModalMsg}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeRejectModal" variant = "secondary">cancel</b-button>
            <b-button class="mt-3" block @click="closeRejectModal(); confirmedDelete();" variant = "danger">proceed</b-button>
        </b-modal>

        <b-modal v-model = "editModalVisible" hide-footer lazy>
            <template slot = "modal-title">
                Editing
            </template>
            <!-- <div class="d-block text-center">
                <h3>Edit the following message:</h3>
            </div> -->
            <b-form-textarea
                id="textarea"
                v-model="editMsg"
                placeholder="Enter a new message here.."
                rows="2"
                max-rows="5"
            ></b-form-textarea>

            <b-button class="mt-3" block @click="saveNote(); closeEditModal()" variant = "success">Save</b-button>
            <b-button class="mt-3" block @click="closeEditModal" variant="warning">Cancel</b-button>

        </b-modal>
    </div>



</template>
<script>
    import {db} from '../../firebase';
    import {Timestamp} from '../../firebase'
    export default {
        name: 'ApproveOrders',
        components: {
        },
        data() {
            return {
                sortBy: 'Order Date',
                sortDesc: false,
                fields: [],
                items: [],
                selected: [],
                modalHeader: "",
                modalMsg: "",
                modalVisible: false,
                rejectModalVisible: false,
                rejectModalHeader: "",
                rejectModalMsg: "",
                rejectingDocumentID: "",
                rejectingYouthID: "",
                editModalVisible: false,
                editMsg: "",
                isBusy: true,
            };

        },
        methods: {
            rowSelected(items){
                this.selected = items;
            },
            async getHeaders() {
                let headers = await db.collection("GlobalFieldsCollection").doc("Youth Order Form").get();
                headers = headers.data();
                let fields = [];
                ['required', 'optional', 'hidden'].forEach(ftype => { //specific ordering
                    for (let i = 0; i < headers[ftype].length; i ++) {
                        fields.push({key: headers[ftype][i], sortable:true});
                }})
                this.fields = fields;
            },

            async getTData() {
                let snapshot = await db.collection("GlobalPendingOrders").get();
                this.items = this.formatCollection(snapshot);
            },

            formatCollection(snapshot) {
                let ret = [];
                snapshot.forEach(doc => {
                    let data = doc.data();
                    data["Document ID"] = doc.id; //this is not shown, used for the sake of convenience in setting status later
                    data["Order Date"] = data["Order Date"].toDate();
                    ret.push(data);
                });
                return ret;
            },

            parse(item) {
                return JSON.parse(JSON.stringify(item));
            },

            showModal(header, msg) {
                this.modalHeader = header;
                this.modalMsg = msg;
                this.modalVisible = true;1
            },

            showRejectModal(header, msg) {
                this.rejectModalHeader = header;
                this.rejectModalMsg = msg;
                this.rejectModalVisible = true;
            },

            async setPending() {

                let rows = this.selected ;
                //chceck if the row is valid to be set as pending
                for (let i = 0; i < rows.length; i++) {
                    let curData = rows[i];

                    if (curData["Status"] === "Pending") {
                        this.showModal("Error", "Unable to set already pending status to 'pending' in the order of " + curData["First Name"] + " " + curData["Last Name"] + " on " + curData["Order Date"]);
                        break;
                    }
                    else {
                        //changed GlobalPendingOrders to be unique Document IDs
                        //that way we should be able to access the Document ID
                        let YouthID = curData["Youth ID"];
                        let err = await db.collection("GlobalPendingOrders").doc(curData["Document ID"]).update({Status: "Pending"});
                        if (err) {
                            window.alert("Error on setting status, please check your internet connection and try again");
                            return null;
                        }
                        //move hours from pending back to hours spent
                        let YouthProfile = await db.collection("GlobalYouthProfile").doc(YouthID).get();
                        YouthProfile = YouthProfile.data();

                        db.collection("GlobalYouthProfile").doc(YouthID).update({
                            "Pending Hours": (Math.round((parseFloat(YouthProfile["Pending Hours"]) - parseFloat(curData["Item Total Cost"]))*100)/100),
                            // "Hours Spent": (parseFloat(YouthProfile["Hours Spent"]) - parseFloat(curData["Item Total Cost"]))
                        }).then((err) => {
                            if (err) this.showModal("Error", "Unable to update Youth Profile's hours, this may be an internet connection problem")
                            return null;
                        });

                        //change Status text locally
                        this.changeLocalText(curData["Document ID"], "Pending");
                    }
                }

            },

            async setApproved() {
                let rows = this.selected;

                for (let i = 0; i < rows.length; i ++) {
                    let curData = rows[i];
                    if (curData["Status"] === "Approved") {
                        this.showModal("Error", "Unable to set already approved status to 'approved' in the order of " + curData["First Name"] + " " + curData["Last Name"] + " on " + curData["Order Date"]);
                        break;
                    }
                    else {
                        let YouthID = curData["Youth ID"];
                        db.collection("GlobalPendingOrders").doc(curData["Document ID"]).update({
                            Status: "Approved"}).catch(err => {
                                window.alert("Error " + err);
                                return null;
                        });
                        let YouthProfile = await db.collection("GlobalYouthProfile").doc(YouthID).get();
                        YouthProfile = YouthProfile.data();

                        db.collection("GlobalYouthProfile").doc(YouthID).update({
                            "Pending Hours": Math.round(((parseFloat(YouthProfile["Pending Hours"]) + parseFloat(curData["Item Total Cost"]))*100)/100)
                        }).catch(err => {
                            window.alert("Error " + err);
                            return null;
                        });

                        //change text locally
                        this.changeLocalText(curData["Document ID"], "Approved");

                    }
                }


            },

            async setCompleted() {
                let rows = this.selected;
                for (let i = 0; i < rows.length; i++) {
                    let curData = rows[i];
                    if (curData["Status"] === "Pending") {
                        this.showModal("Error", "Unable to set pending orders to complete, orders must first be set in the following order: Pending -> Approved -> Complete")
                        break;
                    }
                    else {
                        //delete remotely
                        let YouthID = curData["Youth ID"];
                        db.collection("GlobalPendingOrders").doc(curData["Document ID"]).delete().catch(err => {
                            window.alert("Error " + err);
                            return null;
                        });

                        //create entry in order log
                        let YouthOrderLogRef = db.collection("GlobalYouthProfile").doc(YouthID).collection("Order Log");
                        let excludedFields = ["Youth ID", "First Name", "Last Name", "Status", "Document ID"]
                        let res = {};
                        Object.keys(curData).forEach(key => {
                            if (!excludedFields.includes(key)) {
                                res[key] = curData[key];
                            }
                        })
                        res["Order Date"] = Timestamp.fromDate(res["Order Date"]);
                        YouthOrderLogRef.doc().set(res).catch(err => {
                            window.alert("Err: "+ err);
                            return null;
                        });

                        //delete locally
                        for (let  j = 0; j < this.items.length; j++) {
                            if (this.items[j]["Document ID"] === curData["Document ID"]) {
                                this.items.splice(j, 1);
                                this.$root.$emit('bv::refresh::table', 'order-table');
                                this.showModal("Success", "Successfully completed order!");
                            }
                        }
                    }
                }

            },

            changeLocalText(id, status) {
                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === id) {
                        this.items[i]["Status"] = status;
                        this.$root.$emit('bv::refresh::table', 'order-table');
                        this.showModal("Success", "changed status to " + status);
                        break;
                    }
                }
            },

            closeModal() {
                this.modalVisible = false;
            },

            closeRejectModal() {
                this.rejectModalVisible = false;
            },

            async getNewData() {
                await this.getTData();
                this.$root.$emit('bv::refresh::table', 'order-table');
                this.showModal("Table Refreshed!", "If you don't see something expected check the firebase backend console!")

            },

            reject() {
                let rows = this.selected;
                for (let i = 0; i < rows.length; i++){
                    let curRow = rows[i];
                    this.rejectingDocumentID = curRow["Document ID"];
                    this.rejectingYouthID = curRow["Youth ID"];
                    this.showRejectModal("Are you sure?", "This cannot be undone! You are about to delete "
                        + curRow["First Name"] + " " + curRow["Last Name"] + "'s order on " + curRow["Order Date"]);
                }

            },

            async confirmedDelete() {
                //adjust hours
                let YouthProfile = await db.collection("GlobalYouthProfile").doc(this.rejectingYouthID).get();
                YouthProfile = YouthProfile.data();

                let itemIndex = 0;
                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === this.rejectingDocumentID) {
                        itemIndex = i;
                        break;
                    }
                }

                //if rejecting document is already approved
                if (this.items[itemIndex]["Status"] === "Approved") {
                    //decrease hours spent by item cost
                    let newHoursSpent = (Math.round((parseFloat(YouthProfile["Hours Spent"]) - parseFloat(this.items[itemIndex]["Item Total Cost"]))*100)/100);
                    db.collection("GlobalYouthProfile").doc(this.rejectingYouthID).update({
                        "Hours Spent": newHoursSpent
                    }).catch(err => {
                        window.alert("Error: " + err);
                        return null;
                    })
                }
                else { //if rejecting document is of pending status
                    let newHoursSpent = (Math.round(parseFloat(YouthProfile["Hours Spent"]) - parseFloat(this.items[itemIndex]["Item Total Cost"])*100)/100);
                    let newPendingHours = (Math.round(parseFloat(YouthProfile["Pending Hours"]) + parseFloat(this.items[itemIndex]["Item Total Cost"])*100)/100);
                    db.collection("GlobalYouthProfile").doc(this.rejectingYouthID).update({
                        "Hours Spent": newHoursSpent,
                        "Pending Hours": newPendingHours
                    }).catch(err => {
                        window.alert("Error: " + err);
                        return null;
                    });
                }

                this.toggleBusy();
                //remove order from database
                db.collection("GlobalPendingOrders").doc(this.rejectingDocumentID).delete().catch(err => {
                    window.alert("Error on deleting: " + err);
                    return null;
                });

                //remove locally
                this.items.splice(itemIndex, 1);

                this.$root.$emit('bv::refresh::table', 'order-table');

                this.showModal("Successfully deleted order", "successfully deleted order with ID of " + this.rejectingDocumentID);
                this.rejectingDocumentID = "";
                this.toggleBusy();


            },

            editNote() {
                if (this.selected.length > 1) this.showModal("Error", "You can only edit one note at a time!");
                else {
                    this.editMsg = this.selected[0]["Notes"];
                    this.showEditModal();
                }

            },

            showEditModal() {
                this.editModalVisible = true;
            },

            closeEditModal() {
                this.editMsg = "";
                this.editModalVisible = false;
            },

            saveNote() {
                let note = this.editMsg;
                let docID = this.selected[0]["Document ID"];
                db.collection("GlobalPendingOrders").doc(docID).update({"Notes": this.editMsg}).catch(err => {
                    window.alert("Err: ", err);
                    return null;
                });

                for (let i = 0; i < this.items.length; i++) {
                    if (this.items[i]["Document ID"] === docID) {
                        this.items[i]["Notes"] = note;
                        break;
                    }
                }


            },

            toggleBusy() {
                this.isBusy = !this.isBusy;
            },


        },

        async mounted() {
            await this.getHeaders();
            await this.getTData();
            this.toggleBusy();

        },
    }
</script>

<style>
  .toolbarwrapper {
  margin-bottom: 1rem;
  }
  .title {
  margin-bottom: 1rem;
  }

</style>
