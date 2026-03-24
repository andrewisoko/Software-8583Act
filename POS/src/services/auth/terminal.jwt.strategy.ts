import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';




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
    return {
      serialnumber: certPayload.serialnumber,
      signature:certPayload.signature,
      issuer:certPayload.issuer,
      subject:certPayload.subject,
      role:certPayload.role
    };
  }
}

