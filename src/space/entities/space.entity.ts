import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { SpaceMember } from 'src/space-member/entities/space-member.entity';

@Entity('spaces')
export class Space {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.space)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ type: 'int', nullable: false })
  user_id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @OneToMany(() => SpaceMember, (spaceMember) => spaceMember.space, {
    onDelete: 'CASCADE',
  })
  spaceMembers: SpaceMember[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
