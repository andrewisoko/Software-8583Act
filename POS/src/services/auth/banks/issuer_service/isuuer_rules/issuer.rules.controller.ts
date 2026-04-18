import { Controller, Post, Body } from '@nestjs/common';
import { ContractProps, IssuerRuleService } from './issuer.rules.service';




interface IssuerRulesInput {

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

    return this.issuerRulesService.contractData( input as ContractProps );
  }

}
