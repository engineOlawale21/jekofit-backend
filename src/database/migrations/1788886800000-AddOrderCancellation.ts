import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddOrderCancellation1788886800000 implements MigrationInterface {
  name = 'AddOrderCancellation1788886800000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."order_cancellations_status_enum" AS ENUM('requested', 'approved', 'rejected')`);
    await queryRunner.query(`CREATE TABLE "order_cancellations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "reason" character varying(500) NOT NULL, "status" "public"."order_cancellations_status_enum" NOT NULL DEFAULT 'requested', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_order_cancellations" PRIMARY KEY ("id"), CONSTRAINT "UQ_order_cancellation_order" UNIQUE ("orderId"), CONSTRAINT "FK_cancellation_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_cancellations"`);
    await queryRunner.query(`DROP TYPE "public"."order_cancellations_status_enum"`);
  }
}
