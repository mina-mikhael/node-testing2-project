const request = require("supertest");
const db = require("../data/db-config");
const server = require("./server");

test("testing NODE_ENV is correct", () => {
  expect(process.env.NODE_ENV).toBe("testing");
});

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

beforeEach(async () => {
  await db.seed.run();
});

afterAll(async () => {
  db.destroy();
});

describe("REGISTER end point", () => {
  test("can Register a new user", async () => {
    const result = await request(server).post("/api/auth/register").send({
      username: "Michael",
      password: "1234",
    });
    expect(result.body).toMatchObject({
      user_id: 3,
      username: "Michael",
      role_name: "student",
    });
  });

  test("can not register a new user with existing username", async () => {
    await request(server).post("/api/auth/register").send({
      username: "Michael",
      password: "1234",
    });
    const result = await request(server).post("/api/auth/register").send({
      username: "Michael",
      password: "1234",
    });
    expect(result.body).toMatchObject({ message: "username taken, try another username" });
    expect(result.status).toBe(401);
  });

  test("default role_name to student if not specified", async () => {
    const result = await request(server).post("/api/auth/register").send({
      username: "Michael",
      password: "1234",
    });
    expect(result.body).toMatchObject({
      user_id: 3,
      username: "Michael",
      role_name: "student",
    });
  });

  test("can not register with role name as admin", async () => {
    const result = await request(server).post("/api/auth/register").send({
      username: "Michael",
      password: "1234",
      role_name: "admin",
    });
    expect(result.body).toMatchObject({
      message: "Role name can not be admin",
    });
  });
});

describe("LOGIN end point", () => {
  test("can login an existing user", async () => {
    const result = await request(server)
      .post("/api/auth/login")
      .send({ username: "bob", password: "1234" });
    expect(result.body).toMatchObject({
      message: "bob is back!",
    });
  });

  test("can login new registered user", async () => {
    await request(server).post("/api/auth/register").send({
      username: "Michael",
      password: "1234",
    });
    const result = await request(server)
      .post("/api/auth/login")
      .send({ username: "Michael", password: "1234" });
    expect(result.body).toMatchObject({
      message: "Michael is back!",
    });
  });

  test("can not login a non registered user", async () => {
    const result = await request(server)
      .post("/api/auth/login")
      .send({ username: "noOne", password: "1111" });
    expect(result.body).toMatchObject({
      message: "Invalid credentials",
    });
    expect(result.status).toBe(401);
  });
});

describe("USERS RESTRICTED ENDPOINT", () => {
  test("can not access the end point if no logged in user", async () => {
    const result = await request(server).get("/api/users");
    expect(result.body).toMatchObject({
      message: "Token required",
    });
    expect(result.status).toBe(401);
  });

  test("can not access the end point if a not admin user is logged in", async () => {
    const notAdmin = await request(server)
      .post("/api/auth/login")
      .send({ username: "sue", password: "1234" });
    const result = await request(server)
      .get("/api/users")
      .set("Authorization", notAdmin.body.token);
    expect(result.status).toBe(403);
    expect(result.body.length).toBeFalsy();
  });

  test("can get access to the endpoint if admin is logged in", async () => {
    const admin = await request(server)
      .post("/api/auth/login")
      .send({ username: "bob", password: "1234" });
    const result = await request(server)
      .get("/api/users")
      .set("Authorization", admin.body.token);

    expect(result.status).toBe(200);
    expect(result.body.length).toBe(2);
  });
});
