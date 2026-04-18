-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "avatarUrl" TEXT,
    "bio" TEXT,
    "specialties" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "packageId" TEXT NOT NULL,
    "packagePrice" INTEGER NOT NULL,
    "addons" TEXT NOT NULL DEFAULT '[]',
    "addonTotal" INTEGER NOT NULL DEFAULT 0,
    "rushFee" INTEGER NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" INTEGER NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "dueDate" TEXT,
    "recName" TEXT,
    "recAge" TEXT,
    "relationship" TEXT,
    "occasion" TEXT,
    "othersMentioned" TEXT,
    "howMet" TEXT,
    "memories" TEXT,
    "loveAbout" TEXT,
    "feeling" TEXT,
    "oneLine" TEXT,
    "avoid" TEXT,
    "mood" TEXT,
    "genres" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "vocal" TEXT,
    "songReferences" TEXT,
    "mustInclude" TEXT,
    "catchphrase" TEXT,
    "credit" TEXT,
    "lyricTone" TEXT,
    "contentRating" TEXT,
    "approveFirst" TEXT,
    "anythingElse" TEXT,
    "deliveredAt" DATETIME,
    "deliveryUrl" TEXT,
    "giftPageSlug" TEXT,
    "customerId" TEXT NOT NULL,
    "creatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "OrderStatusUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusUpdate_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderStatusUpdate_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "OrderFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderFile_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "occasion" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "AudioSample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT NOT NULL,
    "mood" TEXT,
    "occasion" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discountPercent" REAL NOT NULL,
    "label" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerEmail" TEXT NOT NULL,
    "referredEmail" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "creditAwarded" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
-- CreateIndex
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
-- CreateIndex
CREATE UNIQUE INDEX "Order_giftPageSlug_key" ON "Order"("giftPageSlug");
-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
-- CreateIndex
CREATE INDEX "Order_creatorId_idx" ON "Order"("creatorId");
-- CreateIndex
CREATE INDEX "OrderStatusUpdate_orderId_idx" ON "OrderStatusUpdate"("orderId");
-- CreateIndex
CREATE INDEX "OrderMessage_orderId_idx" ON "OrderMessage"("orderId");
-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_key" ON "Review"("orderId");
-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
