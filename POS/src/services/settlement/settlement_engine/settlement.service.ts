import { Injectable } from '@nestjs/common';

@Injectable()
export class SettlementService {
    /* retrieve status of the transaction,
    Sending instructions to a payment gateway or bank (moving the money),
    Updating balances in the Ledger Service (via another API call or event),
    update the transaction's status from AUTHORISED to SETTLED
      */
}
