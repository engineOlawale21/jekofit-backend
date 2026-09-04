import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDesignVersions1788541200000 implements MigrationInterface {
  name = 'AddDesignVersions1788541200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "design_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "designId" uuid NOT NULL, "version" integer NOT NULL, "name" character varying(80) NOT NULL, "productName" character varying(80) NOT NULL, "garmentColour" character varying(32) NOT NULL, "document" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_design_versions_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_design_versions_design_version" ON "design_versions" ("designId", "version")`);
    await queryRunner.query(`ALTER TABLE "design_versions" ADD CONSTRAINT "FK_design_versions_design" FOREIGN KEY ("designId") REFERENCES "designs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "design_versions" DROP CONSTRAINT "FK_design_versions_design"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_design_versions_design_version"`);
    await queryRunner.query(`DROP TABLE "design_versions"`);
  }
}
