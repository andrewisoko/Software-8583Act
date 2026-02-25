import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { TokenisationService } from "../tokenisation_service/tokenisation.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "./entity/transaction.entity";
import { HttpModule } from '@nestjs/axios';
import { TokenisationController } from "../tokenisation_service/tokenisation.controller";
import { TransactionService } from "./transaction.service";



@Module({
    imports:[
        HttpModule,
        TypeOrmModule.forFeature([Transaction])
    ],
    controllers:[TransactionController,TokenisationController],
    providers:[TokenisationService,TransactionService],
})

export class TransactionModule{}