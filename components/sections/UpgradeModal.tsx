"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { buildUpgradeWhatsappUrl } from "@/lib/utils";

export type UpgradeProduct = { id: string; name: string };

type UpgradeContextValue = {
  open: (productName?: string) => void;
};

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

export function useUpgrade(): UpgradeContextValue {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error("useUpgrade must be used within <UpgradeProvider>");
  return ctx;
}

export function UpgradeProvider({
  products,
  children,
}: {
  products: UpgradeProduct[];
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [preselect, setPreselect] = useState<string | undefined>(undefined);

  const open = useCallback((productName?: string) => {
    setPreselect(productName);
    setIsOpen(true);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <UpgradeContext.Provider value={value}>
      {children}
      <UpgradeModalView
        products={products}
        open={isOpen}
        preselect={preselect}
        onClose={() => setIsOpen(false)}
      />
    </UpgradeContext.Provider>
  );
}

function UpgradeModalView({
  products,
  open,
  preselect,
  onClose,
}: {
  products: UpgradeProduct[];
  open: boolean;
  preselect?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [product, setProduct] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = product || preselect || products[0]?.name || "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !selectedProduct) {
      setError("Please fill in all fields.");
      return;
    }
    const url = buildUpgradeWhatsappUrl(name.trim(), selectedProduct, whatsapp.trim());
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
    setName("");
    setWhatsapp("");
    setProduct("");
    setError("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upgrade to PRO"
      subtitle="Fill in your details, we'll continue the upgrade over WhatsApp."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="upgrade-name"
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
        <Input
          id="upgrade-wa"
          label="WhatsApp Number"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="e.g. 0812xxxxxxx"
          inputMode="tel"
          type="tel"
          required
        />
        <Select
          id="upgrade-product"
          label="Product"
          value={selectedProduct}
          onChange={(e) => setProduct(e.target.value)}
        >
          {products.length === 0 && <option value="">No products available</option>}
          {products.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </Select>
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <button
          type="submit"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
        >
          Send via WhatsApp
          <Icon name="arrow-right" size={14} />
        </button>
      </form>
    </Modal>
  );
}
