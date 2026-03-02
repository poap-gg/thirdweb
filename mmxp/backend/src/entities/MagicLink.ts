import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';
import { ObjectType, Field, Int } from 'typeorm';

@ObjectType()
@Entity('mmxp_magic_links')
export class MagicLink extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Field()
  @Index({ unique: true })
  @Column({ name: 'nonce', type: 'varchar', length: 128 })
  nonce!: string;

  @Field()
  @Column({ name: 'used', type: 'boolean', default: false })
  used!: boolean;

  @Field()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
