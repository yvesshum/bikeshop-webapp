// This is a generalised filter dropdown/searchable component that doesn't have any actions. It simply allows a view.
// There could be certain actions added by changing what's inside the <li> tags, into <a> tags with a particular href or onclick.
// Assumes that bootstrap is loaded
// Assumes that targetDiv is a valid jQuery reference
// Usage:
//      targetDiv: String of div ID
//      fieldsToBeShown: list of fields to be shown, corresponding letter by letter to GlobalFieldsCollection
//      includeID: boolean of whether to include the ID or not to be shown
// Example: createIDSelector("someID", ["First Name", "Last Name"], true);
async function createIDSelector(targetDiv, fieldsToBeShown, includeID) {
    let db = firebase.firestore();

    // getting data
    let currentActiveSession =  await getCurrentActiveSession(db); // e.g. summer19
    let data = await getActiveUserData(db, currentActiveSession, fieldsToBeShown, includeID); // returns array list of strings ["10001 Yves Shum", "10002 First Second"]

    //html skeleton for dropdown
    let dropDownID =  targetDiv  + 'dropdown';
    $("#" + targetDiv).append($('<div>', {class: 'dropdown', id: dropDownID}));
    const dropDownJQRef = $("#" + dropDownID);
    dropDownJQRef.append('<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">ID Lookup');
    dropDownJQRef.append('<span class="caret"></span></button>');
    let ulID =  targetDiv + 'ul';
    dropDownJQRef.append('<ul class="dropdown-menu" id = ' + ulID + '>');
    const ulJQRef = $("#" + ulID);
    ulJQRef.append('<input class="form-control" id="myInput" type="text" placeholder="Search..">');

    //adding individual pieces of data in
    buildListItems(data, ulJQRef);

    //prevent inner clicks from closing the dropdown menu
    $('.dropdown-menu').click(function(e) {
        e.stopPropagation();
    });

    //adding listener for search bar filtering
    $(document).ready(function(){
        $("#myInput").on("keyup", function() {
            var value = $(this).val().toLowerCase();
            $(".dropdown-menu li").filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
            });
        });
    });
}

function buildListItems(listData, listRef) {
    let i;
    let l = listData.length;
    for (i = 0; i < l; i ++) {
        listRef.append($('<li>', {html: listData[i]}));
    }
}


async function getCurrentActiveSession(database) {
    return new Promise (resolve => {
        resolve(database.collection("GlobalVariables").doc("CurrentActiveQuarter").get().then(doc => {
            if (doc.exists) {
                console.log('t', doc.data());
                return (doc.data().currentActiveQuarter);
            }
            else {
                console.log("collection or document doesn't exist")
            }
        }).catch(error => {
            console.error("Error getting doc:" , error);
        }));
    });
}

async function getActiveUserData(database, session, fields, includeID) {
    var query = await database.collection("GlobalYouthProfile").where("ActivePeriods", "array-contains", session).get();
    var ret = [];

    //Verbose writing, for faster computation
    if (includeID) {
        query.forEach(doc => {
            var r = "";
            r += doc.id;
            r += " ";
            let i;
            for (i = 0; i < fields.length; i ++) {
                r += doc.data()[fields[i]];
                r += " ";
            }
            ret.push(r);
        })
    }
    else {
        query.forEach(doc => {
            let i;
            for (i = 0; i < fields.length; i ++) {
                r += doc.data()[fields[i]];
                r += " ";
            }
            ret.push(r);
        })
    }

    console.log('r', ret);
    return ret;

}