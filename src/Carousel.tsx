import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselItem {
  title: string;
  description?: string;
  image: string;
}

export interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;
  loop?: boolean;
}

interface DragState {
  active: boolean;
  startX: number;
  deltaX: number;
}
export default function Carousel({
  items,
  autoPlay = false,
  interval = 4000,
  loop = true,
}: CarouselProps) {
  const [index, setIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [drag, setDrag] = useState<DragState>({ active: false, startX: 0, deltaX: 0 });
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const count = items.length;

  const goTo = useCallback(
    (i: number) => {
      if (loop) {
        setIndex(((i % count) + count) % count);
      } else {
        setIndex(Math.max(0, Math.min(count - 1, i)));
      }
    },
    [count, loop]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || isHovering || drag.active) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [autoPlay, interval, isHovering, drag.active, next]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  // Drag / swipe handlers
  type PointerLikeEvent =
    | React.MouseEvent<HTMLDivElement>
    | React.TouchEvent<HTMLDivElement>;

  const getClientX = (e: PointerLikeEvent): number =>
    "touches" in e ? e.touches[0]!.clientX : e.clientX;

  const onPointerDown = (e: PointerLikeEvent) => {
    setDrag({ active: true, startX: getClientX(e), deltaX: 0 });
  };

  const onPointerMove = (e: PointerLikeEvent) => {
    if (!drag.active) return;
    const x = getClientX(e);
    setDrag((d) => ({ ...d, deltaX: x - d.startX }));
  };

  const endDrag = () => {
    if (!drag.active) return;
    const threshold = 60;
    if (drag.deltaX > threshold) prev();
    else if (drag.deltaX < -threshold) next();
    setDrag({ active: false, startX: 0, deltaX: 0 });
  };

  const containerWidth = containerRef.current?.offsetWidth || 1;
  const dragPercent = (drag.deltaX / containerWidth) * 100;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Content carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        endDrag();
      }}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 720,
        minWidth: 0,
        boxSizing: "border-box",
        margin: "0 auto",
        outline: "none",
      }}
    >
      {/* Viewport */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          
          userSelect: "none",
          touchAction: "pan-y",
          cursor: drag.active ? "grabbing" : "grab",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={endDrag}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={endDrag}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            width: "100%",
            transform: `translateX(calc(${-index * 100}% + ${dragPercent}%))`,
            transition: drag.active ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                flex: "0 0 100%",
                minWidth: 0,
                maxWidth: "100%",
                aspectRatio: "16 / 9",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <img
                src={item.image}
                alt={item.title}
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
              {/* Readability gradient over the image */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 75%)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "28px 32px",
                  boxSizing: "border-box",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#f5f5f4",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.title}
                </h3>
                {item.description && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 14.5,
                      lineHeight: 1.5,
                      color: "rgba(245,245,244,0.85)",
                      maxWidth: 480,
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Arrows */}
        {(loop || index > 0) && (
          <button
            onClick={prev}
            aria-label="Previous slide"
            style={arrowStyle("left")}
          >
            <ChevronLeft size={20} strokeWidth={2.25} />
          </button>
        )}
        {(loop || index < count - 1) && (
          <button
            onClick={next}
            aria-label="Next slide"
            style={arrowStyle("right")}
          >
            <ChevronRight size={20} strokeWidth={2.25} />
          </button>
        )}
      </div>
      
    </div>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(21,22,26,0.55)",
    color: "#f5f5f4",
    backdropFilter: "blur(6px)",
    cursor: "pointer",
    transition: "background 160ms ease",
  };
  return side === "left" ? { ...base, left: 12 } : { ...base, right: 12 };
}

// --- Demo wrapper (remove or replace with your own data) ---
export function CarouselDemo() {
  const slides: CarouselItem[] = [
    {
      title: "Kyoto, in the rain",
      description: "Quiet streets, wet stone, the smell of cedar.",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    },
    {
      title: "Marrakech markets",
      description: "Copper lanterns and the sound of bargaining.",
      image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&q=80",
    },
    {
      title: "Reykjavik at midnight",
      description: "The sun never quite sets in June.",
      image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200&q=80",
    },
    {
      title: "Lisbon rooftops",
      description: "Tiled façades catching the last light.",
      image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&q=80",
    },
  ];
  return (
    <div style={{ minWidth: 0, width: "100%" }}>
      <Carousel items={slides} />
    </div>
  );
}