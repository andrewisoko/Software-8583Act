import { Injectable } from "@nestjs/common";
import { IssuerService } from "../issuer.service";


export interface ContractProps{

    sender: string,
    receiver: string[],
    split_agreement: string,
    contractStatus: string,
    transactions?: string,
    sender_percentage?: number;
    sender_amount?: number;
    receiver_percentage?: number[];
    receiver_amount?: number[];
    repayment_agreement?:string,
    event_agreement?:string,
    location_agreement?:string,
    time_agreement?:string

} 

export interface SetAgreements {

    split_agreement: string,
    accounts: string[], 
    percentages: number[], 
    amounts: number[],
    
    }

@Injectable()
export class IssuerRuleService{
    constructor(private readonly issuerService: IssuerService) {}

    contractData( contractProps: ContractProps ){

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

    return this.issuerService.IssuerBankService( setAgreements )
    }
}