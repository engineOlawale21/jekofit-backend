import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsentAudits1788627600000 implements MigrationInterface {
  name = 'CreateConsentAudits1788627600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."consent_audits_type_enum" AS ENUM('newsletter', 'marketing')`);
    await queryRunner.query(`CREATE TABLE "consent_audits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."consent_audits_type_enum" NOT NULL, "granted" boolean NOT NULL, "source" character varying(40) NOT NULL DEFAULT 'account_settings', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_consent_audits" PRIMARY KEY ("id"), CONSTRAINT "FK_consent_audits_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_consent_audits_user_created" ON "consent_audits" ("userId", "createdAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_consent_audits_user_created"`);
    await queryRunner.query(`DROP TABLE "consent_audits"`);
    await queryRunner.query(`DROP TYPE "public"."consent_audits_type_enum"`);
  }
}
