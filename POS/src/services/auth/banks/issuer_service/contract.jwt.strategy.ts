import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/services/web_terminal/entity/wt.entity';

@Injectable()
export class ContractJwtStrategy extends PassportStrategy(Strategy, 'contract-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('CONTRACT_KEY') as string,
    });
  }

  async validate(certPayload: any) {
    if ( certPayload.role !== Role.CONTRACT ) throw new UnauthorizedException('Invalid contract token');

    return {
      account: certPayload.account,
      role: certPayload.role,
    };
  }
}
