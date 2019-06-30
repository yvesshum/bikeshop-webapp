# Hour Logging Approval

Purpose: To let staff verify youth's hour logging requests. 

Requirements: 
  * This is pretty much similar to Item Order Status, there should be a UI for the user to approve or disprove certain fields. 
  * There are an unknown number of categories, which must be fetched from `GlobalFieldsCollection` 
  * Youth would be logging hours in each category, and so there should be a corresponding number of approval fields 
  * Staff must be able to approve/reject the hour log request, but keep in mind that some hours for a particular category can be approved while some are rejected in a different category.
  * Once the staff submits their decision, the corresponding hours from approved fields are totaled up and subtracted from Pending Hours, and added into current hours.
    * Keep in mind that when a Youth submits their hour log request, it is added to Pending Hours, and so we must subtract from Pending Hours when hours are approved.
  * Rejected fields are also totaled up and subtracted from Pending Hours and nothing is to be done. 
  * Data is then sent to the corresponding Youth's `Work log`, with the document ID as the same ISO date string of when the youth submitted it. See `Work Log` under `10001` as an example. 
  
  
