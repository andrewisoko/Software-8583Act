import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ContractProps, IssuerRuleService } from './issuer.rules.service';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { Repository } from 'typeorm';





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

@Controller('issuer-rules')
export class IssuerRulesController {

  constructor ( 
    @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
    private readonly issuerRulesService: IssuerRuleService){}

  @UseGuards(AuthGuard('contract-jwt'))
  @Post('contract')
  async createContract( @Body() body: IssuerRulesInput ) {

    const expiryTime = body.time_agreement[body.time_agreement.length -1];
    console.log(body)

    if ( new Date(Date.now()) > new Date(expiryTime) ){
      throw new Error ('contract expired.');
    } 

    this.issuerRulesService.contractData( body as ContractProps );
    return 'contract received';
  }

  @Get('cancel-contract')
  cancelContract(){
    return this.issuerRulesService.cancelContract()
  }

}
