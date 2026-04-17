import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Copy, Edit2, Trash2, MoreVertical, Key } from "lucide-react";
import type { Account, TotpResult } from "../types";
import { TotpCountdown } from "./TotpCountdown";

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
  onCopyAll: () => void;
}

export function AccountCard({ account, onEdit, onDelete, onCopyAll }: AccountCardProps) {
  const [totp, setTotp] = useState<TotpResult | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (account.totp_secret) {
      const updateTotp = async () => {
        try {
          const result = await invoke<TotpResult>("generate_totp", {
            secret: account.totp_secret,
          });
          setTotp(result);
        } catch (error) {
          console.error("Failed to generate TOTP:", error);
        }
      };

      updateTotp();
      const interval = setInterval(updateTotp, 1000);
      return () => clearInterval(interval);
    }
  }, [account.totp_secret]);

  return (
    <div className="card group hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary">
              {account.site_name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="font-medium text-text truncate">{account.site_name}</h3>
            <p className="text-sm text-text-secondary truncate">{account.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totp && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover rounded-lg">
              <Key className="w-4 h-4 text-primary" />
              <span className="font-mono text-lg font-medium text-text tracking-wider">
                {totp.code}
              </span>
              <TotpCountdown remaining={totp.remaining} />
            </div>
          )}

          <button
            onClick={onCopyAll}
            className="btn-primary py-2"
            title="复制全部"
          >
            <Copy className="w-4 h-4" />
            复制全部
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn-secondary p-2"
              title="更多"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-32 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(account.api_key || account.phone || account.access_token || account.notes) && (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
          {account.api_key && (
            <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
              API Key
            </span>
          )}
          {account.phone && (
            <span className="px-2 py-1 text-xs bg-success/10 text-success rounded">
              手机
            </span>
          )}
          {account.access_token && (
            <span className="px-2 py-1 text-xs bg-warning/10 text-warning rounded">
              Token
            </span>
          )}
          {account.notes && (
            <span className="px-2 py-1 text-xs bg-text-secondary/10 text-text-secondary rounded">
              备注
            </span>
          )}
        </div>
      )}
    </div>
  );
}
