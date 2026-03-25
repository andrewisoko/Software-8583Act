import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../web_terminal/entity/wt.entity';




@Injectable()
export class TerminalJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_KEY') as string,
    });
  }


    async validate(certPayload: any) {

      if (certPayload.role !== Role.TERMINAL) throw new UnauthorizedException('Invalid terminal token');
          
    return {
      serialnumber: certPayload.serialnumber,
      signature:certPayload.signature,
      issuer:certPayload.issuer,
      subject:certPayload.subject,
      role:certPayload.role
    };
  }
}

