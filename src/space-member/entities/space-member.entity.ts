import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Space } from 'src/space/entities/space.entity';

@Entity('space_members')
@Unique(['user_id', 'space_id'])
export class SpaceMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.space_members)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => Space, (space) => space.spaceMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'space_id' })
  space: Space;
  @Column({ type: 'int', nullable: false })
  space_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
