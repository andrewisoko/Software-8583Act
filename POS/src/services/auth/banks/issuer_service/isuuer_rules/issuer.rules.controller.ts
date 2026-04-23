import { Controller, Post, Body } from '@nestjs/common';
import { ContractProps, IssuerRuleService } from './issuer.rules.service';




interface IssuerRulesInput {

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

interface GraphQLRequest {
  query: string;
  variables: {
    input: IssuerRulesInput;
  };
}


@Controller('issuer-rules')
export class IssuerRulesController {

  constructor ( private readonly issuerRulesService: IssuerRuleService){}
  @Post('graphql')
   async handleGraphQL( @Body() body: GraphQLRequest ) {

    const input = body.variables.input;
    const expiryTime = input.time_agreement[input.time_agreement.length -1];
    
    if ( new Date(Date.now()) > new Date(expiryTime) ) throw new Error ('contract expired.');

    this.issuerRulesService.contractData( input as ContractProps );
    return 'contract received';
  }

}
