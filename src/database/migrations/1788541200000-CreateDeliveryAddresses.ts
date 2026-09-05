import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeliveryAddresses1788541200000 implements MigrationInterface {
  name = 'CreateDeliveryAddresses1788541200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "delivery_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "label" character varying(60) NOT NULL DEFAULT 'Delivery address', "firstName" character varying(80) NOT NULL, "lastName" character varying(80) NOT NULL, "phoneNumber" character varying(32) NOT NULL, "addressLine1" character varying(160) NOT NULL, "addressLine2" character varying(160), "city" character varying(80) NOT NULL, "state" character varying(80) NOT NULL, "postalCode" character varying(20) NOT NULL, "countryCode" character varying(2) NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_delivery_addresses" PRIMARY KEY ("id"), CONSTRAINT "FK_delivery_addresses_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_delivery_addresses_user_created" ON "delivery_addresses" ("userId", "createdAt")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_delivery_addresses_one_default" ON "delivery_addresses" ("userId") WHERE "isDefault" = true`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_delivery_addresses_one_default"`);
    await queryRunner.query(`DROP INDEX "IDX_delivery_addresses_user_created"`);
    await queryRunner.query(`DROP TABLE "delivery_addresses"`);
  }
}
