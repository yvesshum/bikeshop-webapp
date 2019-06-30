# Item Ordering

**Objective**: To allow youth to order items in exchange for credit hours 

**Specifications**: 
  1. Order Page
      * Youth selects their name/id or manually inputs their `Youth ID`, `First Name` and `Last Name`
          * User will select from a filter dropdown of currently active youth
      * Youth fills out `Item Name`, `Item Total Cost`, `Item ID`
      * This sends an update to firestore to `GlobalPendingOrders`
          * There needs to be validation that a registered youth has been selected 
          * There needs to be validation that the selected `Youth ID` has sufficient `Current Hours` compared to the `Item Total Cost`
              * If the youth has sufficient `Current Hours` to spend, the youth then gets their `Current hours` correspondingly deducted, and is shown as a negative value in `Pending Hours` as a pending outflow 
          * The firestore document is stored as an ISO date string, and has the following information: `First Name`, `Last Name`, `Youth ID`, `Item ID`, `Item Name`, `Item Total Cost`, `Notes`, and `Status` (String that says pending)
          * Take a look at GlobalPendingOrders if you are confused 
