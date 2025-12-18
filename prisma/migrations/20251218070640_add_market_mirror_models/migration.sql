-- CreateTable
CREATE TABLE "ideas" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "targetAudience" VARCHAR(500) NOT NULL,
    "category" VARCHAR(100),
    "expectedPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "occupation" VARCHAR(100) NOT NULL,
    "annualIncome" INTEGER NOT NULL,
    "personality" TEXT NOT NULL,
    "hobbies" TEXT NOT NULL,
    "challenges" TEXT NOT NULL,
    "buyingBehavior" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "ideaId" INTEGER NOT NULL,
    "personaId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "willBuy" BOOLEAN NOT NULL,
    "improvementSuggestion" TEXT NOT NULL,
    "pricePerception" VARCHAR(50),
    "trustLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_ideaId_idx" ON "reviews"("ideaId");

-- CreateIndex
CREATE INDEX "reviews_personaId_idx" ON "reviews"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_ideaId_personaId_key" ON "reviews"("ideaId", "personaId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
