import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from 'src/services/web_terminal/entity/wt.entity';
import { AccountDocument } from 'src/services/account_service/document/account.doc';

@Injectable()
export class ContractJwtStrategy extends PassportStrategy(Strategy, 'contract-jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel('Account') private accountModel: Model<AccountDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('CONTRACT_KEY') as string,
    });
  }

  async validate(certPayload: any) {
    if (certPayload.role !== Role.CONTRACT) {
      throw new UnauthorizedException('Invalid contract token');
    }

    if (!certPayload.account || !Types.ObjectId.isValid(certPayload.account)) {
      throw new UnauthorizedException('Invalid account in token');
    }

    const account = await this.accountModel
      .findById(certPayload.account)
      .select({ _id: 1 })
      .lean();

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    return {
      account: String(account._id),
      role: certPayload.role,
    };
  }
}
