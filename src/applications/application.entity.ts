import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true, length: 80 }) code!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ type: 'text' }) webhookUrl!: string;
  @Column({ length: 255 }) webhookSecret!: string;
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
