type Props = {
  src: string | null | undefined;
};

export default function AudioPlayer({ src }: Props) {
  if (!src) return null;
  return (
    <audio controls preload="none">
      <source src={src} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}

