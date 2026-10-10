import "./RabbitHero.css";

export default function RabbitHero() {
  return (
    <div className="rabbit-hero">
      <video
        className="rabbit-hero__video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="Smiling rabbit holding a carrot"
      >
        <source src="/rabbit-cropped.webm" type="video/webm" />
        <source src="/rabbit.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
