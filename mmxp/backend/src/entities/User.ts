import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, Int } from 'typeorm';
import type { Attendance } from './Attendance';

@ObjectType()
@Entity('mmxp_users')
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Field()
  @Index({ unique: true })
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email!: string;

  @Field(() => Int)
  @Column({ name: 'points', type: 'int', default: 0 })
  points!: number;

  @Field()
  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin!: boolean;

  @OneToMany('Attendance', (attendance: Attendance) => attendance.user)
  attendances!: Attendance[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
