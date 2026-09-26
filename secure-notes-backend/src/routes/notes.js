import { Router } from "express";
import { createNoteForUser, deleteNoteForUser, listNotesForUser } from "../db.js";
import { validateNoteBody } from "../lib/validation.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const notesRouter = Router();

notesRouter.use(requireAuth, requireRole("user"));

notesRouter.get("/", async (request, response, next) => {
  try {
    const notes = await listNotesForUser(request.user.id);
    return response.status(200).json({ notes });
  } catch (error) {
    return next(error);
  }
});

notesRouter.post("/", async (request, response, next) => {
  try {
    const parsed = validateNoteBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    const note = await createNoteForUser(
      request.user.id,
      parsed.title,
      parsed.content
    );

    return response.status(201).json({ note });
  } catch (error) {
    return next(error);
  }
});

notesRouter.delete("/:id", async (request, response, next) => {
  try {
    const noteId = Number(request.params.id);
    if (!Number.isInteger(noteId) || noteId <= 0) {
      return response.status(400).json({ error: "Invalid note id." });
    }

    const deleted = await deleteNoteForUser(request.user.id, noteId);
    if (!deleted) {
      return response.status(404).json({ error: "Note not found." });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});
