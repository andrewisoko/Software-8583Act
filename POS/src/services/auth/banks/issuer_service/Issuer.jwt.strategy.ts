import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from 'src/services/web_terminal/entity/wt.entity';




@Injectable()
export class IssuerJwtStrategy extends PassportStrategy(Strategy, 'issuer-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_KEY') as string,
    });
  }


    async validate(certPayload: any) {

      if (certPayload.role !== Role.ISSUER ) throw new UnauthorizedException('Invalid issuer token');
      
      return {
        account: certPayload.account,
        stan: certPayload.stan,
        role: certPayload.role
      };
        
  }
}