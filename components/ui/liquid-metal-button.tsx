"use client";

import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LiquidMetalButtonProps {
    label?: string;
    onClick?: () => void;
    viewMode?: "text" | "icon";
}

export function LiquidMetalButton({
    label = "Get Started",
    onClick,
    viewMode = "text",
}: LiquidMetalButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [ripples, setRipples] = useState<
        Array<{ x: number; y: number; id: number }>
    >([]);
    const shaderRef = useRef<HTMLDivElement>(null);
    const shaderMountRef = useRef<ShaderMount | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleId = useRef(0);
    const isHoveredRef = useRef(false);

    const dimensions = useMemo(() => {
        if (viewMode === "icon") {
            return {
                height: 46,
                innerHeight: 42,
                innerWidth: 42,
                shaderHeight: 46,
                shaderWidth: 46,
                width: 46,
            };
        }
        return {
            height: 46,
            innerHeight: 42,
            innerWidth: 138,
            shaderHeight: 46,
            shaderWidth: 142,
            width: 142,
        };
    }, [viewMode]);

    useEffect(() => {
        const styleId = "shader-canvas-style-exploded";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `;
            document.head.appendChild(style);
        }

        try {
            if (shaderRef.current) {
                shaderMountRef.current?.dispose();
                shaderMountRef.current = new ShaderMount(
                    shaderRef.current,
                    liquidMetalFragmentShader,
                    {
                        u_angle: 45,
                        u_contour: 0,
                        u_distortion: 0,
                        u_offsetX: 0.1,
                        u_offsetY: -0.1,
                        u_repetition: 4,
                        u_scale: 8,
                        u_shape: 1,
                        u_shiftBlue: 0.3,
                        u_shiftRed: 0.3,
                        u_softness: 0.5,
                    },
                    undefined,
                    0.6
                );
            }
        } catch (error) {
            console.error("Failed to load shader:", error);
        }

        return () => {
            shaderMountRef.current?.dispose();
            shaderMountRef.current = null;
        };
    }, []);

    const handleMouseEnter = () => {
        isHoveredRef.current = true;
        setIsHovered(true);
        shaderMountRef.current?.setSpeed(1);
    };

    const handleMouseLeave = () => {
        isHoveredRef.current = false;
        setIsHovered(false);
        setIsPressed(false);
        shaderMountRef.current?.setSpeed(0.6);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (shaderMountRef.current) {
            shaderMountRef.current.setSpeed(2.4);
            setTimeout(() => {
                if (isHoveredRef.current) {
                    shaderMountRef.current?.setSpeed(1);
                } else {
                    shaderMountRef.current?.setSpeed(0.6);
                }
            }, 300);
        }

        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const ripple = { id: rippleId.current++, x, y };

            setRipples((prev) => [...prev, ripple]);
            setTimeout(() => {
                setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
            }, 600);
        }

        onClick?.();
    };

    const ariaLabel = viewMode === "icon" ? label || "Action" : label;

    const outerBoxShadow = useMemo(() => {
        if (isPressed) {
            return "0px 0px 0px 1px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)";
        }
        if (isHovered) {
            return "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 12px 6px 0px rgba(0, 0, 0, 0.05), 0px 8px 5px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.2)";
        }
        return "0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 36px 14px 0px rgba(0, 0, 0, 0.02), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)";
    }, [isHovered, isPressed]);

    return (
        <div className="relative inline-block">
            <div
                style={{
                    perspective: "1000px",
                    perspectiveOrigin: "50% 50%",
                }}
            >
                <div
                    style={{
                        height: `${dimensions.height}px`,
                        position: "relative",
                        transform: "none",
                        transformStyle: "preserve-3d",
                        transition:
                            "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
                        width: `${dimensions.width}px`,
                    }}
                >
                    <div
                        style={{
                            alignItems: "center",
                            display: "flex",
                            gap: "6px",
                            height: `${dimensions.height}px`,
                            justifyContent: "center",
                            left: 0,
                            pointerEvents: "none",
                            position: "absolute",
                            top: 0,
                            transform: "translateZ(20px)",
                            transformStyle: "preserve-3d",
                            transition:
                                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, gap 0.4s ease",
                            width: `${dimensions.width}px`,
                            zIndex: 30,
                        }}
                    >
                        {viewMode === "icon" && (
                            <Sparkles
                                size={16}
                                style={{
                                    color: "#666666",
                                    filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))",
                                    transform: "scale(1)",
                                    transition:
                                        "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                }}
                            />
                        )}
                        {viewMode === "text" && (
                            <span
                                style={{
                                    color: "#666666",
                                    fontSize: "14px",
                                    fontWeight: 400,
                                    textShadow:
                                        "0px 1px 2px rgba(0, 0, 0, 0.5)",
                                    transform: "scale(1)",
                                    transition:
                                        "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </span>
                        )}
                    </div>

                    <div
                        style={{
                            height: `${dimensions.height}px`,
                            left: 0,
                            position: "absolute",
                            top: 0,
                            transform: `translateZ(10px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
                            transformStyle: "preserve-3d",
                            transition:
                                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
                            width: `${dimensions.width}px`,
                            zIndex: 20,
                        }}
                    >
                        <div
                            style={{
                                background:
                                    "linear-gradient(180deg, #202020 0%, #000000 100%)",
                                borderRadius: "100px",
                                boxShadow: isPressed
                                    ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                                    : "none",
                                height: `${dimensions.innerHeight}px`,
                                margin: "2px",
                                transition:
                                    "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                width: `${dimensions.innerWidth}px`,
                            }}
                        />
                    </div>

                    <div
                        style={{
                            height: `${dimensions.height}px`,
                            left: 0,
                            position: "absolute",
                            top: 0,
                            transform: `translateZ(0px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
                            transformStyle: "preserve-3d",
                            transition:
                                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
                            width: `${dimensions.width}px`,
                            zIndex: 10,
                        }}
                    >
                        <div
                            style={{
                                background: "rgb(0 0 0 / 0)",
                                borderRadius: "100px",
                                boxShadow: outerBoxShadow,
                                height: `${dimensions.height}px`,
                                transition:
                                    "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                width: `${dimensions.width}px`,
                            }}
                        >
                            <div
                                className="shader-container-exploded"
                                ref={shaderRef}
                                style={{
                                    borderRadius: "100px",
                                    height: `${dimensions.shaderHeight}px`,
                                    maxWidth: `${dimensions.shaderWidth}px`,
                                    overflow: "hidden",
                                    position: "relative",
                                    transition:
                                        "width 0.4s ease, height 0.4s ease",
                                    width: `${dimensions.shaderWidth}px`,
                                }}
                            />
                        </div>
                    </div>

                    <button
                        aria-label={ariaLabel}
                        onClick={handleClick}
                        onMouseDown={() => setIsPressed(true)}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={() => setIsPressed(false)}
                        ref={buttonRef}
                        style={{
                            background: "transparent",
                            border: "none",
                            borderRadius: "100px",
                            cursor: "pointer",
                            height: `${dimensions.height}px`,
                            left: 0,
                            outline: "none",
                            overflow: "hidden",
                            position: "absolute",
                            top: 0,
                            transform: "translateZ(25px)",
                            transformStyle: "preserve-3d",
                            transition:
                                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
                            width: `${dimensions.width}px`,
                            zIndex: 40,
                        }}
                        type="button"
                    >
                        {ripples.map((ripple) => (
                            <span
                                key={ripple.id}
                                style={{
                                    animation: "ripple-animation 0.6s ease-out",
                                    background:
                                        "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)",
                                    borderRadius: "50%",
                                    height: "20px",
                                    left: `${ripple.x}px`,
                                    pointerEvents: "none",
                                    position: "absolute",
                                    top: `${ripple.y}px`,
                                    width: "20px",
                                }}
                            />
                        ))}
                    </button>
                </div>
            </div>
        </div>
    );
}
