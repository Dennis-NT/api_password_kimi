import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Import, Lock, Loader2, Upload } from "lucide-react";
import type { Account } from "../types";
import { SearchBar } from "./SearchBar";
import { AccountCard } from "./AccountCard";
import { AccountDialog } from "./AccountDialog";
import { useToast } from "../hooks/useToast";

interface MainViewProps {
  onLock: () => void;
}

export function MainView({ onLock }: MainViewProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { showToast } = useToast();

  const loadAccounts = useCallback(async () => {
    try {
      const data = await invoke<Account[]>("get_accounts", { search: searchQuery || null });
      setAccounts(data);
    } catch (error) {
      showToast({ type: "error", title: "加载失败", message: String(error) });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAdd = () => {
    setEditingAccount(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await invoke("delete_account", { id });
      showToast({ type: "success", title: "删除成功" });
      loadAccounts();
    } catch (error) {
      showToast({ type: "error", title: "删除失败", message: String(error) });
    }
  };

  const handleSave = async (account: any) => {
    try {
      if (editingAccount) {
        await invoke("update_account", { id: editingAccount.id, account });
        showToast({ type: "success", title: "更新成功" });
      } else {
        await invoke("add_account", { account });
        showToast({ type: "success", title: "添加成功" });
      }
      setIsDialogOpen(false);
      loadAccounts();
    } catch (error) {
      showToast({ type: "error", title: "保存失败", message: String(error) });
    }
  };

  const handleCopyAll = async (id: string) => {
    try {
      const count = await invoke<number>("copy_account_fields", { id });
      showToast({ type: "success", title: `成功复制 ${count} 个字段` });
    } catch (error) {
      showToast({ type: "error", title: "复制失败", message: String(error) });
    }
  };

  const handleImport = async () => {
    showToast({ type: "info", title: "导入功能开发中" });
  };

  const handleExport = async () => {
    showToast({ type: "info", title: "导出功能开发中" });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">VaultPaste</h1>
              <p className="text-sm text-text-secondary">{accounts.length} 个账号</p>
            </div>
          </div>
          <button onClick={onLock} className="btn-secondary">
            <Lock className="w-4 h-4" />
            锁定
          </button>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="flex gap-3 mt-4">
          <button onClick={handleAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            添加账号
          </button>
          <button onClick={handleImport} className="btn-secondary">
            <Import className="w-4 h-4" />
            导入
          </button>
          <button onClick={handleExport} className="btn-secondary">
            <Upload className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">暂无账号</p>
            <p className="text-sm text-text-secondary/60 mt-1">点击"添加账号"开始使用</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => handleEdit(account)}
                onDelete={() => handleDelete(account.id)}
                onCopyAll={() => handleCopyAll(account.id)}
              />
            ))}
          </div>
        )}
      </div>

      {isDialogOpen && (
        <AccountDialog
          account={editingAccount}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
