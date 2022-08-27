const request = require("supertest");
const db = require("../data/db-config");
const server = require("./server");

const newUser = {
  username: "Michael",
  password: "1234",
};

test("testing NODE_ENV is correct", () => {
  expect(process.env.NODE_ENV).toBe("testing");
});

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

beforeEach(async () => {
  await db("users").truncate();
  await db.seed.run();
});

afterAll(async () => {
  db.destroy();
});

describe("REGISTER", () => {
  test("can Register a new user", async () => {
    const result = await request(server).post("/api/auth/register").send(newUser);
    expect(result.body).toMatchObject({
      user_id: 3,
      username: "Michael",
      role_name: "student",
    });
  });
  test("can not register a new user with existing username", async () => {
    await request(server).post("/api/auth/register").send(newUser);
    const result = await request(server).post("/api/auth/register").send(newUser);
    expect(result.body).toMatchObject({ message: "username taken, try another username" });
    expect(result.status).toBe(401);
  });

  //   test.todo("", async () => {});
  //   test.todo("", async () => {});
  //   test.todo("", async () => {});
  //   test.todo("", async () => {});
});
