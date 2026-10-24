"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

const JOIN_URL = "https://gwc-newsletter.vercel.app/join";

export function JoinQrCode() {
  const containerRef = useRef<HTMLDivElement>(null);

  function downloadQrCode() {
    const svg = containerRef.current?.querySelector("svg");

    if (!svg) return;

    const markup = new XMLSerializer().serializeToString(svg);

    const blob = new Blob([markup], {
      type: "image/svg+xml;charset=utf-8",
    });

    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "glory-worship-church-join-qr.svg";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Scan to connect
      </p>

      <h2 className="mt-3 text-2xl font-semibold text-[#002B3D]">
        Join our church community
      </h2>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
        Open your phone camera, scan the code, and complete the joining form.
      </p>

      <div
        ref={containerRef}
        className="mx-auto my-6 w-fit rounded-2xl border border-slate-100 bg-white p-5"
      >
        <QRCodeSVG
          value={JOIN_URL}
          title="Join Glory Worship Church"
          size={240}
          level="M"
          marginSize={4}
          bgColor="#FFFFFF"
          fgColor="#002B3D"
          className="h-auto max-w-full"
        />
      </div>

      <a
        href={JOIN_URL}
        className="break-all text-sm font-medium text-[#002B3D] underline underline-offset-4"
      >
        {JOIN_URL}
      </a>

      <button
        type="button"
        onClick={downloadQrCode}
        className="mt-6 w-full cursor-pointer rounded-xl bg-[#002B3D] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Download QR Code
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Download the code for your church noticeboard, welcome desk, or
        presentation slides.
      </p>
    </section>
  );
}
