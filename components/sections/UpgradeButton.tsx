"use client";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { useUpgrade } from "@/components/sections/UpgradeModal";

type Props = {
  productName?: string;
  children?: React.ReactNode;
} & Omit<ButtonProps, "onClick" | "children" | "href">;

export function UpgradeButton({ productName, children, ...rest }: Props) {
  const { open } = useUpgrade();
  return (
    <Button onClick={() => open(productName)} {...rest}>
      {children ?? "Upgrade to PRO"}
    </Button>
  );
}
