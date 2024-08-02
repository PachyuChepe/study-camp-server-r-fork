import { IsNumber, IsString } from 'class-validator';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Space } from 'src/space/entities/space.entity';
import { SpaceMember } from 'src/space-member/entities/space-member.entity';
@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @IsString()
  @Column({ type: 'varchar', unique: true })
  email: string;

  @IsString()
  @Column({ type: 'varchar', nullable: true })
  password: string;

  @IsString()
  @Column({ type: 'varchar', nullable: false })
  nick_name: string;

  @IsNumber()
  @Column({ type: 'int' })
  skin: number;

  @IsNumber()
  @Column({ type: 'int' })
  hair: number;

  @IsNumber()
  @Column({ type: 'int' })
  face: number;

  @IsNumber()
  @Column({ type: 'int' })
  clothes: number;

  @IsNumber()
  @Column({ type: 'int' })
  hair_color: number;

  @IsNumber()
  @Column({ type: 'int' })
  clothes_color: number;

  @BeforeInsert()
  setDefaults() {
    this.skin = this.skin ?? Math.floor(Math.random() * 13);
    this.hair = this.hair ?? Math.floor(Math.random() * 10);
    this.face = this.face ?? Math.floor(Math.random() * 65);
    this.clothes = this.clothes ?? Math.floor(Math.random() * 7);
    this.hair_color = this.hair_color ?? Math.floor(Math.random() * 12);
    this.clothes_color = this.clothes_color ?? Math.floor(Math.random() * 12);
  }

  @OneToMany(() => SpaceMember, (spaceMember) => spaceMember.user, {
    onDelete: 'CASCADE',
  })
  space_members: SpaceMember[];

  @OneToMany(() => Space, (space) => space.user, { onDelete: 'CASCADE' })
  space: Space[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
