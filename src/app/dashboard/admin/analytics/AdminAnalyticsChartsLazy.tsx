"use client";

import dynamic from "next/dynamic";

const AdminAnalyticsCharts = dynamic(() => import("./AdminAnalyticsCharts"), { ssr: false });

export default AdminAnalyticsCharts;
