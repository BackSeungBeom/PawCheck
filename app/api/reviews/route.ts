import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const facilityId = req.nextUrl.searchParams.get("facilityId");
  const reviews = await prisma.review.findMany({
    where: facilityId ? { facilityId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { facilityId, nickname, visitedOn, stillAccurate, comment } = body ?? {};

  if (!facilityId || !nickname || !visitedOn || typeof stillAccurate !== "boolean") {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
  if (!facility) {
    return NextResponse.json({ error: "존재하지 않는 시설입니다." }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: {
      facilityId,
      nickname: String(nickname).slice(0, 30),
      visitedOn: new Date(visitedOn),
      stillAccurate,
      comment: comment ? String(comment).slice(0, 500) : null,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
