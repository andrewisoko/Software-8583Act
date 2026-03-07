import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class FullRequestDto {

  @IsString()
  pan: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  expiry: string;

  @IsString()
  merchant: string;

  @IsString()
  timestamp: string; // better send ISO string

  @IsString()
  customer: string;

  @IsString()
  account: string;

  @IsString()
  terminal: string;

  @IsOptional()
  @IsString()
  customerID?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'BLOCKED', 'CLOSED'])
  accountStatus?: 'ACTIVE' | 'BLOCKED' | 'CLOSED';
}