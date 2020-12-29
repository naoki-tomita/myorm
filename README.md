# how to use

```typescript
// Declare entity type. Must be "type" not "interface".
type TableEntity = {
  id: string;
  name: string;
  age: number;
  isAlive: boolean; // real column name must be snake_case. but Entity declaration must be camelCase.
  birthDay: Date; // you can use Date.
}

// Declare class for table.
class SomeTable extends DatabaseBase<> {
  table = "dummy"; // tablename.
  orderKey = "key" as const; // order key for findAll or findBy.
  pKey = "key" as const; // primary key for update, upsert.
}

// findAll
await new SomeTable().findAll(); // SELECT * FROM ...
await new SomeTable().findAll(["id", "name"]); // SELECT id, name FROM ...

// findBy
await new SomeTable().findBy({ id: "foo" }); // ... WHERE id = 'foo'

// save
await new SomeTable().save({ id: "foo", ... }); // INSERT INTO ...

// saveAll
await new SomeTable().save([{ id: "foo", ... }, { id: "bar" ... }, ...]); // INSERT INTO ...

// deleteBy
await new SomeTable().deleteBy({ id: "foo" }); // DELETE ... WHERE id = 'foo'

// upsertWith
await new SomeTable().upsertWith({ id: "foo", ... }); // INSERT if new entry. UPDATE if found entry by pkey.
```
