import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity('theme_versions')
@Index(['tenantId', 'applicationCode', 'version'], { unique: true })
export class ThemeVersion {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 80 }) tenantId!: string;
  @Column({ length: 80 }) applicationCode!: string;
  @Column({ length: 120 }) themeId!: string;
  @Column({ type: 'int' }) version!: number;
  @Column({ type: 'json' }) configuration!: Record<string, unknown>;
  @Column({ length: 180 }) createdBy!: string;
  @Column({ default: 'DRAFT', length: 30 }) status!: string;
  @CreateDateColumn() createdAt!: Date;
}
