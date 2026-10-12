"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function DataTableInteractiveRow({
  children,
  drawerContent,
  drawerTitle = "Detail Data",
  className,
}: {
  children: React.ReactNode;
  drawerContent?: React.ReactNode;
  drawerTitle?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest(
              "a, button, input, select, textarea, [role='button'], [data-no-drawer]"
            )
          ) {
            return;
          }
          if (drawerContent) setOpen(true);
        }}
        className={cn(
          className,
          drawerContent && "cursor-pointer hover:bg-primary-soft/40"
        )}
      >
        {children}
      </tr>
      {drawerContent && (
        <Drawer open={open} onClose={() => setOpen(false)} title={drawerTitle}>
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}

export function DataTableInteractiveCard({
  children,
  drawerContent,
  drawerTitle = "Detail Data",
  className,
}: {
  children: React.ReactNode;
  drawerContent?: React.ReactNode;
  drawerTitle?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest(
              "a, button, input, select, textarea, [role='button'], [data-no-drawer]"
            )
          ) {
            return;
          }
          if (drawerContent) setOpen(true);
        }}
        className={cn(
          className,
          drawerContent && "cursor-pointer hover:bg-primary-soft/30 active:bg-surface-sunken-ed"
        )}
      >
        {children}
      </div>
      {drawerContent && (
        <Drawer open={open} onClose={() => setOpen(false)} title={drawerTitle}>
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
