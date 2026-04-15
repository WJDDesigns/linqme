"use client";

import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), { ssr: false });

export default AnalyticsCharts;
