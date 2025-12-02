import postgres from "postgres";
import bcrypt from "bcryptjs";

async function run() {
  const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/vibecoding";
  const sql = postgres(connectionString, { max: 1 });
  try {
    // Create tables if not exist (PostgreSQL)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar TEXT,
        must_change_password INTEGER NOT NULL DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        client TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        manager TEXT NOT NULL,
        requirements TEXT NOT NULL,
        suggestions TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id),
        tech_stack JSONB,
        status TEXT NOT NULL DEFAULT 'active',
        github_link TEXT,
        client_contact TEXT,
        client_phone TEXT,
        client_email TEXT,
        estimated_budget TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS project_users (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS project_users_unique ON project_users(project_id, user_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS project_messages (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_notes (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stack_suggestions TEXT,
        technical_notes TEXT
      );
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_notes_unique ON user_notes(project_id, user_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS project_meetings (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        feedback TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Seed default users if empty
    const rows = await sql<{ count: string }[]>`SELECT COUNT(*)::text as count FROM users;`;
    const count = parseInt(rows[0]?.count || "0", 10);
    if (count === 0) {
      const adminPassword = await bcrypt.hash("admin123", 10);
      const pmPassword = await bcrypt.hash("pm123", 10);
      const tekkiePassword = await bcrypt.hash("tekkie123", 10);

      await sql`
        INSERT INTO users (name, email, password_hash, role, must_change_password)
        VALUES
          ('Admin User', 'admin@empresa.pt', ${adminPassword}, 'ADMIN', 1),
          ('Project Manager', 'pm@empresa.pt', ${pmPassword}, 'PROJECT_MANAGER', 1),
          ('Alice Tekkie', 'alice@empresa.pt', ${tekkiePassword}, 'TEKKIE', 1),
          ('Bob Coder', 'bob@empresa.pt', ${tekkiePassword}, 'TEKKIE', 1),
          ('Charlie Dev', 'charlie@empresa.pt', ${tekkiePassword}, 'TEKKIE', 1)
        ;
      `;
      console.log("Database seeded with default users.");
    } else {
      console.log("Users already exist, skipping seed.");
    }

    console.log("Migrations completed.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

run();
