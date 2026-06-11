"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ChevronRight, RefreshCw, Users } from "lucide-react";
import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import {
  applianceName,
  fetchCrewCalls,
  formatRequestTime,
  pickupTypeLabel,
  statusLabel,
  type CrewCall,
} from "@/lib/crew-api";

export default function CrewCallsPage() {
  const [calls, setCalls] = useState<CrewCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("수거 요청 목록을 확인하는 중입니다.");

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await fetchCrewCalls();
      setCalls(data);
      setMessage(data.length > 0 ? "수거 요청 목록이 업데이트되었습니다." : "현재 새로운 수거 요청이 없습니다.");
    } catch {
      setMessage("수거 요청 목록을 불러오지 못했습니다. 백엔드 연결 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalls();
    const timer = window.setInterval(() => {
      void loadCalls();
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-sm font-black text-lgred">PICKUP CREW</p>
            <h1 className="mt-1 text-3xl font-black text-black">수거 요청 목록</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              새 콜을 확인하고, 요청을 선택하면 콜 상세 페이지로 이동합니다.
            </p>
          </div>
          <button
            className="flex h-11 items-center gap-2 rounded-[12px] bg-slate-100 px-4 text-sm font-black text-slate-700"
            disabled={loading}
            onClick={() => void loadCalls()}
            type="button"
          >
            <RefreshCw size={16} />
            새로고침
          </button>
        </header>

        <section className="mt-4 rounded-[18px] bg-lgred p-4 text-white">
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="대기 콜" value={String(calls.length)} />
            <MiniStat label="알림" value={calls.length > 0 ? "도착" : "없음"} />
            <MiniStat label="상태" value={loading ? "갱신 중" : "준비"} />
          </div>
        </section>

        <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-black text-black">
            <Users size={16} />
            수거 요청
          </div>
          <div className="mt-3 max-h-[540px] space-y-3 overflow-y-auto pr-1">
            {calls.length > 0 ? (
              calls.map((call) => {
                const pickupRequestId = call.pickupRequest?.pickupRequestId;
                return (
                  <Link
                    key={call.id}
                    className="block rounded-[16px] border border-slate-200 bg-slate-50 p-4 transition hover:border-lgred hover:bg-lgred/5"
                    href={pickupRequestId ? `/calls/${pickupRequestId}` : "/"}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">{applianceName(call)}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {call.pickupRequest?.address ?? "수거 주소 정보 없음"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600">
                        {statusLabel(call.pickupRequest?.status)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <InfoTile label="요청 시간" value={formatRequestTime(call.pickupRequest?.requestedAt, call.pickupRequest?.scheduledAt)} />
                      <InfoTile label="예약 방식" value={pickupTypeLabel(call.pickupRequest?.pickupType)} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm font-black text-lgred">
                      <span className="inline-flex items-center gap-2">
                        <Bell size={15} />
                        콜 상세 보기
                      </span>
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[16px] bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                현재 수락 가능한 수거 요청이 없습니다.
              </div>
            )}
          </div>
        </section>

        <div className="mt-4 rounded-[14px] bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
          {loading ? "콜 목록 갱신 중..." : message}
        </div>
      </div>
    </CrewPhoneShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white/12 p-2">
      <p className="text-[11px] font-bold text-white/60">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white p-3">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}
