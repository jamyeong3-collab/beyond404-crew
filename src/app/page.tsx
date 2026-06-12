"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronRight, RefreshCw, Truck, Users } from "lucide-react";
import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import {
  applianceName,
  fetchCrewCalls,
  formatRequestTime,
  pickupTypeLabel,
  statusLabel,
  type CrewCall,
} from "@/lib/crew-api";

const ongoingStatuses = new Set(["ASSIGNED", "IN_PROGRESS", "ARRIVED"]);

export default function CrewCallsPage() {
  const [calls, setCalls] = useState<CrewCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadCalls = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchCrewCalls();
      setCalls(data);
      setLastLoadedAt(formatLoadedTime(new Date()));
    } catch {
      setErrorMessage("수거 요청 목록을 불러오지 못했습니다. 백엔드 연결 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalls();
    const timer = window.setInterval(() => {
      void loadCalls();
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const { pendingCalls, activeCalls } = useMemo(() => {
    const pending = calls.filter((call) => !ongoingStatuses.has(call.pickupRequest?.status ?? "") && call.pickupRequest?.status !== "COMPLETED");
    const active = calls.filter((call) => ongoingStatuses.has(call.pickupRequest?.status ?? ""));
    return { pendingCalls: pending, activeCalls: active };
  }, [calls]);

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-sm font-black text-lgred">PICKUP CREW</p>
            <h1 className="mt-1 text-3xl font-black text-black">수거 요청 목록</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              새 요청을 확인하고, 수락 후에는 진행 중인 수거에서 바로 이동 상황을 관리할 수 있습니다.
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
            <MiniStat label="수거 요청" value={String(pendingCalls.length)} />
            <MiniStat label="진행 중" value={String(activeCalls.length)} />
            <MiniStat label="상태" value={loading ? "갱신 중" : "준비"} />
          </div>
        </section>

        <CallsSection
          calls={pendingCalls}
          emptyMessage="현재 수락 대기 중인 수거 요청이 없습니다."
          icon={<Users size={16} />}
          title="수거 요청"
          toHref={(pickupRequestId) => `/calls/${pickupRequestId}`}
        />

        <CallsSection
          calls={activeCalls}
          emptyMessage="현재 진행 중인 수거가 없습니다."
          icon={<Truck size={16} />}
          title="진행 중인 수거"
          toHref={(pickupRequestId) => `/calls/${pickupRequestId}/active`}
        />

        <div
          className={`mt-4 rounded-[14px] px-4 py-3 text-sm font-bold leading-6 ${
            errorMessage ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
          }`}
        >
          {loading
            ? "콜 목록을 새로 확인하고 있습니다..."
            : errorMessage ?? `백엔드 연결 정상${lastLoadedAt ? ` · 마지막 확인 ${lastLoadedAt}` : ""}`}
        </div>
      </div>
    </CrewPhoneShell>
  );
}

function CallsSection({
  calls,
  emptyMessage,
  icon,
  title,
  toHref,
}: {
  calls: CrewCall[];
  emptyMessage: string;
  icon: React.ReactNode;
  title: string;
  toHref: (pickupRequestId: number) => string;
}) {
  return (
    <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-black text-black">
        {icon}
        {title}
      </div>
      <div className="mt-3 max-h-[260px] space-y-3 overflow-y-auto pr-1">
        {calls.length > 0 ? (
          calls.map((call) => {
            const pickupRequestId = call.pickupRequest?.pickupRequestId;
            if (!pickupRequestId) {
              return null;
            }

            return (
              <Link
                key={`${title}-${call.id}`}
                className="block rounded-[16px] border border-slate-200 bg-slate-50 p-4 transition hover:border-lgred hover:bg-lgred/5"
                href={toHref(pickupRequestId)}
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
                  <InfoTile
                    label="요청 시간"
                    value={formatRequestTime(call.pickupRequest?.requestedAt, call.pickupRequest?.scheduledAt)}
                  />
                  <InfoTile label="예약 방식" value={pickupTypeLabel(call.pickupRequest?.pickupType)} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-black text-lgred">
                  <span className="inline-flex items-center gap-2">
                    <Bell size={15} />
                    {title === "진행 중인 수거" ? "진행 화면 열기" : "콜 상세 보기"}
                  </span>
                  <ChevronRight size={16} />
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-[16px] bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
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

function formatLoadedTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
