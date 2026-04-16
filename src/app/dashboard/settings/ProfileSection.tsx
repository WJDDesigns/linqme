"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  updateProfileAction,
  updateEmailAction,
  updatePasswordAction,
  uploadAvatarAction,
} from "./actions";

interface Props {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
}

const INPUT_CLS =
  "w-full bg-surface-container-high/40 border border-outline-variant/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm";

const LABEL_CLS =
  "font-label uppercase tracking-wider text-[11px] text-on-surface-variant/60";

const BTN_PRIMARY =
  "bg-primary text-on-primary font-semibold rounded-xl px-6 py-3 text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.3)] disabled:opacity-50 transition-all";

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function ProfileSection({ fullName, email, avatarUrl }: Props) {
  // Profile (name + avatar)
  const [profilePending, startProfileTransition] = useTransition();
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [currentName, setCurrentName] = useState(fullName ?? "");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Email
  const [emailPending, startEmailTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Password
  const [passwordPending, startPasswordTransition] = useTransition();
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setProfileMsg(null);

    const fd = new FormData();
    fd.append("avatar", file);

    startProfileTransition(async () => {
      try {
        const url = await uploadAvatarAction(fd);
        setCurrentAvatarUrl(url);
        setProfileMsg({ text: "Avatar updated!", ok: true });
      } catch (err) {
        setProfileMsg({
          text: err instanceof Error ? err.message : "Avatar upload failed.",
          ok: false,
        });
      } finally {
        setAvatarUploading(false);
      }
    });
  }

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMsg(null);
    const fd = new FormData(e.currentTarget);
    startProfileTransition(async () => {
      try {
        await updateProfileAction(fd);
        setProfileMsg({ text: "Profile saved!", ok: true });
      } catch (err) {
        setProfileMsg({
          text: err instanceof Error ? err.message : "Failed to save profile.",
          ok: false,
        });
      }
    });
  }

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailMsg(null);
    const fd = new FormData(e.currentTarget);
    startEmailTransition(async () => {
      try {
        await updateEmailAction(fd);
        setEmailMsg({
          text: "Confirmation sent to both your old and new email addresses.",
          ok: true,
        });
      } catch (err) {
        setEmailMsg({
          text: err instanceof Error ? err.message : "Failed to update email.",
          ok: false,
        });
      }
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMsg(null);
    const fd = new FormData(e.currentTarget);

    const newPw = fd.get("new_password") as string;
    const confirmPw = fd.get("confirm_password") as string;
    if (newPw !== confirmPw) {
      setPasswordMsg({ text: "Passwords do not match.", ok: false });
      return;
    }
    if (newPw.length < 8) {
      setPasswordMsg({ text: "Password must be at least 8 characters.", ok: false });
      return;
    }

    startPasswordTransition(async () => {
      try {
        await updatePasswordAction(fd);
        setPasswordMsg({ text: "Password updated!", ok: true });
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        setPasswordMsg({
          text: err instanceof Error ? err.message : "Failed to update password.",
          ok: false,
        });
      }
    });
  }

  const initials = getInitials(currentName || fullName, email);

  return (
    <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8 space-y-8">
      <h2 className="text-lg font-bold font-headline text-on-surface">
        Profile
      </h2>

      {/* ─── Avatar + Name ─── */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="flex items-center gap-5">
          {/* Avatar circle */}
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-tertiary/10 flex items-center justify-center ring-2 ring-primary/10">
              {currentAvatarUrl ? (
                <Image
                  src={currentAvatarUrl}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary select-none">
                  {initials}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading || profilePending}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <i className="fa-solid fa-camera text-white text-sm" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface">
              {currentName || email}
            </p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5">{email}</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading || profilePending}
              className="mt-2 text-xs text-primary hover:underline disabled:opacity-50"
            >
              {avatarUploading ? "Uploading..." : "Change avatar"}
            </button>
          </div>
        </div>

        {/* Full name */}
        <div>
          <label className={LABEL_CLS}>Full name</label>
          <input
            name="full_name"
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder="Your full name"
            className={`${INPUT_CLS} mt-1.5`}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {profileMsg && (
            <span
              className={`text-xs font-medium ${
                profileMsg.ok ? "text-tertiary" : "text-error"
              }`}
            >
              {profileMsg.text}
            </span>
          )}
          <button type="submit" disabled={profilePending} className={BTN_PRIMARY}>
            {profilePending ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="border-t border-outline-variant/10" />

      {/* ─── Email ─── */}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <h3 className="text-sm font-bold text-on-surface">Change Email</h3>
        <p className="text-xs text-on-surface-variant/60">
          Changing your email requires re-verification. A confirmation link will
          be sent to both your current and new email addresses.
        </p>
        <div>
          <label className={LABEL_CLS}>New email address</label>
          <input
            name="new_email"
            type="email"
            required
            placeholder="new@example.com"
            className={`${INPUT_CLS} mt-1.5`}
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          {emailMsg && (
            <span
              className={`text-xs font-medium ${
                emailMsg.ok ? "text-tertiary" : "text-error"
              }`}
            >
              {emailMsg.text}
            </span>
          )}
          <button type="submit" disabled={emailPending} className={BTN_PRIMARY}>
            {emailPending ? "Sending..." : "Update Email"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="border-t border-outline-variant/10" />

      {/* ─── Password ─── */}
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h3 className="text-sm font-bold text-on-surface">Change Password</h3>
        <div>
          <label className={LABEL_CLS}>New password</label>
          <input
            name="new_password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            className={`${INPUT_CLS} mt-1.5`}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Confirm new password</label>
          <input
            name="confirm_password"
            type="password"
            required
            minLength={8}
            placeholder="Re-enter new password"
            className={`${INPUT_CLS} mt-1.5`}
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          {passwordMsg && (
            <span
              className={`text-xs font-medium ${
                passwordMsg.ok ? "text-tertiary" : "text-error"
              }`}
            >
              {passwordMsg.text}
            </span>
          )}
          <button type="submit" disabled={passwordPending} className={BTN_PRIMARY}>
            {passwordPending ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}
