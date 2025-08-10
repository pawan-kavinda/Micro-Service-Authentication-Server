import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ lowercase: true, unique: true })
  email: string;

  @Prop({ select: false })
  password: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ select: false })
  emailVerificationToken?: string;

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ select: false })
  passwordResetExpires?: Date;

  @Prop({ default: false })
  accessToken: string;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
