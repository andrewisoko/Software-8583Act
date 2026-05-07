import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';


@Injectable()
export class cardJwtStrategy extends PassportStrategy(Strategy, 'card-jwt') {
  constructor(
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_CARD_KEY') as string,
    });
  }


    async validate(cardPayload: any) {


 
        return {
            pan:cardPayload.pan,
            expiry:cardPayload.expiry,
        }
  }
}