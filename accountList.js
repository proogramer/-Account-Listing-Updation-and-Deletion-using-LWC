import { LightningElement, track, wire } from 'lwc';

import getAllAccounts from '@salesforce/apex/GetAllAccountList.getAllAcc';

import { updateRecord } from 'lightning/uiRecordApi';

import deleteAccounts from '@salesforce/apex/GetAllAccountList.deleteAccounts'

// importing to show toast notifictions
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

// importing to refresh the apex after delete the records.
import {refreshApex} from '@salesforce/apex';

import ID_FIELD from '@salesforce/schema/Account.Id';

import NAME_FIELD from '@salesforce/schema/Account.Name';



export default class AccountList extends LightningElement {

    @track columns = [
        { label: 'Name', fieldName: 'Name',editable: true },
    ];

    @track data = [];
    @track recordsCount = 0;

    @track draftValues = [];


    selectedRecords=[];


    @wire(getAllAccounts)
    getAllAccounts(result) {
        this.refreshTable = result;
        if (result.data) {
            this.data = result.data;
            this.error = undefined;

        } else if (result.error) {
            this.error = result.error;
            this.data = undefined;
        }
    }

    getSelectedRecords(event){

        const selectedRows = event.detail.selectedRows;

        this.recordsCount = event.detail.selectedRows.length;

        let accIds = new Set();

        for(let i=0; i<selectedRows.length; i++ ){
            accIds.add(selectedRows[i].Id);
           // console.log(selectedRows[i].Id);
        }

        this.selectedRecords = Array.from(accIds);


    }

    deleteAccounts(){
        console.log(this.selectedRecords);

        deleteAccounts({accList: this.selectedRecords})
        .then(result => {
            window.console.log('result ====> ' + result);

            // showing success message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!', 
                    message: this.recordsCount + ' Contacts are deleted.', 
                    variant: 'success'
                }),
            );
            
            // Clearing selected row indexs 
            this.template.querySelector('lightning-datatable').selectedRows = [];

            this.recordsCount = 0;

            // refreshing table data using refresh apex
            return refreshApex(this.refreshTable);

        })
        .catch(error => {
            window.console.log(error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error while getting Contacts', 
                    message: error.message, 
                    variant: 'error'
                }),
            );
        });
    }
    handleSave(event){
        const fields = {};
        fields[ID_FIELD.fieldApiName] = event.detail.draftValues[0].Id;
        fields[NAME_FIELD.fieldApiName] = event.detail.draftValues[0].Name;

        console.log(fields);

        const recordInput = {fields};

        updateRecord(recordInput)
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Contact updated',
                    variant: 'success'
                })
            );
            // Clear all draft values
            this.draftValues = [];

            // Display fresh data in the datatable
            return refreshApex(this.contact);
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }

}