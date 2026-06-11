"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import {
  acceptCrewCall,
  applianceName,
  fetchCrewCallDetail,
  formatDistance,
  formatRequestTime,
  pickupTypeLabel,
  statusLabel,
  type CrewCall,
} from "@/lib/crew-api";
import { ArrowLeft, Check, MapPin, PackageCheck, ShieldCheck, Truck, Users, Warehouse } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export default function CrewCallDetailPage() {
  const router = useRouter();
  const params = useParams<{ pickupRequestId: string }>();
  const pickupRequestId = Number(params.pickupRequestId);
  const [call, setCall] = useState<CrewCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("콜 상세 정보를 불러오는 중입니다.");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchCrewCallDetail(pickupRequestId);
        setCall(data);
        setMessage("콜 상세 정보를 확인했습니다.");
      } catch {
        setMessage("콜 상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [pickupRequestId]);

  const status = call?.pickupRequest?.status ?? "";
  const hasAcceptedStatus = ["ASSIGNED", "IN_PROGRESS", "ARRIVED", "COMPLETED"].includes(status);
  const canAccept = Boolean(call) && !hasAcceptedStatus;
  const canOpenActive = hasAcceptedStatus;

  const actionLabel = useMemo(() => {
    if (loading) {
      return "콜 수락 처리 중...";
    }
    if (status === "CONFIRMED") {
      return "예약 콜 수락하기";
    }
    return "콜 수락하기";
  }, [loading, status]);

  const acceptCall = async () => {
    setLoading(true);
    try {
      const data = await acceptCrewCall(pickupRequestId);
      setCall(data);
      setMessage("콜을 수락했습니다. 진행 화면으로 이동합니다.");
      router.push(`/calls/${pickupRequestId}/active`);
    } catch {
      setMessage("콜 수락 처리 중 문제가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <CrewPhoneShell>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 [-webkit-overflow-scrolling:touch]">
          <header className="flex items-start justify-between">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink"
              onClick={() => router.push("/")}
              type="button"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-right">
              <p className="text-sm font-black text-lgred">CALL DETAIL</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{statusLabel(status)}</p>
            </div>
          </header>

          <section className="mt-4 rounded-[18px] bg-lgred p-4 text-white">
            <p className="text-xs font-black text-white/70">선택한 수거 요청</p>
            <h1 className="mt-2 text-2xl font-black">{call ? applianceName(call) : "수거 요청"}</h1>
            <p className="mt-2 text-sm font-semibold text-white/85">
              요청 위치와 시간, 배차 정보를 확인한 뒤 콜 수락 또는 진행 처리 화면으로 이동할 수 있습니다.
            </p>
          </section>

          <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
            <InfoLine
              icon={<MapPin size={18} />}
              title="수거 위치"
              description={call?.pickupRequest?.address ?? "수거 위치 정보 없음"}
            />
            <InfoLine
              icon={<PackageCheck size={18} />}
              title="수거 대상"
              description={call ? applianceName(call) : "수거 품목 정보 없음"}
            />
            <InfoLine
              icon={<ShieldCheck size={18} />}
              title="사전 동의"
              description={call?.userConsent?.agreedToCreditPolicy ? "보상 정책 및 규정 동의 완료" : "동의 정보 없음"}
            />
          </section>

          <section className="mt-4 grid grid-cols-2 gap-2">
            <InfoTile
              label="요청 시간"
              value={formatRequestTime(call?.pickupRequest?.requestedAt, call?.pickupRequest?.scheduledAt)}
            />
            <InfoTile label="예약 방식" value={pickupTypeLabel(call?.pickupRequest?.pickupType)} />
            <InfoTile label="매칭 점수" value={`${call?.dispatchInfo?.matchScore ?? 0}점`} />
            <InfoTile label="우선 순위" value={`${call?.dispatchInfo?.priorityRank ?? 0}순위`} />
          </section>

          <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black text-black">
              <Users size={16} />
              배차 및 주문 정보
            </div>
            <div className="mt-3 space-y-2">
              <InfoTileBlock
                label="우선 배차 사유"
                value={call?.dispatchInfo?.recommendedReason ?? "배차 기준 정보 없음"}
              />
              <InfoTileBlock
                label="처리 허브"
                value={call?.tracking?.processingCenter?.label ?? "허브 정보 없음"}
              />
              <InfoTileBlock
                label="수거지까지"
                value={formatDistance(call?.tracking?.metrics?.crewToPickupMeters)}
              />
            </div>
          </section>
        </div>

        <div className="absolute bottom-0 left-5 right-5 rounded-t-[24px] border-t border-slate-200 bg-white/95 px-5 pb-5 pt-4 backdrop-blur">
          {canAccept ? (
            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-lgred text-sm font-black text-white disabled:bg-slate-300"
              disabled={loading || !call}
              onClick={() => void acceptCall()}
              type="button"
            >
              <Check size={16} />
              {actionLabel}
            </button>
          ) : null}

          {canOpenActive ? (
            <Link
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#202632] text-sm font-black text-white"
              href={`/calls/${pickupRequestId}/active`}
            >
              {status === "COMPLETED" ? <Warehouse size={16} /> : <Truck size={16} />}
              {status === "COMPLETED" ? "처리 완료 화면" : "진행 중인 콜"}
            </Link>
          ) : null}

          <Link
            className="mt-3 flex h-12 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white text-sm font-black text-slate-700"
            href="/"
          >
            목록으로 돌아가기
          </Link>

          <div className="mt-3 rounded-[14px] bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
            {message}
          </div>
        </div>
      </div>
    </CrewPhoneShell>
  );
}

function InfoLine({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-lgred/10 text-lgred">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-slate-50 p-3">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-black">{value}</p>
    </div>
  );
}

function InfoTileBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-black">{value}</p>
    </div>
  );
}
