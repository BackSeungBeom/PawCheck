"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  nickname: string;
  visitedOn: Date;
  stillAccurate: boolean;
  comment: string | null;
};

export function ReviewSection({ facilityId, reviews }: { facilityId: string; reviews: Review[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [visitedOn, setVisitedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [stillAccurate, setStillAccurate] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId, nickname, visitedOn, stillAccurate, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "등록에 실패했습니다.");
      }
      setOpen(false);
      setNickname("");
      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {reviews.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          아직 등록된 후기가 없습니다 — 공사 API 등록 정보 기준(최신 확인 요망)
        </p>
      ) : (
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.nickname}</span>
                <span
                  className={
                    r.stillAccurate
                      ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
                  }
                >
                  {r.stillAccurate ? "규정 일치" : "규정 다름"}
                </span>
              </div>
              <p className="mt-1 text-black/50 dark:text-white/50">
                방문일 {new Date(r.visitedOn).toISOString().slice(0, 10)}
              </p>
              {r.comment && <p className="mt-1">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-full border border-emerald-700 px-4 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950"
      >
        방문 확인하기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 dark:bg-zinc-900">
            <h3 className="mb-3 text-base font-semibold">방문 확인하기</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                required
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
              <input
                type="date"
                required
                value={visitedOn}
                onChange={(e) => setVisitedOn(e.target.value)}
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
              <div className="flex gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={stillAccurate}
                    onChange={() => setStillAccurate(true)}
                  />
                  규정 그대로였어요
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={!stillAccurate}
                    onChange={() => setStillAccurate(false)}
                  />
                  규정이 달랐어요
                </label>
              </div>
              <textarea
                placeholder="코멘트 (선택)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-1.5 text-sm text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
