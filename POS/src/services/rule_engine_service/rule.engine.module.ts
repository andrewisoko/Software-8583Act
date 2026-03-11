import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "../orchestrator/entity/transaction.entity";
import { RuleEngineController } from "./rule.engine.controller";
import { RuleEngineService } from "./rule.engine.service";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { Party } from "../party_service/entity/party.entity";
import { TokenisationService } from "../tokenisation_service/tokenisation.service";

@Module({
    imports:[
        TypeOrmModule.forFeature([Transaction,Terminal,Party])
    ],
    controllers:[RuleEngineController],
    providers:[RuleEngineService]
})
export class RuleEngineModule{}