import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import { LazyIcon } from "../../icons";
import { AppTheme } from "../../../types/app";
import { AnimatePresence } from "framer-motion";

export type Props = {
    theme: AppTheme;
    onSelect: (value: AppTheme) => void;
    isSelected: boolean;
} & Omit<React.ComponentPropsWithoutRef<"div">, "onSelect">;

export function ThemeSelectRadioItem(props: Props) {
    const { theme, onSelect, isSelected, className, ...rest } = props;
    return (
        <div
            data-selected={isSelected}
            className={cn(
                "relative flex flex-col items-center gap-3 cursor-pointer group",
                className,
            )}
            onClick={() => onSelect(theme)}
            {...rest}
        >
            <div
                className={cn(
                    "bg-card shadow-sm lg:size-52 size-40 overflow-hidden xl:size-56 border rounded-2xl border-border p-4 transition-all",
                    "hover:border-input outline-2 outline-transparent",
                    isSelected && "outline-success outline-offset-2",
                    theme === "dark" && "dark",
                )}
                style={
                    theme === "light"
                        ? ({
                              "--card": "#f5f5f5",
                              "--border": "#e5e7eb",
                          } as React.CSSProperties)
                        : {}
                }
            >
                <div
                    className={cn(
                        "relative flex h-full flex-1 gap-2",
                        theme === "auto" && "z-10",
                    )}
                >
                    {/* Left Panel Preview */}
                    <div
                        className="relative flex w-full max-w-72 flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm"
                        style={
                            theme === "auto"
                                ? ({
                                      "--card": "#f5f5f5",
                                      "--card-foreground": "#0f172a",
                                      "--primary": "#0f172a",
                                  } as React.CSSProperties)
                                : {}
                        }
                    >
                        <div className="flex-1 p-0">
                            <div className="divide-y divide-border">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 p-3"
                                    >
                                        <div className="bg-muted-foreground/40 size-2 rounded-xs"></div>
                                        <div className="h-1 rounded-full bg-muted-foreground/40 flex-1"></div>
                                        <div className="h-1 rounded-full bg-muted-foreground/20 flex-1"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Right Panel Preview */}
                    <div
                        className="relative flex w-full flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm h-full max-w-1/3"
                        style={
                            theme === "auto"
                                ? ({
                                      "--card": "#161616",
                                      "--card-foreground": "#f8f8f8",
                                      "--primary": "white",
                                  } as React.CSSProperties)
                                : {}
                        }
                    >
                        <div className="flex-1 flex flex-col gap-3 p-3">
                            <div className="flex flex-1 flex-col gap-2">
                                <div className="h-1 rounded-full bg-muted-foreground/40 w-[60%]"></div>
                                <div className="h-1 rounded-full bg-muted-foreground/20"></div>
                            </div>
                            <div className="flex items-center justify-end">
                                <div className="h-3 w-6 rounded-xs bg-primary"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.5,
                                filter: "blur(4px)",
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.5,
                                filter: "blur(4px)",
                            }}
                            transition={{ duration: 0.325, ease: "easeInOut" }}
                            className="absolute -top-3 -right-3 rounded-full border-card border-2 bg-card"
                        >
                            <LazyIcon
                                name="CheckCircle"
                                weight="fill"
                                className="text-success size-6"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <span
                className={cn(
                    "text-sm font-medium capitalize",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                )}
            >
                {theme}
            </span>
        </div>
    );
}
