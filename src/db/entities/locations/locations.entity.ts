import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'locations' })
export class LocationEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  name!: string;

  @Column('int')
  x!: number;

  @Column('int')
  y!: number;

  @Column('int')
  radius!: number;

  @Column('varchar', { nullable: true })
  type?: string;

  @Column('varchar', { nullable: true })
  image?: string;

  @Column('varchar', { nullable: true, name: 'opening_hours' })
  openingHours?: string;
}