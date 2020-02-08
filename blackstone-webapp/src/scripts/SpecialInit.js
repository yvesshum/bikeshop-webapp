import { Timestamp } from '@/firebase.js'
export function initSpecialInputVal(type) {
    switch(type) {
        case 'Integer':
            return 0;
            break;
        case 'Boolean':
            return false;
            break;
        case 'Phone': 
            return "";
            break;
        case 'Datetime':
            return Timestamp.fromDate(new Date()); // initialize to today's date
            break;
        case 'Date':
            return Timestamp.fromDate(new Date()); // initialize to today's date
            break;
        case 'Gender':
            return "M"; // leftmost element, honestly I don't know what to set the default one as :/ 
            break;
        case 'Race': 
            return null;
            break;
        case 'Grade':
            return null;
            break;
        case 'Email':
            return "";
            break;
        case 'Hours':
            return 0;
            break;
        case 'Class':
            return null; // should be fine for the selector
            break;
        case 'Period':
            return null; // should be fine for the selector 
            break;
        case 'Essay':
            return "";
            break;
        default:
            return "";
    
    }
}