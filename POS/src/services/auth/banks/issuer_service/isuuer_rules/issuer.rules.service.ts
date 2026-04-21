import { Injectable } from "@nestjs/common";
import { IssuerService } from "../issuer.service";
import { SetAgreements } from "../interfaces/set-agreements.interface";


export interface ContractProps{

    sender: string,
    receiver: string[],
    split_agreement: string,
    contractStatus: string,
    time_agreement:Date[]
    sender_percentage?: number;
    sender_amount?: number;
    receiver_percentage?: number[];
    receiver_amount?: number[];
    repayment_agreement?:string,
    event_agreement?:string,
    location_agreement?:string,

} 


export type { SetAgreements } from "../interfaces/set-agreements.interface";
export const conditions: SetAgreements[] = []; // this is where the most important payload variables from the graphQL api get stored.

@Injectable()
export class IssuerRuleService{
    // constructor(private readonly issuerService: IssuerService) {}


    contractData( contractProps: ContractProps ){

    try {
        
        let percentages;
        let amounts;

        const accounts = [contractProps.sender, ...contractProps.receiver];

        if ( contractProps.sender_percentage && contractProps.receiver_percentage ){
            percentages = [contractProps.sender_percentage,...contractProps.receiver_percentage]
        }
        if ( contractProps.sender_amount && contractProps.receiver_amount ){
            amounts =  [contractProps.sender_amount,...contractProps.receiver_amount]
        }
        
      
        const setAgreements:SetAgreements = {

            split_agreement: contractProps.split_agreement,
            accounts: accounts, 
            percentages: percentages, 
            amounts: amounts,
            }

        conditions.push(setAgreements)
        
        if ( conditions[0].split_agreement === 'percentage' || conditions[0].split_agreement === 'amount' ){
            console.log("contract received");
        }else{
            throw new Error (' contract improperly filled ');
        }

    } catch (error) {
    console.log('Error issuer rules service at', error);
    };
    };
};