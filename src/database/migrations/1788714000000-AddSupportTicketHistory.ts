import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportTicketHistory1788714000000 implements MigrationInterface {
  name = 'AddSupportTicketHistory1788714000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "support_tickets" ADD "ticketNumber" character varying(24)`);
    await queryRunner.query(`UPDATE "support_tickets" SET "ticketNumber" = 'JF-LEGACY-' || UPPER(SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 8))`);
    await queryRunner.query(`ALTER TABLE "support_tickets" ALTER COLUMN "ticketNumber" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "support_tickets" ADD CONSTRAINT "UQ_support_ticket_number" UNIQUE ("ticketNumber")`);
    await queryRunner.query(`ALTER TABLE "support_tickets" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_support_ticket_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE TYPE "public"."support_ticket_replies_author_enum" AS ENUM('customer', 'agent')`);
    await queryRunner.query(`CREATE TABLE "support_ticket_replies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticketId" uuid NOT NULL, "author" "public"."support_ticket_replies_author_enum" NOT NULL, "message" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_support_ticket_replies" PRIMARY KEY ("id"), CONSTRAINT "FK_support_reply_ticket" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_support_replies_ticket_created" ON "support_ticket_replies" ("ticketId", "createdAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "support_ticket_replies"`);
    await queryRunner.query(`DROP TYPE "public"."support_ticket_replies_author_enum"`);
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_support_ticket_user"`);
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "UQ_support_ticket_number"`);
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "ticketNumber"`);
  }
}
