import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/:code/:lock", async (_request, response) => {
  const { code, lock } = _request.params;

  const lobby = await prisma.quiz.findUnique({
    where: { code },
    select: { title: true, locked: true, isActive: true },
  });

  if (!lobby) {
    return response.status(404).json({ error: "Quiz not found" });
  }

  await prisma.quiz.update({
    where: { code },
    data: { locked: lock === "true" },
  });

  response.json({ status: "ok", code: code, lock: lock, success: true });
});

export default router;
