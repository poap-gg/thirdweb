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
@Entity('mmxp_events')
export class Event extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Field()
  @Column({ name: 'luma_event_id', type: 'varchar', length: 255, nullable: true })
  lumaEventId!: string | null;

  @Field()
  @Index()
  @Column({ name: 'event_date', type: 'timestamptz', nullable: true })
  eventDate!: Date | null;

  @Field(() => Int)
  @Column({ name: 'attendee_count', type: 'int', default: 0 })
  attendeeCount!: number;

  @Field()
  @Column({ name: 'csv_filename', type: 'varchar', length: 500, nullable: true })
  csvFilename!: string | null;

  @Field()
  @Column({ name: 'uploaded_by', type: 'int', nullable: true })
  uploadedBy!: number | null;

  @OneToMany('Attendance', (attendance: Attendance) => attendance.event)
  attendances!: Attendance[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
