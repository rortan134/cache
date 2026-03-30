"use client";

import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type {
    ComponentProps,
    CSSProperties,
    MouseEvent as ReactMouseEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type LiquidMetalButtonProps = ComponentProps<"button"> & {
    viewMode?: "text" | "icon";
};

function LiquidMetalButton({
    children = "Get Started",
    onClick,
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onMouseUp,
    style,
    type = "button",
    viewMode = "text",
    "aria-label": ariaLabelProp,
    ...rest
}: LiquidMetalButtonProps) {
    const [isPressed, setIsPressed] = useState(false);
    const shaderRef = useRef<HTMLDivElement>(null);
    const shaderMountRef = useRef<ShaderMount | null>(null);
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

    const handleMouseEnter = (e: ReactMouseEvent<HTMLButtonElement>) => {
        isHoveredRef.current = true;
        shaderMountRef.current?.setSpeed(1);
        onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: ReactMouseEvent<HTMLButtonElement>) => {
        isHoveredRef.current = false;
        setIsPressed(false);
        shaderMountRef.current?.setSpeed(0.6);
        onMouseLeave?.(e);
    };

    const handleMouseDown = (e: ReactMouseEvent<HTMLButtonElement>) => {
        setIsPressed(true);
        onMouseDown?.(e);
    };

    const handleMouseUp = (e: ReactMouseEvent<HTMLButtonElement>) => {
        setIsPressed(false);
        onMouseUp?.(e);
    };

    const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
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

        onClick?.(e);
    };

    let fallbackAria: string | undefined;
    if (typeof children === "string" && children.trim() !== "") {
        fallbackAria = children;
    } else if (viewMode === "icon") {
        fallbackAria = "Action";
    }
    const ariaLabelResolved = ariaLabelProp ?? fallbackAria;

    const buttonStyle: CSSProperties = {
        background: "transparent",
        border: "none",
        borderRadius: "100px",
        cursor: "pointer",
        height: `${dimensions.height}px`,
        left: 0,
        outline: "none",
        position: "absolute",
        top: 0,
        transition: "width 0.4s ease, height 0.4s ease",
        width: `${dimensions.width}px`,
        zIndex: 40,
        ...style,
    };

    return (
        <div className="relative inline-block invert">
            {/* Flat stacking (no perspective / translateZ): 3D transforms rasterize
                text on the GPU and make labels look blurry in Chromium/WebKit. */}
            <div
                style={{
                    height: `${dimensions.height}px`,
                    isolation: "isolate",
                    position: "relative",
                    transition: "width 0.4s ease, height 0.4s ease",
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
                        transition:
                            "width 0.4s ease, height 0.4s ease, gap 0.4s ease",
                        width: `${dimensions.width}px`,
                        zIndex: 30,
                    }}
                >
                    {viewMode === "icon" && (
                        <Sparkles
                            size={16}
                            strokeWidth={2.5}
                            style={{ color: "#ffffff" }}
                        />
                    )}
                    {viewMode === "text" && (
                        <span
                            style={{
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {children}
                        </span>
                    )}
                </div>

                <div
                    style={{
                        height: `${dimensions.height}px`,
                        left: 0,
                        position: "absolute",
                        top: 0,
                        transform: isPressed
                            ? "translateY(1px) scale(0.98)"
                            : "translateY(0) scale(1)",
                        transition:
                            "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
                        width: `${dimensions.width}px`,
                        zIndex: 20,
                    }}
                >
                    <div
                        style={{
                            background:
                                "linear-gradient(180deg, #202020 0%, #000000 100%)",
                            borderRadius: "100px",
                            boxShadow: "none",
                            height: `${dimensions.innerHeight}px`,
                            margin: "2px",
                            transition: "width 0.4s ease, height 0.4s ease",
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
                        transform: isPressed
                            ? "translateY(1px) scale(0.98)"
                            : "translateY(0) scale(1)",
                        transition:
                            "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
                        width: `${dimensions.width}px`,
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            background: "rgb(0 0 0 / 0)",
                            borderRadius: "100px",
                            boxShadow: "none",
                            height: `${dimensions.height}px`,
                            transition: "width 0.4s ease, height 0.4s ease",
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
                                transition: "width 0.4s ease, height 0.4s ease",
                                width: `${dimensions.shaderWidth}px`,
                            }}
                        />
                    </div>
                </div>

                <button
                    {...rest}
                    aria-label={ariaLabelResolved}
                    onClick={handleClick}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    style={buttonStyle}
                    type={type}
                />
            </div>
        </div>
    );
}

export { LiquidMetalButton };
