import { binding, named } from "automated-omusubi";
import { camelCase, snakeCase } from "change-case";
import { Pool, PoolClient } from "pg";
import { select } from "sql-query-factory";
import format from "dateformat";

export abstract class DatabaseBase<T extends { [key: string]: string | number | Date | boolean }> {
  schema = "schema";
  abstract get orderKey(): keyof T;
  abstract get pKey(): keyof T;
  abstract get table(): string;
  get tablename(): string {
    return `${this.schema}.${this.table}`;
  }

  get order_key(): string {
    return snakeCase(this.orderKey as string);
  }

  get p_key(): string {
    return snakeCase(this.pKey as string);
  }

  @binding
  pool!: Pool;

  async save(entity: T) {
    const snake_entity = this.to_snake_case(entity);
    return this.runQuery(async client => {
      client.query(this.createInsertQuery(snake_entity));
    });
  }

  async saveAll(entities: T[]) {
    const snake_entities = entities.map(this.to_snake_case);
    return this.runQuery(async client => {
      for (const entity of snake_entities) {
        await client.query(this.createInsertQuery(entity));
      }
    });
  }

  async findBy(query: Partial<T>): Promise<T[]> {
    const snake_case_query = this.to_snake_case(query);
    return this.runQuery(async client => client.query(this.createSelectQuery(snake_case_query)))
      .then(it => it.rows)
      .then(list => list.map(this.toCamelCase));
  }

  async findAll(keys?: Array<keyof T>, limit?: number, offset?: number): Promise<T[]> {
    return this.runQuery(client =>
      client.query(this.createFindAllQuery({ keys: keys?.map(key => snakeCase(key as string)), limit, offset }))
    )
      .then(it => it.rows)
      .then(list => list.map(this.toCamelCase));
  }

  async countAll(): Promise<number> {
    return this.runQuery(client => client.query(this.createCountQuery()))
      .then(it => it.rows)
      .then(it => it[0]?.count ?? "0")
      .then(it => parseInt(it));
  }

  async deleteBy(query: Partial<T>): Promise<void> {
    const snake_case_query = this.to_snake_case(query);
    return await this.runQuery(async client => {
      await client.query(this.createDeleteQuery(snake_case_query));
    });
  }

  async runQuery<R>(queryRun: (client: PoolClient) => Promise<R>) {
    const client = await this.pool.connect();
    try {
      return await queryRun(client);
    } finally {
      client.release();
    }
  }

  async upsertWith(entity: T) {
    return this.runQuery(async client => {
      const exist = await client
        .query(`SELECT * FROM ${this.tablename} WHERE ${this.p_key} = $1`, [entity[this.pKey]])
        .then(it => it.rowCount > 0);
      exist
        ? await client.query(this.createUpdateQuery(this.to_snake_case(entity)))
        : await client.query(this.createInsertQuery(this.to_snake_case(entity)));
    });
  }

  to_snake_case(entity: any): any {
    const camelKeys = Object.keys(entity);
    return camelKeys.reduce((prev, key) => ({ ...prev, [snakeCase(key)]: entity[key] }), {});
  }

  toCamelCase(entity: any): any {
    const snake_keys = Object.keys(entity);
    return snake_keys.reduce((prev, key) => ({ ...prev, [camelCase(key)]: entity[key] }), {});
  }

  createFindAllQuery(opts?: { keys?: Array<keyof T>; limit?: number; offset?: number }) {
    const { keys = ["*"], limit = 0, offset = 0 } = opts ?? {};
    return `SELECT ${keys.join(", ")} FROM ${this.tablename} ORDER BY ${this.order_key} LIMIT ${
      limit || "ALL"
    } OFFSET ${offset};`;
  }

  createCountQuery() {
    return `SELECT count(*) FROM ${this.tablename};`;
  }

  createInsertQuery(entity: any): string {
    const keys = Object.keys(entity);
    return `INSERT INTO ${this.tablename} (${keys.join(", ")}) VALUES(${keys
      .map(key => this.toValue(entity[key]))
      .join(", ")});`;
  }

  createUpdateQuery(entity: any): string {
    const pKey = entity[this.p_key] as string;
    delete entity[this.p_key];
    const keys = Object.keys(entity);
    return `UPDATE ${this.tablename} SET ${keys
      .map(key => [key, this.toValue(entity[key]!!)].join(" = "))
      .join(", ")} WHERE ${this.p_key} = ${this.toValue(pKey!!)};`;
  }

  createSelectQuery(entity: any): string {
    const keys = Object.keys(entity);
    let selectable: {
      where: (...args: any[]) => any;
      and: (...args: any[]) => any;
      orderBy: (...args: any[]) => any;
      build: () => string;
    } = select("*").from<T>(this.tablename) as any;
    if (keys.length > 0) {
      selectable = selectable.where(keys[0]).equal(entity[keys[0]]);
    }
    return keys
      .reduce((prev, key) => prev.and(key).equal(entity[key]), selectable)
      .orderBy(this.order_key)
      .build();
  }

  createDeleteQuery(entity: any): string {
    const keys = Object.keys(entity);
    const query = keys.map(key => `${key}=${this.toValue(entity[key])}`).join(" AND ");
    return `DELETE FROM ${this.tablename} WHERE ${query};`;
  }

  toEmbedString(value: string | number | boolean) {
    if (typeof value === "string") {
      return `'${this.escapeString(value)}'`;
    }
    return value;
  }

  toValue(value: string | number | Date) {
    if (typeof value === "object") {
      value = format(value, "yyyy-mm-dd hh:MM:ss");
    }
    return this.toEmbedString(value);
  }

  escapeString(string: string) {
    return string.replace(/'/g, "''");
  }
}

export type CompanyEntity = {
  id: string;
  name: string;
  lastUpdatedAt: Date;
};

export type SampleEntity = {
  id: string;
  companyId: string;
  url: string;
  title: string;
  content: string;
  lastUpdatedAt: Date;
};

@named
export class CompanyPressReleasePageDriver extends DatabaseBase<SampleEntity> {
  table = "company_press_release_page";
  orderKey = "id" as const;
  pKey = "id" as const;
}
