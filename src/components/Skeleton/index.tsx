export function Skeleton({ width, height, rounded }: { width?: string | number; height?: string | number; rounded?: boolean }) {
  return (
    <div style={{
      width: width || '100%',
      height: height || 20,
      background: 'linear-gradient(90deg, var(--yellow-mid) 25%, var(--yellow-deep) 50%, var(--yellow-mid) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: rounded ? 99 : 8,
    }} />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ padding: 24, background: 'var(--yellow-soft)', borderRadius: 16, border: '2px solid var(--line)' }}>
      <Skeleton height={24} width="60%" />
      <div style={{ marginTop: 12 }}><Skeleton height={16} width="80%" /></div>
      <div style={{ marginTop: 8 }}><Skeleton height={16} width="40%" /></div>
    </div>
  );
}
