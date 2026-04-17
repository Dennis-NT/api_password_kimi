import { useState, useEffect } from "react";
import { X, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import type { Account, NewAccount } from "../types";


interface AccountDialogProps {
  account: Account | null;
  onClose: () => void;
  onSave: (account: NewAccount) => void;
}

interface FormData {
  site_name: string;
  username: string;
  password: string;
  totp_secret: string;
  api_key: string;
  phone: string;
  access_token: string;
  notes: string;
}

export function AccountDialog({ account, onClose, onSave }: AccountDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    site_name: "",
    username: "",
    password: "",
    totp_secret: "",
    api_key: "",
    phone: "",
    access_token: "",
    notes: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        site_name: account.site_name,
        username: account.username,
        password: account.password,
        totp_secret: account.totp_secret || "",
        api_key: account.api_key || "",
        phone: account.phone || "",
        access_token: account.access_token || "",
        notes: account.notes || "",
      });
      setShowAdvanced(true);
    }
  }, [account]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.site_name.trim()) {
      newErrors.site_name = "请输入网站名";
    }
    if (!formData.username.trim()) {
      newErrors.username = "请输入账号";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      site_name: formData.site_name.trim(),
      username: formData.username.trim(),
      password: formData.password,
      totp_secret: formData.totp_secret.trim() || undefined,
      api_key: formData.api_key.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      access_token: formData.access_token.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });
  };

  const inputFields = [
    { key: "site_name", label: "网站名", placeholder: "如: GitHub", required: true },
    { key: "username", label: "账号", placeholder: "用户名或邮箱", required: true },
  ] as const;

  const advancedFields = [
    { key: "password" as const, label: "密码", placeholder: "密码", isPassword: true },
    { key: "totp_secret" as const, label: "TOTP Secret", placeholder: "2FA 密钥 (Base32)" },
    { key: "api_key" as const, label: "API Key", placeholder: "API 密钥" },
    { key: "phone" as const, label: "手机号", placeholder: "手机号码" },
    { key: "access_token" as const, label: "Access Token", placeholder: "访问令牌" },
    { key: "notes" as const, label: "备注", placeholder: "其他信息" },
  ];

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog-content">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text">
              {account ? "编辑账号" : "添加账号"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <div className="space-y-4">
            {inputFields.map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-text mb-1.5">
                  {label}
                  {required && <span className="text-danger ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className={`input ${errors[key] ? "border-danger focus:border-danger focus:ring-danger/50" : ""}`}
                />
                {errors[key] && (
                  <p className="mt-1 text-sm text-danger">{errors[key]}</p>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors py-2"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? "收起更多字段" : "展开更多字段"}
            </button>

            {showAdvanced && (
              <div className="space-y-4 animate-fade-in">
                {advancedFields.map(({ key, label, placeholder, isPassword }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type={isPassword && !showPassword ? "password" : "text"}
                        value={formData[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="input pr-10"
                      />
                      {isPassword && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {account ? "保存" : "添加"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
