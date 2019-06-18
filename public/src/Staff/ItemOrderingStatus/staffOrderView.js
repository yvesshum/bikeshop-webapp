/*
Objective: Grab data from GlobalPendingOrders, display it,
and add a toggle to change status (Pending, Approved, Completed)
 */


var db = firebase.firestore();
var pendingOrdersRef = db.collection("GlobalPendingOrders");
var targetTableDiv = "StaffOrderViewTable";

function formatCollection(snapshot) { //formats into array of objects
    var ret = [];
    snapshot.forEach(doc => {
        var data = doc.data();
        data["Order Date"] = (new Date(doc.id).toLocaleString());
        data["documentID"] = doc.id; //this is not shown, used for the sake of convenience in setting status later
        ret.push(data);
    });
    return ret;
}

async function getPendingOrders() {
    var snapshot = await pendingOrdersRef.get();
    var data = formatCollection(snapshot);
    return new Promise(resolve => {
        resolve(data);
    });
}

async function getYouthOrderFormFields() { //returns JSON object {fields: [stuff]}
    return new Promise(resolve => {
        resolve(db.collection("GlobalFieldsCollection").doc("Youth Order Form").get().then(doc => {
            return doc.data();
        }));
    })
}

async function getTableColumns() {
    var fields = await getYouthOrderFormFields();
    var requiredFields = fields["required"];
    var optionalFields = fields["optional"];
    var hiddenFields = fields["hidden"];
    var columns = [];
    columns.push({
        title: "Order Date",
        field: "Order Date",
        align: "left",
    });
    for (var i = 0; i < requiredFields.length;i++){
        columns.push({
            title: requiredFields[i],
            field: requiredFields[i],
            align: "left",
        });
    }
    for (var i = 0; i < optionalFields.length;i++){
        columns.push({
            title: optionalFields[i],
            field: optionalFields[i],
            align: "left",
        });
    }
    for (var i = 0; i < hiddenFields.length;i++){
        columns.push({
            title: hiddenFields[i],
            field: hiddenFields[i],
            align: "left",
        });
    }


    return columns;
}

async function displayPendingOrdersTable() {
    var tableData = await getPendingOrders();
    var tableColumns = await getTableColumns();

    var table = new Tabulator("#"  +targetTableDiv, {
        data: tableData,
        layout: "fitColumns",
        columns: tableColumns,
        pagination: "local",
        paginationSize: "20",
        selectable: 1,
        selectableRangeMode:"click",
        rowSelectionChanged:function(data, rows) {
            $("#numberSelected").text("Number of orders selected: " + data.length);
        },
    });

    async function setStatus(status) {
        var rowData = table.getSelectedData();
        for (var i = 0; i < rowData.length; i ++) {
            var currentDocRef = rowData[i]["documentID"];
            var changedData = rowData[i];
            var currentYouthID  = rowData[i]["Youth ID"];

            switch (status) {
                case "Pending":
                    if (rowData[i]["Status"] === "Pending") {
                        window.alert("Error, can't change pending status to pending status");
                        console.log("Error, can't change pending status to pending status");
                    }
                    else {
                        //updating staff's pending orders view
                        changedData["Status"] = status;
                        delete changedData.documentID;
                        delete changedData["Order Date"];
                        pendingOrdersRef.doc(currentDocRef).update(changedData);

                        //restore Youth's pending amount
                        var youthDocRef = db.collection("GlobalYouthProfile").doc(currentYouthID);
                        var youthDoc = await youthDocRef.get();
                        youthDoc = youthDoc.data();
                        var newPendingHoursValue = (parseFloat(youthDoc["Pending Hours"]) -
                            parseFloat(changedData["Item Cost"])).toString(10);
                        youthDocRef.update({
                            "Pending Hours": newPendingHoursValue,
                        });
                    }
                    break;

                case "Approved":
                    if (rowData[i]["Status"] === "Approved") {
                        window.alert("Error, can't change Approved status to Approved status");
                        console.log("Error, can't change Approved status to Approved status");
                    }
                    else {
                        //updating staff's pending orders view
                        changedData["Status"] = status;
                        delete changedData.documentID;
                        delete changedData["Order Date"];
                        pendingOrdersRef.doc(currentDocRef).update(changedData);

                        //take away pending amount
                        var youthDocRef = db.collection("GlobalYouthProfile").doc(currentYouthID);
                        var youthDoc = await youthDocRef.get();
                        youthDoc = youthDoc.data();
                        var newPendingHoursValue = (parseFloat(youthDoc["Pending Hours"]) +
                            parseFloat(changedData["Item Cost"])).toString(10);
                        youthDocRef.update({
                            "Pending Hours": newPendingHoursValue,
                        });
                    }
                    break;

                case "Completed":
                    if (rowData[i]["Status"] === "Completed") {
                        window.alert("Error, can't change Completed status to Completed status");
                        console.log("Error, can't change Completed status to Completed status");
                    }
                    else if (rowData[i]["Status"] === "Pending") {
                        window.alert("Error, Unable to change status of Pending to Completed. Please set Pending status to Approved First");
                        console.log("Error, Unable to change status of Pending to Completed. Please set Pending status to Approved First");
                    }
                    else {
                        //format and move to Youth Profile
                        changedData["Status"] = status;
                        delete changedData.documentID;
                        delete changedData["Order Date"];
                        delete changedData["First Name"];
                        delete changedData["Last Name"];
                        delete changedData["Youth ID"];
                        db.collection("GlobalYouthProfile").doc(currentYouthID).collection("Order Log").doc(currentDocRef).set(changedData);

                        //remove from GlobalPendingOrder
                        pendingOrdersRef.doc(currentDocRef).delete().then(function() {
                            console.log("Document " + currentDocRef + " successfully closed and moved to Youth's Order Log!");
                        }).catch(function(error) {
                            console.error("Error removing document " + currentDocRef + ": ", error);
                        });
                    }
                    break;

                default:
                    console.log("error in setStatus(), arugment " + status + " is not a valid status");
            }
        }
    }

    async function refreshTable() {
        let newData = await getPendingOrders();
        table.replaceData(newData);
    }

    $("#SetStatusToPending").click(function() {
        setStatus("Pending");
        refreshTable();
    });

    $("#SetStatusToApproved").click(function() {
        setStatus("Approved");
        refreshTable();


    });

    $("#SetStatusToCompleted").click(function() {
        setStatus("Completed");
        refreshTable();
        //remove this item from GlobalPendingOrders
        //add this itme to GlobalYouthProfile -> Order Log

    });

    //add event listener, on data change refresh table

    pendingOrdersRef.onSnapshot(snapshot => {
        refreshTable(); //problem: This grabs all the data again
    })

}


function formatStatus(data, status){
    var ret = data;
    ret["Status"] = status;
    return ret;
}
displayPendingOrdersTable();