"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { Camera, LockKey, User, WarningCircle } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function profileName(session: Session) {
  return session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário";
}

export function UserAvatar({ name, url, large = false }: { name: string; url?: string; large?: boolean }) {
  return <span className={`avatar${large ? " avatar-large" : ""}`}>{url ? <Image src={url} alt="" width={large ? 76 : 40} height={large ? 76 : 40} unoptimized /> : name.slice(0, 1).toUpperCase()}</span>;
}

export function ProfileSettings({ session, open, onClose, onNotice }: { session: Session; open: boolean; onClose: () => void; onNotice: (message: string) => void }) {
  const currentAvatar = (session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture) as string | undefined;
  const hasPassword = session.user.identities?.some((identity) => identity.provider === "email") ?? false;
  const [name, setName] = useState(() => profileName(session));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState(currentAvatar || "");
  const [profileBusy, setProfileBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [message, setMessage] = useState("");

  function resetAndClose() {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setName(profileName(session));
    setPreview(currentAvatar || "");
    setPhoto(null);
    setCurrentPassword("");
    setPassword("");
    setConfirmation("");
    setMessage("");
    onClose();
  }

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type)) || file.size > 2_097_152) {
      setMessage("Escolha uma imagem JPG, PNG ou WebP de até 2 MB.");
      return;
    }
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const client = getSupabaseBrowser();
    if (!client) return setMessage("Supabase não configurado.");
    setProfileBusy(true);
    setMessage("");
    try {
      let avatarUrl = currentAvatar;
      if (photo) {
        const path = `${session.user.id}/avatar`;
        const { error } = await client.storage.from("avatars").upload(path, photo, { upsert: true, contentType: photo.type, cacheControl: "3600" });
        if (error) throw error;
        avatarUrl = `${client.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      }
      const { error } = await client.auth.updateUser({ data: { ...session.user.user_metadata, full_name: name.trim(), avatar_url: avatarUrl } });
      if (error) throw error;
      onNotice("Perfil atualizado com sucesso.");
      resetAndClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o perfil.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) return setMessage("As novas senhas não coincidem.");
    const client = getSupabaseBrowser();
    if (!client) return setMessage("Supabase não configurado.");
    setPasswordBusy(true);
    setMessage("");
    try {
      const result = hasPassword
        ? await client.auth.updateUser({ password, current_password: currentPassword })
        : await client.auth.updateUser({ password });
      if (result.error) throw result.error;
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
      onNotice(hasPassword ? "Senha alterada com sucesso." : "Senha criada com sucesso.");
      resetAndClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setPasswordBusy(false);
    }
  }

  return <Modal open={open} title="Minha conta" description="Atualize como você aparece e protege seu acesso." onClose={() => { if (!profileBusy && !passwordBusy) resetAndClose(); }}><div className="profile-settings"><form className="form-grid" onSubmit={saveProfile}><div className="profile-section-title"><User size={20} /><div><strong>Perfil</strong><small>Nome e foto do usuário</small></div></div><label className="profile-photo-picker"><UserAvatar name={name || "U"} url={preview} large /><span><strong>Escolher foto</strong><small>JPG, PNG ou WebP, até 2 MB</small></span><Camera size={21} /><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} /></label><div className="field"><label htmlFor="profile-name">Nome de usuário</label><input className="input" id="profile-name" maxLength={60} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></div><button className="button primary" type="submit" disabled={profileBusy}>{profileBusy ? "Salvando" : "Salvar perfil"}</button></form><div className="profile-divider" /><form className="form-grid" onSubmit={changePassword}><div className="profile-section-title"><LockKey size={20} /><div><strong>{hasPassword ? "Trocar senha" : "Criar senha"}</strong><small>Mínimo de 8 caracteres</small></div></div>{hasPassword && <div className="field"><label htmlFor="current-password">Senha atual</label><input className="input" id="current-password" type="password" minLength={8} maxLength={72} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></div>}<div className="form-row"><div className="field"><label htmlFor="new-password">Nova senha</label><input className="input" id="new-password" type="password" minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><div className="field"><label htmlFor="confirm-password">Confirmar senha</label><input className="input" id="confirm-password" type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div></div><button className="button ghost" type="submit" disabled={passwordBusy}>{passwordBusy ? "Alterando" : hasPassword ? "Alterar senha" : "Criar senha"}</button></form>{message && <p className="profile-message" role="status"><WarningCircle size={18} />{message}</p>}</div></Modal>;
}
