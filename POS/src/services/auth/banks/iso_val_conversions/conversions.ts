import { Injectable } from "@nestjs/common";

@Injectable()
export class Coversion {

    toIsoAmount(amount, exponent = 2) { /*conversion in minor currency units */
        const minorUnits = Math.round(amount * Math.pow(10, exponent));
        return minorUnits.toString().padStart(12, '0');
    }

    reverse

    formatExpiry(expiry: string) {
        const [mm, yy] = expiry.split('/');
         return yy + mm;
    }

    reverseIsoAmount(isoAmount: string, exponent = 2): number {
        
        if (!isoAmount) return 0;

        // Remove leading zeros
        const minor = parseInt(isoAmount, 10);

        // Convert back to major currency units
        return minor / Math.pow(10, exponent);
        }
    
    reverseExpiry(isoExpiry: string): string {

        if (!isoExpiry || isoExpiry.length !== 4) {
            throw new Error("Invalid ISO expiry format");
        }

        const yy = isoExpiry.substring(0, 2);
        const mm = isoExpiry.substring(2, 4);

        return `${mm}/${yy}`;
        }

}