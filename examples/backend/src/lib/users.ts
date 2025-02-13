import { eq } from "drizzle-orm";
import { db, userTable, type User } from "../db.js";

export async function getUserByAddress(address: string): Promise<User | null> {
  const selectedUser = await db
    .select({ user: userTable })
    .from(userTable)
    .where(eq(userTable.id, address));

  if (selectedUser.length < 1) {
    return null;
  }

  return selectedUser[0].user;
}

export async function createUserByAddress(address: string): Promise<User> {
  const user: User = { id: address, name: null, favoriteColor: null };
  await db.insert(userTable).values(user);
  return user;
}
