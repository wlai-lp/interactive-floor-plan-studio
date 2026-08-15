"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return <Editor />;
}
