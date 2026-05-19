import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const sessionClaims = auth?.sessionClaims as
    | { userId?: string; email?: string }
    | undefined;
  const clerkUserId = sessionClaims?.userId || auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, clerkUserId))
      .limit(1);

    let email = existing?.email;
    let displayName = existing?.displayName;

    if (!existing) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const primaryEmail =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

      if (!primaryEmail) {
        res.status(400).json({ error: "User has no email" });
        return;
      }

      email = primaryEmail;
      displayName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        primaryEmail.split("@")[0];

      await db
        .insert(usersTable)
        .values({ id: clerkUserId, email, displayName })
        .onConflictDoNothing();
    }

    req.userId = clerkUserId;
    req.userEmail = email;
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to load/provision user");
    res.status(500).json({ error: "Internal server error" });
  }
}
