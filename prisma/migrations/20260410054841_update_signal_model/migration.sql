/*
  Warnings:

  - You are about to drop the column `type` on the `Signal` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Signal` table. All the data in the column will be lost.
  - Added the required column `greenBeads` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intensity` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redBeads` to the `Signal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "greenBeads" INTEGER NOT NULL,
    "redBeads" INTEGER NOT NULL,
    "intensity" REAL NOT NULL,
    CONSTRAINT "Signal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Signal" ("id", "seatId", "sessionId", "timestamp") SELECT "id", "seatId", "sessionId", "timestamp" FROM "Signal";
DROP TABLE "Signal";
ALTER TABLE "new_Signal" RENAME TO "Signal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
