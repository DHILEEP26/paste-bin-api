import { PrismaClient, Paste } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

interface CreatePasteInput {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

interface PasteResponse {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
}

// Create a new paste
export const createPaste = async (data: CreatePasteInput): Promise<Paste> => {
  const id = nanoid(10); // Generate a short unique ID
  
  let expiresAt: Date | null = null;
  if (data.ttl_seconds) {
    expiresAt = new Date(Date.now() + data.ttl_seconds * 1000);
  }

  return prisma.paste.create({
    data: {
      id,
      content: data.content,
      maxViews: data.max_views || null,
      remainingViews: data.max_views || null,
      expiresAt,
    },
  });
};

// Get paste by ID with expiry and view count logic
export const getPasteById = async (
  id: string,
  currentTime: Date,
  decrementView: boolean = true
): Promise<PasteResponse | null> => {
  const paste = await prisma.paste.findUnique({
    where: { id },
  });

  if (!paste) {
    return null;
  }

  // Check if expired by time
  if (paste.expiresAt && paste.expiresAt <= currentTime) {
    return null;
  }

  // Check if expired by views
  if (paste.remainingViews !== null && paste.remainingViews <= 0) {
    return null;
  }

  // Decrement view count if needed
  let remainingViews = paste.remainingViews;
  if (decrementView && paste.remainingViews !== null) {
    // Check if this is the last view
    if (paste.remainingViews === 1) {
      // This is the last view - update and return, but mark as expired
      await prisma.paste.update({
        where: { id },
        data: {
          remainingViews: 0,
        },
      });
      remainingViews = 0;
    } else {
      const updated = await prisma.paste.update({
        where: { id },
        data: {
          remainingViews: {
            decrement: 1,
          },
        },
      });
      remainingViews = updated.remainingViews;
    }
  }

  return {
    content: paste.content,
    remaining_views: remainingViews,
    expires_at: paste.expiresAt ? paste.expiresAt.toISOString() : null,
  };
};