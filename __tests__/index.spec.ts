import { DatabaseBase } from "../";

describe("InitialDataDb", () => {
  describe("#to_snake_case", () => {
    it("オブジェクトのキーをすべてsnake_caseに変換したオブジェクトを返す", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "dummy";
        orderKey = "key" as const;
        pKey = "key" as const;
      }

      const target = new Test();
      expect(target.to_snake_case({ foo: "dummy", companyId: "dummy" })).toEqual({ foo: "dummy", company_id: "dummy" });
    });
  });

  describe("#toCamelCase", () => {
    it("オブジェクトのキーをすべてsnake_caseに変換したオブジェクトを返す", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "dummy";
        orderKey = "key" as const;
        pKey = "key" as const;
      }

      const target = new Test();
      expect(target.toCamelCase({ foo: "dummy", company_id: "dummy" })).toEqual({ foo: "dummy", companyId: "dummy" });
    });
  });

  describe("#createInsertQuery", () => {
    it("オブジェクトからINSERTクエリを作る", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "dummy";
        orderKey = "key" as const;
        pKey = "key" as const;
      }

      const target = new Test();
      const entity = { foo: "bar", hoge: "fuga", snake_case: 123 } as any;
      expect(target.createInsertQuery(entity)).toBe(
        "INSERT INTO schema.dummy (foo, hoge, snake_case) VALUES('bar', 'fuga', 123);"
      );
    });

    it("Dateの場合はTIMESTAMP型で出力する", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "dummy";
        orderKey = "key" as const;
        pKey = "key" as const;
      }

      const target = new Test();
      const entity = { date: new Date(2020, 0, 1, 12, 25, 30) } as any;
      expect(target.createInsertQuery(entity)).toBe(
        "INSERT INTO schema.dummy (date) VALUES('2020-01-01 12:25:30');"
      );
    });
  });

  describe("#createSelectQuery", () => {
    it("指定したエンティティに合致するものを探すSELECT文を作成する", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "tableName";
        orderKey = "key" as const;
        pKey = "key" as const;
      }
      expect(new Test().createSelectQuery({ foo: "bar", ho_ge: "fuga", number: 1234 })).toBe(
        "SELECT * FROM schema.tableName WHERE foo = 'bar' AND foo = 'bar' AND ho_ge = 'fuga' AND number = 1234 ORDER BY key;"
      );
    });
  });

  describe("#createDeleteQuery", () => {
    it("指定したエンティティに合致するものを削除するDELETE文を作成する", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "tableName";
        orderKey = "key" as const;
        pKey = "key" as const;
      }
      expect(new Test().createDeleteQuery({ foo: "bar", ho_ge: "fuga", number: 1234 })).toBe(
        `DELETE FROM schema.tableName WHERE foo='bar' AND ho_ge='fuga' AND number=1234;`
      );
    });
  });

  describe("#createFindAllQuery", () => {
    it("すべてのエンティティを取得するSELECT文を作成する", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "tableName";
        orderKey = "key" as const;
        pKey = "key" as const;
      }
      expect(new Test().createFindAllQuery()).toBe(
        `SELECT * FROM schema.tableName ORDER BY key LIMIT ALL OFFSET 0;`
      );
    });

    it("エンティティの個数とオフセットを指定して取得するSELECT文を作成する", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "tableName";
        orderKey = "key" as const;
        pKey = "key" as const;
      }
      expect(new Test().createFindAllQuery({ limit: 100, offset: 200 })).toBe(
        `SELECT * FROM schema.tableName ORDER BY key LIMIT 100 OFFSET 200;`
      );
    });
  });

  describe("#createUpdateQuery", () => {
    it("指定したエンティティを更新するクエリを作成する", () => {
      class Test extends DatabaseBase<{ key: string }> {
        table = "tableName";
        orderKey = "key" as const;
        pKey = "key" as const;
      }
      expect(new Test().createUpdateQuery({ key: "foo", ba_rl: "hoge", a: 120.3 } as any)).toBe(
        `UPDATE schema.tableName SET ba_rl = 'hoge', a = 120.3 WHERE key = 'foo';`
      );
    });
  });
});
