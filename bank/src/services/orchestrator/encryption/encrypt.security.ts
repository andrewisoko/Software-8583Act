import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptSecurity{

  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

    constructor( private configService: ConfigService ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');

    if (!key) throw new Error(`ENCRYPTION_KEY is not defined ${this.configService.get<string>('ENCRYPTION_KEY')}`);
    this.key = Buffer.from(key, 'hex');
    
  }

  encrypt(text: string){

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
  
    const tag = cipher.getAuthTag();
  
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
      tag: tag.toString('hex'),
    };
  }
  
  decrypt(encryptedData) {


    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );
  
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.content, 'hex')),
      decipher.final(),
    ]);
  
    return decrypted.toString();
  }

}
