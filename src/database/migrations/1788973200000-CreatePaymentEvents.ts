import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreatePaymentEvents1788973200000 implements MigrationInterface {
  name = 'CreatePaymentEvents1788973200000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."payment_events_type_enum" AS ENUM('initialized', 'webhook_received', 'verification_succeeded', 'verification_failed', 'finalized')`);
    await queryRunner.query(`CREATE TABLE "payment_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paymentId" uuid NOT NULL, "type" "public"."payment_events_type_enum" NOT NULL, "details" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_payment_events" PRIMARY KEY ("id"), CONSTRAINT "FK_payment_event_payment" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_events_payment_created" ON "payment_events" ("paymentId", "createdAt")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_events"`);
    await queryRunner.query(`DROP TYPE "public"."payment_events_type_enum"`);
  }
}
