import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number

  /** 用户唯一标识（当前使用 session.user.email） */
  @Column()
  userId!: string

  @Column()
  role!: string

  @Column()
  content!: string

  @CreateDateColumn()
  createdAt!: Date
}
