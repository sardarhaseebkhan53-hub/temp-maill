import { Copy, Clock, Trash2, Home, Inbox, MessageSquare, Shield, User } from "lucide-react";
import { HavenWordmark } from "@/components/brand/logo";

export function MobilePreviewMockup({ address }: { address: string }) {
  return (
    <div className="hidden xl:flex flex-col items-center justify-center p-2 select-none shrink-0">
      {/* Smartphone frame container */}
      <div className="w-[240px] rounded-[38px] border-[5px] border-slate-800 bg-[#070a10] p-3 shadow-[0_0_35px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between aspect-[9/18.5]">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full flex items-center justify-between px-2">
          <div className="size-2 rounded-full bg-slate-800" />
          <div className="size-1.5 rounded-full bg-slate-800" />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 pt-3 px-2">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span className="text-[8px]">5G</span>
            <div className="w-4 h-2 border border-slate-400 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-full bg-[#00f5a0] rounded-xs" />
            </div>
          </div>
        </div>

        {/* Mobile App Header */}
        <div className="flex items-center justify-between px-1 py-1.5 border-b border-white/[0.06] mt-1">
          <div className="scale-75 origin-left">
            <HavenWordmark />
          </div>
          <div className="size-5 rounded-md bg-white/[0.08] flex items-center justify-center text-slate-300 text-[10px]">
            ☰
          </div>
        </div>

        {/* Temp Email Card (Mobile) */}
        <div className="rounded-xl border border-[#00f5a0]/30 bg-[#0c1017] p-2 mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[8px]">
            <span className="text-slate-400 font-semibold uppercase">YOUR TEMPORARY EMAIL</span>
            <span className="text-[#00f5a0] font-mono">Expires in 08:32</span>
          </div>

          <div className="rounded-lg bg-[#070a10] border border-slate-800 px-2 py-1 flex items-center justify-between">
            <span className="font-mono text-[9px] text-white truncate max-w-[130px]">
              {address}
            </span>
            <Copy className="size-2.5 text-slate-400" />
          </div>

          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <div className="rounded bg-white/[0.06] py-1 text-center text-[7px] text-white font-medium">Copy</div>
            <div className="rounded bg-white/[0.06] py-1 text-center text-[7px] text-white font-medium">QR</div>
            <div className="rounded bg-white/[0.06] py-1 text-center text-[7px] text-white font-medium">Share</div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[7px]">
            <div className="flex items-center gap-0.5 text-slate-300">
              <Clock className="size-2 text-[#00f5a0]" /> Extend
            </div>
            <div className="flex items-center gap-0.5 text-red-400">
              <Trash2 className="size-2" /> Delete
            </div>
          </div>
        </div>

        {/* Mobile Inbox List */}
        <div className="flex-1 mt-2 min-h-0 space-y-1 overflow-hidden">
          <div className="flex items-center justify-between text-[8px] px-1 text-slate-400">
            <span className="font-semibold text-white">Inbox</span>
            <span>3 unread</span>
          </div>

          <div className="rounded-lg bg-white/[0.04] p-1.5 flex items-center gap-2 border border-white/[0.05]">
            <div className="size-5 rounded-full bg-[#1e293b] flex items-center justify-center text-[8px] text-white shrink-0">
              GH
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[8px]">
                <span className="font-semibold text-white truncate">GitHub</span>
                <span className="text-slate-500 text-[7px]">11:42 AM</span>
              </div>
              <p className="text-[7px] text-slate-400 truncate">Your verification code</p>
            </div>
          </div>

          <div className="rounded-lg bg-transparent p-1.5 flex items-center gap-2">
            <div className="size-5 rounded-full bg-black border border-red-500/30 flex items-center justify-center text-[8px] text-red-500 font-bold shrink-0">
              N
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[8px]">
                <span className="font-semibold text-slate-300 truncate">Netflix</span>
                <span className="text-slate-500 text-[7px]">10:35 AM</span>
              </div>
              <p className="text-[7px] text-slate-400 truncate">New sign-in</p>
            </div>
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <div className="pt-2 border-t border-white/[0.08] grid grid-cols-5 gap-1 text-[7px] text-center text-slate-400">
          <div className="flex flex-col items-center text-[#00f5a0]">
            <Home className="size-3" />
            <span>Home</span>
          </div>
          <div className="flex flex-col items-center">
            <Inbox className="size-3" />
            <span>Inbox</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageSquare className="size-3" />
            <span>SMS</span>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="size-3" />
            <span>Tools</span>
          </div>
          <div className="flex flex-col items-center">
            <User className="size-3" />
            <span>Account</span>
          </div>
        </div>
      </div>
    </div>
  );
}
