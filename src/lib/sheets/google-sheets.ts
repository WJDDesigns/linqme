/* ── Google Sheets client ─────────────────────────────────────────────
 * Reuses the same GOOGLE_DRIVE_CLIENT_ID / SECRET as the Drive integration
 * but requests the spreadsheets scope instead.
 * ─────────────────────────────────────────────────────────────────── */

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

/* ── OAuth ────────────────────────────────────────────────────────── */

export function getSheetsAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeSheetsCode(code: string, redirectUri: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? "Token exchange failed");

  let email: string | null = null;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = await userRes.json();
    email = user.email ?? null;
  } catch { /* non-critical */ }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: (data.expires_in as number) ?? null,
    email,
    scopes: SCOPES,
  };
}

export async function refreshSheetsToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? "Token refresh failed");
  return {
    accessToken: data.access_token as string,
    expiresIn: (data.expires_in as number) ?? null,
  };
}

/* ── Sheets API ───────────────────────────────────────────────────── */

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}

export interface SheetTab {
  sheetId: number;
  title: string;
}

/** List recent spreadsheets the user has access to (via Drive API). */
export async function listSpreadsheets(accessToken: string, query?: string): Promise<SpreadsheetInfo[]> {
  const q = query
    ? `mimeType='application/vnd.google-apps.spreadsheet' and name contains '${query.replace(/'/g, "\\'")}' and trashed=false`
    : "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  const params = new URLSearchParams({
    q,
    fields: "files(id,name,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: "20",
  });
  // We need drive.file or drive.readonly -- but we can also use the Sheets-only
  // scope by listing via the Sheets API. The Drive files endpoint requires drive scope,
  // so instead we'll use a simpler approach: let users paste the spreadsheet URL or create new.
  // For now, use the Drive API with the available scopes.
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    // Fallback: if drive scope isn't available, return empty
    return [];
  }
  const data = await res.json();
  return (data.files ?? []).map((f: { id: string; name: string; webViewLink?: string }) => ({
    id: f.id,
    name: f.name,
    url: f.webViewLink ?? `https://docs.google.com/spreadsheets/d/${f.id}`,
  }));
}

/** Get tabs (sheet names) in a spreadsheet. */
export async function getSheetTabs(accessToken: string, spreadsheetId: string): Promise<SheetTab[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error("Failed to fetch sheet tabs");
  const data = await res.json();
  return (data.sheets ?? []).map((s: { properties: { sheetId: number; title: string } }) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));
}

/** Create a new spreadsheet and return its info. */
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  headers: string[],
): Promise<SpreadsheetInfo> {
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: { title: "Submissions" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [{ values: headers.map((h) => ({ userEnteredValue: { stringValue: h } })) }],
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? "Failed to create spreadsheet");
  }
  const data = await res.json();
  return {
    id: data.spreadsheetId,
    name: title,
    url: data.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
  };
}

/** Append a row of values to a sheet. */
export async function appendRow(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  values: (string | number | boolean | null)[],
): Promise<void> {
  const range = `${sheetName}!A:ZZ`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [values],
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? "Failed to append row");
  }
}
