"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DocSearchDocument } from "@/lib/doc-search";

export function CommandPalette({
  documents,
}: {
  documents: DocSearchDocument[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-4 sm:top-20 z-50 w-full max-w-2xl translate-x-[-50%] p-4 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2">
          <VisuallyHidden>
            <Dialog.Title>Global Command Menu</Dialog.Title>
            <Dialog.Description>
              Search documentation and navigate to pages
            </Dialog.Description>
          </VisuallyHidden>

          <Command className="w-full overflow-hidden bg-background border border-border shadow-2xl">
            <Command.Input
              placeholder="Search docs..."
              className="w-full px-4 py-3 text-lg bg-transparent border-none outline-none text-foreground placeholder:text-zinc-500"
            />
            <Command.List className="max-h-[60vh] overflow-y-auto border-t border-border p-2">
              <Command.Empty className="py-6 text-center text-zinc-500">
                No results found.
              </Command.Empty>

              {documents.map((doc) => (
                <Command.Item
                  key={doc.slug}
                  value={`${doc.title} ${doc.description} ${doc.keywords.join(" ")}`}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/${doc.slug}`);
                  }}
                  className="flex flex-col gap-1 px-3 py-3 cursor-pointer data-[selected='true']:bg-zinc-800/50 text-foreground"
                >
                  <span className="font-medium font-mono text-sm">
                    {doc.title}
                  </span>
                  {doc.description && (
                    <span className="text-xs text-zinc-400 truncate">
                      {doc.description}
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
