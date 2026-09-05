import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderTracking1788800400000 implements MigrationInterface {
  name = 'AddOrderTracking1788800400000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "order_tracking_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "status" character varying(48) NOT NULL, "message" character varying(240) NOT NULL, "location" character varying(120), "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_order_tracking_events" PRIMARY KEY ("id"), CONSTRAINT "FK_tracking_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_tracking_order_occurred" ON "order_tracking_events" ("orderId", "occurredAt")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_tracking_events"`);
  }
}
