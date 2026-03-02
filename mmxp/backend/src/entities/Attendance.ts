import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ObjectType, Field, Int } from 'typeorm';
import type { User } from './User';
import type { Event } from './Event';

@ObjectType()
@Entity('mmxp_attendances')
@Unique(['userId', 'eventId'])
export class Attendance extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Field(() => Int)
  @Index()
  @Column({ name: 'event_id', type: 'int' })
  eventId!: number;

  @Field()
  @Column({ name: 'checked_in', type: 'boolean', default: false })
  checkedIn!: boolean;

  @Field(() => Int)
  @Column({ name: 'points_awarded', type: 'int', default: 0 })
  pointsAwarded!: number;

  @ManyToOne('User', (user: User) => user.attendances)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne('Event', (event: Event) => event.attendances)
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
